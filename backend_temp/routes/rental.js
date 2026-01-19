// Rental API Routes
const express = require('express');
const router = express.Router();
const RentalService = require('../services/RentalService');
const auth = require('../middleware/auth');
const tryCatch = require('../middleware/tryCatch');

// Create new rental listing
router.post('/create-listing', auth, tryCatch(async (req, res) => {
  const { nftAddress, tokenId, pricePerDay, minDays, maxDays } = req.body;
  
  if (!nftAddress || !tokenId || !pricePerDay || !minDays || !maxDays) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (minDays > maxDays) {
    return res.status(400).json({ error: 'minDays cannot be greater than maxDays' });
  }

  const rentalService = new RentalService();
  const result = await rentalService.createListing(
    req.user.address,
    nftAddress,
    tokenId,
    pricePerDay,
    minDays,
    maxDays
  );

  return res.status(200).json({
    message: 'Listing created successfully',
    listingId: result,
    nftAddress,
    tokenId
  });
}));

// Place bid on rental listing
router.post('/place-bid', auth, tryCatch(async (req, res) => {
  const { listingId, rentalDays, bidAmount } = req.body;

  if (!listingId || !rentalDays || !bidAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (rentalDays <= 0) {
    return res.status(400).json({ error: 'Rental days must be positive' });
  }

  const rentalService = new RentalService();
  const result = await rentalService.placeBid(
    listingId,
    req.user.address,
    rentalDays,
    bidAmount
  );

  return res.status(200).json({
    message: 'Bid placed successfully',
    bidId: result,
    listingId,
    rentalDays
  });
}));

// Accept bid on rental listing
router.post('/accept-bid', auth, tryCatch(async (req, res) => {
  const { bidId } = req.body;

  if (!bidId) {
    return res.status(400).json({ error: 'Bid ID is required' });
  }

  const rentalService = new RentalService();
  const result = await rentalService.acceptBid(req.user.address, bidId);

  return res.status(200).json({
    message: 'Bid accepted successfully',
    rentalId: result,
    bidId
  });
}));

// Return rented NFT
router.post('/return-nft', auth, tryCatch(async (req, res) => {
  const { rentalId } = req.body;

  if (!rentalId) {
    return res.status(400).json({ error: 'Rental ID is required' });
  }

  const rentalService = new RentalService();
  const result = await rentalService.returnNFT(req.user.address, rentalId);

  return res.status(200).json({
    message: 'NFT returned successfully',
    rentalId,
    refund: result.refund,
    penalty: result.penalty,
    onTime: result.onTime
  });
}));

// Get all user's rental listings
router.get('/my-listings', auth, tryCatch(async (req, res) => {
  const rentalService = new RentalService();
  const listings = await rentalService.getUserListings(req.user.address);

  return res.status(200).json({
    total: listings.length,
    listings
  });
}));

// Get all user's rental bids placed
router.get('/my-bids', auth, tryCatch(async (req, res) => {
  const rentalService = new RentalService();
  const bids = await rentalService.getUserBids(req.user.address);

  return res.status(200).json({
    total: bids.length,
    bids
  });
}));

// Get all user's active rentals (renting out)
router.get('/my-rentals', auth, tryCatch(async (req, res) => {
  const rentalService = new RentalService();
  const rentals = await rentalService.getUserRentals(req.user.address);

  return res.status(200).json({
    total: rentals.length,
    rentals
  });
}));

// Get all available rental listings
router.get('/available-listings', tryCatch(async (req, res) => {
  const { skip = 0, limit = 20, sortBy = 'recent' } = req.query;

  const rentalService = new RentalService();
  const listings = await rentalService.getAvailableListings(
    parseInt(skip),
    parseInt(limit),
    sortBy
  );

  return res.status(200).json({
    skip: parseInt(skip),
    limit: parseInt(limit),
    total: listings.total,
    listings: listings.data
  });
}));

// Get rental details
router.get('/rental/:rentalId', tryCatch(async (req, res) => {
  const { rentalId } = req.params;

  if (!rentalId) {
    return res.status(400).json({ error: 'Rental ID is required' });
  }

  const rentalService = new RentalService();
  const rental = await rentalService.getRentalDetails(rentalId);

  if (!rental) {
    return res.status(404).json({ error: 'Rental not found' });
  }

  return res.status(200).json(rental);
}));

// Get listing details
router.get('/listing/:listingId', tryCatch(async (req, res) => {
  const { listingId } = req.params;

  if (!listingId) {
    return res.status(400).json({ error: 'Listing ID is required' });
  }

  const rentalService = new RentalService();
  const listing = await rentalService.getListingDetails(listingId);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  return res.status(200).json(listing);
}));

// Get rental marketplace statistics
router.get('/stats', tryCatch(async (req, res) => {
  const rentalService = new RentalService();
  const stats = await rentalService.getMarketplaceStats();

  return res.status(200).json(stats);
}));

// Get user reputation
router.get('/user-reputation/:userAddress', tryCatch(async (req, res) => {
  const { userAddress } = req.params;

  if (!userAddress) {
    return res.status(400).json({ error: 'User address is required' });
  }

  const rentalService = new RentalService();
  const reputation = await rentalService.getUserReputation(userAddress);

  return res.status(200).json({
    userAddress,
    reputation,
    status: reputation > 40 ? 'excellent' : reputation > 20 ? 'good' : 'new'
  });
}));

// Cancel rental listing
router.post('/cancel-listing', auth, tryCatch(async (req, res) => {
  const { listingId } = req.body;

  if (!listingId) {
    return res.status(400).json({ error: 'Listing ID is required' });
  }

  const rentalService = new RentalService();
  await rentalService.cancelListing(req.user.address, listingId);

  return res.status(200).json({
    message: 'Listing cancelled successfully',
    listingId
  });
}));

// Cancel bid
router.post('/cancel-bid', auth, tryCatch(async (req, res) => {
  const { bidId } = req.body;

  if (!bidId) {
    return res.status(400).json({ error: 'Bid ID is required' });
  }

  const rentalService = new RentalService();
  await rentalService.cancelBid(req.user.address, bidId);

  return res.status(200).json({
    message: 'Bid cancelled successfully',
    bidId
  });
}));

// Get rental history for user
router.get('/history', auth, tryCatch(async (req, res) => {
  const { skip = 0, limit = 20 } = req.query;

  const rentalService = new RentalService();
  const history = await rentalService.getUserHistory(
    req.user.address,
    parseInt(skip),
    parseInt(limit)
  );

  return res.status(200).json({
    skip: parseInt(skip),
    limit: parseInt(limit),
    total: history.total,
    history: history.data
  });
}));

// Calculate rental cost
router.post('/calculate-cost', tryCatch(async (req, res) => {
  const { listingId, rentalDays } = req.body;

  if (!listingId || !rentalDays) {
    return res.status(400).json({ error: 'Listing ID and rental days are required' });
  }

  if (rentalDays <= 0) {
    return res.status(400).json({ error: 'Rental days must be positive' });
  }

  const rentalService = new RentalService();
  const cost = await rentalService.calculateRentalCost(listingId, rentalDays);

  return res.status(200).json(cost);
}));

// Search rental listings
router.get('/search', tryCatch(async (req, res) => {
  const { query, sortBy = 'recent', skip = 0, limit = 20 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const rentalService = new RentalService();
  const results = await rentalService.searchListings(
    query,
    sortBy,
    parseInt(skip),
    parseInt(limit)
  );

  return res.status(200).json({
    query,
    skip: parseInt(skip),
    limit: parseInt(limit),
    total: results.total,
    results: results.data
  });
}));

module.exports = router;
