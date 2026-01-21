import logger from '../utils/logger.js';
import { ethers } from 'ethers';

class RentalService {
  constructor() {
    this.rentalABI = [];
  }

  /**
   * Create rental listing
   */
  async createListing(listingData, userAddress, rentalContractAddress, signer) {
    try {
      const {
        nftContract,
        tokenId,
        dailyPrice,
        minDays,
        maxDays,
      } = listingData;

      const contract = new ethers.Contract(
        rentalContractAddress,
        this.rentalABI,
        signer
      );

      const priceInWei = ethers.parseEther(dailyPrice.toString());

      const tx = await contract.createListing(
        nftContract,
        tokenId,
        priceInWei,
        minDays,
        maxDays
      );

      const receipt = await tx.wait();

      logger.info('Rental listing created:', {
        user: userAddress,
        nft: `${nftContract}#${tokenId}`,
        dailyPrice,
        minDays,
        maxDays,
      });

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        message: 'Listing created successfully',
      };
    } catch (error) {
      logger.error('Error creating listing:', error);
      throw error;
    }
  }

  /**
   * Place rental bid
   */
  async placeBid(bidData, userAddress, rentalContractAddress, signer) {
    try {
      const {
        listingId,
        rentalDays,
        totalPrice,
      } = bidData;

      const contract = new ethers.Contract(
        rentalContractAddress,
        this.rentalABI,
        signer
      );

      const priceInWei = ethers.parseEther(totalPrice.toString());

      const tx = await contract.createBid(
        listingId,
        rentalDays,
        ethers.ZeroAddress,
        { value: priceInWei }
      );

      const receipt = await tx.wait();

      logger.info('Rental bid placed:', {
        user: userAddress,
        listingId,
        rentalDays,
        totalPrice,
      });

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        message: 'Bid placed successfully',
      };
    } catch (error) {
      logger.error('Error placing bid:', error);
      throw error;
    }
  }

  /**
   * Accept rental bid
   */
  async acceptBid(bidId, userAddress, rentalContractAddress, signer) {
    try {
      const contract = new ethers.Contract(
        rentalContractAddress,
        this.rentalABI,
        signer
      );

      const tx = await contract.acceptBid(bidId);
      const receipt = await tx.wait();

      logger.info('Rental bid accepted:', {
        user: userAddress,
        bidId,
      });

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        message: 'Bid accepted, rental started',
      };
    } catch (error) {
      logger.error('Error accepting bid:', error);
      throw error;
    }
  }

  /**
   * Return rented NFT
   */
  async returnNFT(rentalId, userAddress, rentalContractAddress, signer) {
    try {
      const contract = new ethers.Contract(
        rentalContractAddress,
        this.rentalABI,
        signer
      );

      const tx = await contract.returnNFT(rentalId);
      const receipt = await tx.wait();

      logger.info('NFT returned:', {
        user: userAddress,
        rentalId,
      });

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        message: 'NFT returned successfully',
      };
    } catch (error) {
      logger.error('Error returning NFT:', error);
      throw error;
    }
  }

  /**
   * Get user listings
   */
  async getUserListings(userAddress, rentalContractAddress, provider) {
    try {
      const contract = new ethers.Contract(
        rentalContractAddress,
        this.rentalABI,
        provider
      );

      const listingIds = await contract.getUserListings(userAddress);
      return listingIds.map((id) => id.toString());
    } catch (error) {
      logger.error('Error fetching user listings:', error);
      throw error;
    }
  }

  /**
   * Get user active rentals
   */
  async getUserRentals(userAddress, rentalContractAddress, provider) {
    try {
      const contract = new ethers.Contract(
        rentalContractAddress,
        this.rentalABI,
        provider
      );

      const rentalIds = await contract.getUserRentals(userAddress);
      const rentals = [];

      for (const id of rentalIds) {
        const rental = await contract.getRentalDetails(id);
        rentals.push({
          rentalId: id.toString(),
          renter: rental.renter,
          owner: rental.owner,
          nftContract: rental.nftContract,
          tokenId: rental.tokenId.toString(),
          dailyPrice: ethers.formatEther(rental.dailyPrice),
          startDate: new Date(rental.startDate * 1000),
          endDate: new Date(rental.endDate * 1000),
          totalPrice: ethers.formatEther(rental.totalPrice),
          returned: rental.returned,
        });
      }

      return rentals;
    } catch (error) {
      logger.error('Error fetching user rentals:', error);
      throw error;
    }
  }

  /**
   * Get user pending bids
   */
  async getUserBids(userAddress, rentalContractAddress, provider) {
    try {
      const contract = new ethers.Contract(
        rentalContractAddress,
        this.rentalABI,
        provider
      );

      const bidIds = await contract.getUserBids(userAddress);
      return bidIds.map((id) => id.toString());
    } catch (error) {
      logger.error('Error fetching user bids:', error);
      throw error;
    }
  }

  /**
   * Get user reputation
   */
  async getUserReputation(userAddress, rentalContractAddress, provider) {
    try {
      const contract = new ethers.Contract(
        rentalContractAddress,
        this.rentalABI,
        provider
      );

      const reputation = await contract.getReputation(userAddress);
      return reputation.toNumber();
    } catch (error) {
      logger.error('Error fetching reputation:', error);
      throw error;
    }
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(rentalContractAddress, provider) {
    try {
      const contract = new ethers.Contract(
        rentalContractAddress,
        this.rentalABI,
        provider
      );

      const stats = await contract.getStats();

      return {
        totalListings: stats.listings.toString(),
        totalBids: stats.bids.toString(),
        totalRentals: stats.rentals.toString(),
        totalFeesCollected: ethers.formatEther(stats.feesCollected),
      };
    } catch (error) {
      logger.error('Error fetching marketplace stats:', error);
      throw error;
    }
  }

  /**
   * Calculate rental costs
   */
  calculateRentalCost(dailyPrice, rentalDays, feePercentage) {
    try {
      const basePrice = dailyPrice * rentalDays;
      const platformFee = (basePrice * feePercentage) / 10000;
      const ownerEarnings = basePrice - platformFee;

      return {
        basePrice: basePrice.toFixed(6),
        platformFee: platformFee.toFixed(6),
        ownerEarnings: ownerEarnings.toFixed(6),
        totalPrice: basePrice.toFixed(6),
      };
    } catch (error) {
      logger.error('Error calculating rental cost:', error);
      throw error;
    }
  }

  /**
   * Get available rental dates
   */
  async getAvailableDates(listingId, rentalContractAddress, provider) {
    try {
      // In production, check blockchain for conflicting rentals
      const today = new Date();
      const availableDates = [];

      for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        availableDates.push(date);
      }

      return availableDates;
    } catch (error) {
      logger.error('Error fetching available dates:', error);
      throw error;
    }
  }

  /**
   * Validate rental request
   */
  validateRentalRequest(rentalData) {
    try {
      const { rentalDays, dailyPrice } = rentalData;

      const errors = [];

      if (!rentalDays || rentalDays <= 0) {
        errors.push('Rental days must be greater than 0');
      }

      if (!dailyPrice || dailyPrice <= 0) {
        errors.push('Daily price must be greater than 0');
      }

      if (rentalDays > 365) {
        errors.push('Rental period cannot exceed 365 days');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Error validating rental request:', error);
      return {
        valid: false,
        errors: ['Validation error'],
      };
    }
  }

  /**
   * Get rental suggestions based on history
   */
  async getRentalSuggestions(userAddress, limit = 10) {
    try {
      // In production, use recommendation algorithm
      const suggestions = [
        {
          listingId: 1,
          tokenId: '123',
          dailyPrice: 0.5,
          rating: 4.8,
          rentalCount: 45,
        },
        {
          listingId: 2,
          tokenId: '456',
          dailyPrice: 1.0,
          rating: 4.6,
          rentalCount: 32,
        },
      ];

      return suggestions.slice(0, limit);
    } catch (error) {
      logger.error('Error fetching rental suggestions:', error);
      throw error;
    }
  }
}

const rentalServiceInstance = new RentalService();
export default rentalServiceInstance;
