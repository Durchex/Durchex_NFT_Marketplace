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

const PLATFORM_FEE_BPS = parseInt(process.env.PLATFORM_FEE_BPS || '250', 10); // 2.5% default
const BPS_DENOMINATOR = 10000n;

/**
 * Split a secondary-sale price into creator royalty, platform fee, and seller proceeds.
 * Prices are passed as strings (assumed wei or any consistent unit) — math is BigInt-safe.
 *
 * Returns { creatorRoyalty, platformFee, sellerProceeds } as strings in the same unit.
 *
 * NOTE: This computes the accounting split for off-chain records. Actual on-chain transfer
 * splitting happens in the marketplace contract; this function records what each party
 * SHOULD have received and lets the backend reconcile / report.
 */
function splitSaleProceeds({ totalPrice, royaltyBps = 0, platformFeeBps = PLATFORM_FEE_BPS }) {
  const total = BigInt(totalPrice || '0');
  const safeRoyalty = BigInt(Math.max(0, Math.min(5000, Number(royaltyBps) || 0)));
  const safePlatform = BigInt(Math.max(0, Math.min(5000, Number(platformFeeBps) || 0)));

  const creatorRoyalty = (total * safeRoyalty) / BPS_DENOMINATOR;
  const platformFee = (total * safePlatform) / BPS_DENOMINATOR;
  const sellerProceeds = total - creatorRoyalty - platformFee;

  return {
    creatorRoyalty: creatorRoyalty.toString(),
    platformFee: platformFee.toString(),
    sellerProceeds: sellerProceeds.toString(),
  };
}

/**
 * Compute the current Dutch-auction price for a listing.
 * Linear decay: price(now) = startPrice - (startPrice - endPrice) * elapsed / duration.
 * Returns the listing.price (fixed) for non-Dutch listings.
 */
export function getDutchPriceNow(listing, now = new Date()) {
  if (listing?.listingType !== 'dutch') return listing?.price;
  const start = listing.startTime ? new Date(listing.startTime).getTime() : Date.now();
  const end = listing.endTime ? new Date(listing.endTime).getTime() : start;
  const t = Math.max(start, Math.min(end, now.getTime()));
  if (end <= start) return listing.dutchEndPrice || listing.price;

  const startWei = BigInt(listing.dutchStartPrice || listing.price || '0');
  const endWei = BigInt(listing.dutchEndPrice || listing.price || '0');
  const elapsed = BigInt(t - start);
  const duration = BigInt(end - start);
  // Bound to [endWei, startWei] so we never go below the floor.
  if (startWei <= endWei) return startWei.toString();
  const decayed = startWei - ((startWei - endWei) * elapsed) / duration;
  return decayed.toString();
}

/**
 * Recompute the floor price for a parent NFT and persist it as `nft.price`.
 *
 * Floor = lowest active fixed-price listing among all pieces of the NFT.
 * Only applies after primary sale completes (remainingPieces === 0). During
 * primary sale, the voucher price stays authoritative.
 *
 * Falls back to `lastPrice` when no active listings exist (e.g. all sold
 * out, or all cancelled). Returns the floor that was applied, or null.
 */
async function recomputeFloorPrice(parentNft) {
  if (!parentNft) return null;

  const totalPieces = Number(parentNft.pieces ?? parentNft.supply ?? 1) || 1;
  const remaining = Number(parentNft.remainingPieces ?? 0);
  const primarySaleComplete = totalPieces <= 1 || remaining === 0;
  if (!primarySaleComplete) return null; // Voucher price stays authoritative.

  // Active fixed-price listings linked to this parent NFT, sorted by price asc.
  // Compare prices numerically — they're stored as strings (wei), so cast.
  const activeListings = await Listing.find({
    parentNftId: parentNft._id,
    active: true,
    listingType: 'fixed',
  }).lean();

  let floor = null;
  for (const l of activeListings) {
    const p = BigInt(l.price || '0');
    if (floor === null || p < floor) floor = p;
  }

  if (floor !== null) {
    parentNft.price = floor.toString();
  } else if (parentNft.lastPrice) {
    parentNft.price = String(parentNft.lastPrice);
  }
  await parentNft.save();
  return floor;
}

/**
 * Bulk-create listings in one request. Frontend pre-signs each entry, then this
 * endpoint persists them in a single round-trip. Items that fail validation are
 * reported individually; successes are committed even if some fail.
 *
 * Body shape: { listings: [ { ...same payload as createListing }, ... ] }
 */
export const createBulkListings = async (req, res) => {
  try {
    const { listings } = req.body;
    if (!Array.isArray(listings) || listings.length === 0) {
      return res.status(400).json({ success: false, message: 'listings array required' });
    }
    if (listings.length > 100) {
      return res.status(400).json({ success: false, message: 'Max 100 listings per bulk request' });
    }

    const results = [];
    let lastListing = await Listing.findOne({}, {}, { sort: { 'listingId': -1 } });
    let nextId = lastListing ? lastListing.listingId + 1 : 1;

    for (const entry of listings) {
      try {
        const {
          seller, nftContract, tokenId, quantity = 1, price,
          startTime, endTime, paymentToken = '0x0000000000000000000000000000000000000000',
          isERC1155 = false, signature, nonce, network, parentNftId,
        } = entry;
        if (!seller || !nftContract || !tokenId || !price || !signature || !network) {
          results.push({ tokenId, ok: false, error: 'Missing required fields' });
          continue;
        }

        // Primary-sale lock check (per item).
        const parentQueries = [];
        if (parentNftId) {
          if (typeof parentNftId === 'string' && /^[0-9a-fA-F]{24}$/.test(parentNftId)) {
            parentQueries.push({ _id: parentNftId });
          }
          parentQueries.push({ itemId: parentNftId });
        }
        parentQueries.push({ nftContract: nftContract.toLowerCase(), network: network.toLowerCase() });
        const parentNft = await NFT.findOne({ $or: parentQueries });
        if (parentNft) {
          const totalPieces = Number(parentNft.pieces ?? parentNft.supply ?? 1) || 1;
          const remaining = Number(parentNft.remainingPieces ?? 0);
          if (totalPieces > 1 && remaining > 0) {
            results.push({ tokenId, ok: false, error: `Locked: ${remaining}/${totalPieces} unminted` });
            continue;
          }
        }

        const listingType = endTime ? 'auction' : 'fixed';
        const listing = new Listing({
          listingId: nextId++,
          seller: seller.toLowerCase(),
          nftContract: nftContract.toLowerCase(),
          tokenId, quantity, price,
          startTime: startTime ? new Date(startTime * 1000) : new Date(),
          endTime: endTime ? new Date(endTime * 1000) : null,
          paymentToken: paymentToken.toLowerCase(),
          isERC1155, active: true, signature, nonce,
          network: network.toLowerCase(),
          marketplaceContract: getMarketplaceContract(network),
          parentNftId: parentNft?._id || null,
          listingType,
        });
        await listing.save();
        if (parentNft) await recomputeFloorPrice(parentNft);
        results.push({ tokenId, ok: true, listingId: listing.listingId });
      } catch (err) {
        results.push({ tokenId: entry.tokenId, ok: false, error: err.message });
      }
    }

    const ok = results.filter((r) => r.ok).length;
    res.status(201).json({
      success: true,
      message: `${ok} of ${listings.length} listings created`,
      results,
    });
  } catch (error) {
    console.error('Bulk listing error:', error);
    res.status(500).json({ success: false, message: 'Bulk listing failed', error: error.message });
  }
};

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
      network,
      parentNftId,
    } = req.body;

    // Validate required fields
    if (!seller || !nftContract || !tokenId || !price || !signature || !network) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Primary-sale lock: secondary listings are blocked until the parent NFT's
    // full supply has been minted out. Look up the parent NFT by id, _id or
    // itemId, or fall back to matching nftContract+network when no id provided.
    const parentQueries = [];
    if (parentNftId) {
      if (typeof parentNftId === 'string' && /^[0-9a-fA-F]{24}$/.test(parentNftId)) {
        parentQueries.push({ _id: parentNftId });
      }
      parentQueries.push({ itemId: parentNftId });
    }
    parentQueries.push({
      nftContract: nftContract.toLowerCase(),
      network: network.toLowerCase(),
    });
    const parentNft = await NFT.findOne({ $or: parentQueries });
    if (parentNft) {
      const totalPieces = Number(parentNft.pieces ?? parentNft.supply ?? 1) || 1;
      const remaining = Number(parentNft.remainingPieces ?? 0);
      if (totalPieces > 1 && remaining > 0) {
        return res.status(403).json({
          success: false,
          message: `Resale is locked: ${remaining} of ${totalPieces} pieces still unminted. Listings unlock once the primary sale completes.`,
        });
      }
    }

    // Get the next listing ID
    const lastListing = await Listing.findOne({}, {}, { sort: { 'listingId': -1 } });
    const listingId = lastListing ? lastListing.listingId + 1 : 1;

    const marketplaceContract = getMarketplaceContract(network);
    const reqListingType = String(req.body.listingType || '').toLowerCase();
    const listingType =
      reqListingType === 'dutch' ? 'dutch' :
      reqListingType === 'auction' ? 'auction' :
      endTime ? 'auction' : 'fixed';

    // Validate dutch params if applicable.
    if (listingType === 'dutch') {
      if (!req.body.dutchStartPrice || !req.body.dutchEndPrice || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Dutch auction requires dutchStartPrice, dutchEndPrice, and endTime.',
        });
      }
      if (BigInt(req.body.dutchStartPrice) <= BigInt(req.body.dutchEndPrice)) {
        return res.status(400).json({
          success: false,
          message: 'dutchStartPrice must be greater than dutchEndPrice for a descending auction.',
        });
      }
    }

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
      marketplaceContract,
      parentNftId: parentNft?._id || null,
      listingType,
      dutchStartPrice: listingType === 'dutch' ? String(req.body.dutchStartPrice) : null,
      dutchEndPrice: listingType === 'dutch' ? String(req.body.dutchEndPrice) : null,
    });

    await listing.save();

    // Floor may have just dropped (or established for the first time).
    if (parentNft) await recomputeFloorPrice(parentNft);

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

    // For Dutch auctions, surface the live price alongside the static fields.
    const responseListing = listing.toObject();
    if (listing.listingType === 'dutch') {
      responseListing.currentPrice = getDutchPriceNow(listing);
    }

    res.json({
      success: true,
      listing: responseListing,
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

    // Floor may have just risen — recompute against remaining active listings.
    if (listing.parentNftId) {
      const parentNft = await NFT.findById(listing.parentNftId);
      if (parentNft) await recomputeFloorPrice(parentNft);
    }

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
      price,
      quantity = 1,
      transactionHash,
      network
    } = req.body;

    if (!listingId || !buyer) {
      return res.status(400).json({ success: false, message: 'listingId and buyer are required' });
    }

    // Listing IDs may be ints (numeric counter) or string Mongo _id values.
    let listing = null;
    if (/^\d+$/.test(String(listingId))) {
      listing = await Listing.findOne({ listingId: parseInt(listingId, 10) });
    } else {
      listing = await Listing.findById(listingId).catch(() => null);
    }

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const qty = Number(quantity) || 1;
    if (qty >= listing.quantity) {
      listing.active = false;
      listing.quantity = 0;
    } else {
      listing.quantity -= qty;
    }
    await listing.save();

    // Update NFT ownership and piece accounting.
    const nft = await NFT.findOne({
      contractAddress: listing.nftContract,
      tokenId: listing.tokenId,
      network: (network || listing.network || '').toLowerCase()
    });

    let saleSplit = null;
    if (nft) {
      // For multi-piece NFTs, decrement remainingPieces; transfer canonical
      // ownership only when the buyer takes the final piece.
      if (typeof nft.remainingPieces === 'number' && nft.pieces > 1) {
        nft.remainingPieces = Math.max(0, nft.remainingPieces - qty);
        if (nft.remainingPieces === 0) {
          nft.owner = String(buyer).toLowerCase();
        }
      } else {
        nft.owner = String(buyer).toLowerCase();
      }
      nft.currentlyListed = listing.active;
      const salePrice = String(price ?? nft.lastPrice ?? '0');
      nft.lastPrice = salePrice;
      nft.lastTransferAt = new Date();
      if (transactionHash) nft.lastTxHash = transactionHash;
      await nft.save();

      // Sale consumed an active listing → recompute floor across what's left.
      // The helper skips during primary sale (voucher price stays authoritative).
      await recomputeFloorPrice(nft);

      // Compute royalty + platform-fee split for this secondary sale.
      // This is the off-chain accounting record. On-chain enforcement requires
      // the marketplace contract to honor the same split — see contract integration note.
      const totalPriceWei = String(price ?? '0');
      const royaltyBps = Number(nft.royaltyBps || 0);
      saleSplit = splitSaleProceeds({
        totalPrice: totalPriceWei,
        royaltyBps,
        platformFeeBps: PLATFORM_FEE_BPS,
      });
      // Record on the listing for audit / payout reconciliation.
      listing.lastSaleSplit = {
        ...saleSplit,
        creator: nft.creator,
        seller: listing.seller,
        royaltyBps,
        platformFeeBps: PLATFORM_FEE_BPS,
        recordedAt: new Date(),
      };
      await listing.save();
    }

    res.json({
      success: true,
      message: 'Sale executed successfully',
      listingActive: listing.active,
      remainingPieces: nft?.remainingPieces ?? null,
      saleSplit, // creator royalty / platform fee / seller proceeds breakdown
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
