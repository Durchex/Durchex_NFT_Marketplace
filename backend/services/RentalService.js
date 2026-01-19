/**
 * RentalService.js
 * Backend service for ERC-4907 NFT rental functionality
 * Handles rental listings, agreements, and payments
 */

const ethers = require('ethers');
const RentalModel = require('../models/rentalModel');
const NFTModel = require('../models/nftModel');
const UserModel = require('../models/userModel');

class RentalService {
  constructor(contractAddress, contractABI, provider, signer) {
    this.contractAddress = contractAddress;
    this.contract = new ethers.Contract(contractAddress, contractABI, signer);
    this.provider = provider;
    this.signer = signer;
  }

  /**
   * Create rental listing
   * @param {string} nftAddress NFT contract address
   * @param {number} tokenId NFT token ID
   * @param {number} pricePerDay Price per day in wei
   * @param {number} minDays Minimum rental period
   * @param {number} maxDays Maximum rental period
   * @param {string} userId User ID creating listing
   */
  async createRentalListing(
    nftAddress,
    tokenId,
    pricePerDay,
    minDays,
    maxDays,
    userId
  ) {
    try {
      // Validate inputs
      if (!ethers.isAddress(nftAddress)) {
        throw new Error('Invalid NFT contract address');
      }
      if (pricePerDay <= 0 || minDays <= 0 || maxDays <= 0) {
        throw new Error('Invalid rental parameters');
      }
      if (minDays > maxDays) {
        throw new Error('Minimum days cannot exceed maximum days');
      }

      // Check NFT ownership on-chain
      const nftContract = new ethers.Contract(
        nftAddress,
        ['function ownerOf(uint256) public view returns (address)'],
        this.provider
      );
      const owner = await nftContract.ownerOf(tokenId);
      const signerAddress = await this.signer.getAddress();
      
      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error('Not NFT owner');
      }

      // Create on-chain listing via contract
      const tx = await this.contract.listForRental(
        tokenId,
        ethers.parseUnits(pricePerDay.toString(), 'wei'),
        minDays,
        maxDays
      );
      
      const receipt = await tx.wait();
      
      // Save to database
      const rentalListing = new RentalModel({
        userId,
        nftAddress,
        tokenId,
        pricePerDay: ethers.parseUnits(pricePerDay.toString(), 'wei'),
        minDays,
        maxDays,
        active: true,
        contractTx: receipt.hash,
        blockNumber: receipt.blockNumber,
        createdAt: new Date(),
        totalRentals: 0,
        totalEarnings: 0n,
      });

      await rentalListing.save();

      // Update NFT with rental info
      await NFTModel.findByIdAndUpdate(
        { contractAddress: nftAddress, tokenId },
        {
          rentalListingId: rentalListing._id,
          isListed: true,
        }
      );

      return {
        success: true,
        listingId: rentalListing._id,
        transactionHash: receipt.hash,
        listing: rentalListing,
      };
    } catch (error) {
      console.error('Error creating rental listing:', error);
      throw error;
    }
  }

  /**
   * Remove rental listing
   * @param {string} listingId Rental listing ID
   * @param {string} userId User ID removing listing
   */
  async removeRentalListing(listingId, userId) {
    try {
      const listing = await RentalModel.findById(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }
      if (listing.userId.toString() !== userId) {
        throw new Error('Not listing owner');
      }

      // Call contract to remove listing
      const tx = await this.contract.removeRentalListing(listing.tokenId);
      const receipt = await tx.wait();

      // Update database
      listing.active = false;
      listing.removedAt = new Date();
      listing.removeTx = receipt.hash;
      await listing.save();

      // Update NFT
      await NFTModel.findByIdAndUpdate(
        { contractAddress: listing.nftAddress, tokenId: listing.tokenId },
        {
          isListed: false,
          rentalListingId: null,
        }
      );

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error removing rental listing:', error);
      throw error;
    }
  }

  /**
   * Rent an NFT
   * @param {string} listingId Rental listing ID
   * @param {number} rentalDays Number of days to rent
   * @param {string} renterId User ID renting
   * @param {number} paymentAmount Payment amount in wei
   */
  async rentNFT(listingId, rentalDays, renterId, paymentAmount) {
    try {
      const listing = await RentalModel.findById(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }
      if (!listing.active) {
        throw new Error('Listing is not active');
      }

      // Calculate required payment
      const totalPrice = listing.pricePerDay * BigInt(rentalDays);
      if (BigInt(paymentAmount) < totalPrice) {
        throw new Error('Insufficient payment');
      }

      // Call contract to rent NFT
      const tx = await this.contract.rentNFT(listing.tokenId, rentalDays, {
        value: totalPrice,
      });
      const receipt = await tx.wait();

      // Parse rental agreement from events
      const rentalStartedEvent = receipt.logs
        .map(log => {
          try {
            return this.contract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(event => event?.name === 'RentalStarted');

      if (!rentalStartedEvent) {
        throw new Error('Rental event not emitted');
      }

      const expirationTime = parseInt(rentalStartedEvent.args[4]);
      
      // Create rental agreement in database
      const rentalAgreement = new RentalModel({
        userId: listing.userId,
        renterId,
        nftAddress: listing.nftAddress,
        tokenId: listing.tokenId,
        listingId,
        pricePerDay: listing.pricePerDay,
        totalDays: rentalDays,
        totalPrice,
        startTime: new Date(),
        endTime: new Date(expirationTime * 1000),
        status: 'active',
        contractTx: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      await rentalAgreement.save();

      // Update listing with rental count
      listing.totalRentals = (listing.totalRentals || 0) + 1;
      listing.totalEarnings = (listing.totalEarnings || 0n) + totalPrice;
      await listing.save();

      // Update user rental history
      await UserModel.findByIdAndUpdate(renterId, {
        $push: {
          rentalHistory: {
            listingId,
            rentalAgreementId: rentalAgreement._id,
            rentedAt: new Date(),
            expiresAt: new Date(expirationTime * 1000),
          },
        },
      });

      return {
        success: true,
        rentalAgreementId: rentalAgreement._id,
        transactionHash: receipt.hash,
        expirationTime: new Date(expirationTime * 1000),
      };
    } catch (error) {
      console.error('Error renting NFT:', error);
      throw error;
    }
  }

  /**
   * End rental (auto-called after expiration)
   * @param {string} rentalAgreementId Rental agreement ID
   */
  async endRental(rentalAgreementId) {
    try {
      const agreement = await RentalModel.findById(rentalAgreementId);
      if (!agreement) {
        throw new Error('Rental agreement not found');
      }

      // Call contract to end rental
      const tx = await this.contract.endRental(agreement.tokenId);
      const receipt = await tx.wait();

      // Update database
      agreement.status = 'completed';
      agreement.endTx = receipt.hash;
      agreement.completedAt = new Date();
      await agreement.save();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error ending rental:', error);
      throw error;
    }
  }

  /**
   * Cancel rental (owner refunds renter)
   * @param {string} rentalAgreementId Rental agreement ID
   * @param {string} userId User ID cancelling
   */
  async cancelRental(rentalAgreementId, userId) {
    try {
      const agreement = await RentalModel.findById(rentalAgreementId);
      if (!agreement) {
        throw new Error('Rental agreement not found');
      }
      if (agreement.userId.toString() !== userId) {
        throw new Error('Not rental owner');
      }
      if (agreement.status !== 'active') {
        throw new Error('Rental is not active');
      }

      // Call contract to cancel and refund
      const tx = await this.contract.cancelRental(agreement.tokenId);
      const receipt = await tx.wait();

      // Update database
      agreement.status = 'cancelled';
      agreement.cancelledAt = new Date();
      agreement.cancelTx = receipt.hash;
      await agreement.save();

      return {
        success: true,
        transactionHash: receipt.hash,
        refundAmount: agreement.totalPrice,
      };
    } catch (error) {
      console.error('Error cancelling rental:', error);
      throw error;
    }
  }

  /**
   * Calculate rental price
   * @param {string} listingId Rental listing ID
   * @param {number} rentalDays Number of days
   */
  async calculateRentalPrice(listingId, rentalDays) {
    try {
      const listing = await RentalModel.findById(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      // Validate rental period
      if (rentalDays < listing.minDays || rentalDays > listing.maxDays) {
        throw new Error(`Rental days must be between ${listing.minDays} and ${listing.maxDays}`);
      }

      // Get pricing from contract
      const [totalPrice, platformFee, ownerPayment] = await this.contract.calculateRentalPrice(
        listing.tokenId,
        rentalDays
      );

      return {
        rentalDays,
        pricePerDay: listing.pricePerDay.toString(),
        totalPrice: totalPrice.toString(),
        platformFee: platformFee.toString(),
        ownerPayment: ownerPayment.toString(),
      };
    } catch (error) {
      console.error('Error calculating rental price:', error);
      throw error;
    }
  }

  /**
   * Get active rental for NFT
   * @param {string} listingId Rental listing ID
   */
  async getActiveRental(listingId) {
    try {
      const listing = await RentalModel.findById(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      // Check on-chain status
      const rentalData = await this.contract.getActiveRental(listing.tokenId);
      
      const activeAgreement = await RentalModel.findOne({
        listingId,
        status: 'active',
      });

      return {
        listing: listing.toObject(),
        activeAgreement: activeAgreement ? activeAgreement.toObject() : null,
        isRented: activeAgreement ? true : false,
      };
    } catch (error) {
      console.error('Error getting active rental:', error);
      throw error;
    }
  }

  /**
   * Get listing details
   * @param {string} listingId Listing ID
   */
  async getListingDetails(listingId) {
    try {
      const listing = await RentalModel.findById(listingId)
        .populate('userId', 'username avatar')
        .populate('renterId', 'username avatar');

      if (!listing) {
        throw new Error('Listing not found');
      }

      const nft = await NFTModel.findOne({
        contractAddress: listing.nftAddress,
        tokenId: listing.tokenId,
      });

      return {
        listing: listing.toObject(),
        nft: nft ? nft.toObject() : null,
      };
    } catch (error) {
      console.error('Error getting listing details:', error);
      throw error;
    }
  }

  /**
   * Get user rental listings
   * @param {string} userId User ID
   * @param {object} options Query options
   */
  async getUserListings(userId, options = {}) {
    try {
      const { active = true, page = 1, limit = 20 } = options;

      const query = { userId, active };
      const skip = (page - 1) * limit;

      const listings = await RentalModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await RentalModel.countDocuments(query);

      return {
        listings,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error getting user listings:', error);
      throw error;
    }
  }

  /**
   * Get user rental history
   * @param {string} userId User ID
   * @param {object} options Query options
   */
  async getUserRentals(userId, options = {}) {
    try {
      const { status = 'all', page = 1, limit = 20 } = options;

      const query = { renterId: userId };
      if (status !== 'all') {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      const rentals = await RentalModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ startTime: -1 });

      const total = await RentalModel.countDocuments(query);

      return {
        rentals,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error getting user rentals:', error);
      throw error;
    }
  }

  /**
   * Get rental earnings for user
   * @param {string} userId User ID
   */
  async getUserEarnings(userId) {
    try {
      const listings = await RentalModel.find({ userId });

      let totalEarnings = 0n;
      let totalRentals = 0;
      const earnings = [];

      for (const listing of listings) {
        if (listing.active && listing.totalEarnings) {
          totalEarnings += BigInt(listing.totalEarnings);
          totalRentals += listing.totalRentals || 0;
          earnings.push({
            listingId: listing._id,
            nftAddress: listing.nftAddress,
            tokenId: listing.tokenId,
            earnings: listing.totalEarnings.toString(),
            rentals: listing.totalRentals,
          });
        }
      }

      return {
        totalEarnings: totalEarnings.toString(),
        totalRentals,
        earnings,
      };
    } catch (error) {
      console.error('Error getting user earnings:', error);
      throw error;
    }
  }

  /**
   * Withdraw owner earnings
   * @param {string} userId User ID
   * @param {bigint} amount Amount to withdraw
   */
  async withdrawEarnings(userId, amount) {
    try {
      const tx = await this.contract.withdrawEarnings(amount);
      const receipt = await tx.wait();

      // Record withdrawal
      await UserModel.findByIdAndUpdate(userId, {
        $push: {
          withdrawals: {
            amount: amount.toString(),
            tx: receipt.hash,
            timestamp: new Date(),
          },
        },
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        amount: amount.toString(),
      };
    } catch (error) {
      console.error('Error withdrawing earnings:', error);
      throw error;
    }
  }

  /**
   * Get available listings
   * @param {object} options Query options
   */
  async getAvailableListings(options = {}) {
    try {
      const { page = 1, limit = 20, nftAddress = null } = options;

      const query = { active: true };
      if (nftAddress) {
        query.nftAddress = nftAddress.toLowerCase();
      }

      const skip = (page - 1) * limit;

      const listings = await RentalModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('userId', 'username avatar');

      const total = await RentalModel.countDocuments(query);

      return {
        listings,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error getting available listings:', error);
      throw error;
    }
  }

  /**
   * Update platform fee percentage (owner only)
   * @param {number} percentage New percentage (0-10000)
   */
  async updatePlatformFeePercentage(percentage) {
    try {
      if (percentage < 0 || percentage > 10000) {
        throw new Error('Percentage must be between 0 and 10000');
      }

      const tx = await this.contract.setPlatformFeePercentage(percentage);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        newPercentage: percentage,
      };
    } catch (error) {
      console.error('Error updating platform fee:', error);
      throw error;
    }
  }
}

module.exports = RentalService;
