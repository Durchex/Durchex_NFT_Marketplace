import Listing from '../models/listingModel.js';
import Offer from '../models/offerModel.js';
import { nftModel as NFT } from '../models/nftModel.js';
import { ethers } from 'ethers';
import { getContractAddresses } from '../utils/contractAddresses.js';

// Get marketplace contract address for network
function getMarketplaceContract(network) {
  const addresses = getContractAddresses(network);
  return addresses?.marketplaceV2 || addresses?.marketplace;
}

// Create a new listing
export const createListing = async (req, res) => {
  try {
    const {
      seller,
      nftContract,
      tokenId,
      quantity = 1,
      price,
      startTime,
      endTime,
      paymentToken = '0x0000000000000000000000000000000000000000',
      isERC1155 = false,
      signature,
      nonce,
      network
    } = req.body;

    // Validate required fields
    if (!seller || !nftContract || !tokenId || !price || !signature || !network) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get the next listing ID
    const lastListing = await Listing.findOne({}, {}, { sort: { 'listingId': -1 } });
    const listingId = lastListing ? lastListing.listingId + 1 : 1;

    const marketplaceContract = getMarketplaceContract(network);

    // Create listing
    const listing = new Listing({
      listingId,
      seller: seller.toLowerCase(),
      nftContract: nftContract.toLowerCase(),
      tokenId,
      quantity,
      price,
      startTime: startTime ? new Date(startTime * 1000) : new Date(),
      endTime: endTime ? new Date(endTime * 1000) : null,
      paymentToken: paymentToken.toLowerCase(),
      isERC1155,
      active: true,
      signature,
      nonce,
      network: network.toLowerCase(),
      marketplaceContract
    });

    await listing.save();

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing: {
        listingId,
        seller,
        nftContract,
        tokenId,
        quantity,
        price,
        startTime,
        endTime,
        paymentToken,
        isERC1155,
        network,
        marketplaceContract
      }
    });

  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create listing',
      error: error.message
    });
  }
};

// Get listings with filters
export const getListings = async (req, res) => {
  try {
    const {
      network,
      nftContract,
      tokenId,
      seller,
      active = true,
      offset = 0,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { active };

    if (network) query.network = network.toLowerCase();
    if (nftContract) query.nftContract = nftContract.toLowerCase();
    if (tokenId) query.tokenId = tokenId;
    if (seller) query.seller = seller.toLowerCase();

    // Filter out expired auctions
    const now = new Date();
    query.$or = [
      { endTime: null }, // Fixed price listings
      { endTime: { $gt: now } } // Active auctions
    ];

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const listings = await Listing.find(query)
      .sort(sortOptions)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('nft', 'name image collectionName');

    const total = await Listing.countDocuments(query);

    res.json({
      success: true,
      listings,
      pagination: {
        total,
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listings',
      error: error.message
    });
  }
};

// Get single listing
export const getListing = async (req, res) => {
  try {
    const { listingId } = req.params;

    const listing = await Listing.findOne({ listingId: parseInt(listingId) });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      listing
    });

  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing',
      error: error.message
    });
  }
};

// Cancel listing
export const cancelListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { seller } = req.body;

    const listing = await Listing.findOne({ listingId: parseInt(listingId) });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.seller !== seller.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this listing'
      });
    }

    listing.active = false;
    await listing.save();

    res.json({
      success: true,
      message: 'Listing cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel listing',
      error: error.message
    });
  }
};

// Execute sale (called after on-chain transaction)
export const executeSale = async (req, res) => {
  try {
    const {
      listingId,
      buyer,
      seller,
      price,
      quantity = 1,
      transactionHash,
      network
    } = req.body;

    // Update listing status
    const listing = await Listing.findOne({ listingId: parseInt(listingId) });

    if (listing) {
      if (quantity >= listing.quantity) {
        listing.active = false;
      } else {
        listing.quantity -= quantity;
      }
      await listing.save();
    }

    // Update NFT ownership in database
    const nft = await NFT.findOne({
      contractAddress: listing.nftContract,
      tokenId: listing.tokenId,
      network
    });

    if (nft) {
      nft.owner = buyer.toLowerCase();
      nft.lastTransferAt = new Date();
      await nft.save();
    }

    res.json({
      success: true,
      message: 'Sale executed successfully'
    });

  } catch (error) {
    console.error('Error executing sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute sale',
      error: error.message
    });
  }
};

// Get marketplace stats
export const getMarketplaceStats = async (req, res) => {
  try {
    const { network, timeframe = '24h' } = req.query;

    const query = {};
    if (network) query.network = network.toLowerCase();

    // Calculate time range
    const now = new Date();
    let startTime;

    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    query.createdAt = { $gte: startTime };

    const [
      totalListings,
      activeListings,
      totalVolume,
      recentSales
    ] = await Promise.all([
      Listing.countDocuments(query),
      Listing.countDocuments({ ...query, active: true }),
      // Note: Volume calculation would need transaction history
      Listing.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: { $toDouble: "$price" } } } }
      ]),
      Listing.find({ ...query, active: false }).limit(10).sort({ updatedAt: -1 })
    ]);

    res.json({
      success: true,
      stats: {
        totalListings,
        activeListings,
        totalVolume: totalVolume[0]?.total || 0,
        recentSales: recentSales.length,
        timeframe
      }
    });

  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch marketplace stats',
      error: error.message
    });
  }
};
<parameter name="filePath">c:\Users\Darker Elf\Documents\GitHub\Durchex_NFT_Marketplace\backend_temp\controllers\marketplaceController.js