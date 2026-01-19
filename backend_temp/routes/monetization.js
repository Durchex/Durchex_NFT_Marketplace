/**
 * Monetization Routes - Creator Tips, Subscriptions, and Merchandise
 * Endpoints for:
 * - Sending tips and donations
 * - Managing subscription tiers
 * - Selling merchandise
 * - Tracking earnings
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tryCatch = require('../middleware/tryCatch');
const logger = require('../utils/logger');

let monetizationService = null;

router.use((req, res, next) => {
  monetizationService = req.app.locals.monetizationService;
  if (!monetizationService) {
    return res.status(500).json({ error: 'Monetization service not initialized' });
  }
  next();
});

// ========== Tips and Donations ==========

/**
 * POST /api/v1/monetization/tips/send
 * Send tip to creator
 */
router.post('/tips/send', auth, tryCatch(async (req, res) => {
  const { creatorAddress, amount, message } = req.body;
  
  if (!creatorAddress || !amount) {
    return res.status(400).json({ error: 'Missing creatorAddress or amount' });
  }
  
  try {
    const result = await monetizationService.sendTip(
      creatorAddress,
      amount,
      message
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Tip sent successfully'
    });
  } catch (error) {
    logger.error('Send tip error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/monetization/tips/received/:creatorAddress
 * Get tips received by creator
 */
router.get('/tips/received/:creatorAddress', tryCatch(async (req, res) => {
  const { creatorAddress } = req.params;
  
  try {
    const result = await monetizationService.getTipsReceived(creatorAddress);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/monetization/tips/sent
 * Get tips sent by user
 */
router.get('/tips/sent', auth, tryCatch(async (req, res) => {
  try {
    const result = await monetizationService.getTipsSent(req.user.address);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Subscriptions ==========

/**
 * POST /api/v1/monetization/subscriptions/tiers/create
 * Create subscription tier (creator only)
 */
router.post('/subscriptions/tiers/create', auth, tryCatch(async (req, res) => {
  const { tierName, monthlyPrice, benefits, maxSubscribers } = req.body;
  
  if (!tierName || !monthlyPrice) {
    return res.status(400).json({ error: 'Missing tierName or monthlyPrice' });
  }
  
  try {
    const result = await monetizationService.createSubscriptionTier(
      req.user.address,
      tierName,
      monthlyPrice,
      benefits,
      maxSubscribers
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Subscription tier created successfully'
    });
  } catch (error) {
    logger.error('Create tier error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/monetization/subscriptions/:tierId/subscribe
 * Subscribe to creator tier
 */
router.post('/subscriptions/:tierId/subscribe', auth, tryCatch(async (req, res) => {
  const { tierId } = req.params;
  const { paymentToken } = req.body;
  
  if (!paymentToken) {
    return res.status(400).json({ error: 'Payment token required' });
  }
  
  try {
    const result = await monetizationService.subscribeToTier(tierId, paymentToken);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Subscription successful'
    });
  } catch (error) {
    logger.error('Subscribe error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/monetization/subscriptions/:tierId/cancel
 * Cancel subscription
 */
router.post('/subscriptions/:tierId/cancel', auth, tryCatch(async (req, res) => {
  const { tierId } = req.params;
  
  try {
    const result = await monetizationService.cancelSubscription(tierId);
    
    res.json({
      success: true,
      data: result,
      message: 'Subscription cancelled'
    });
  } catch (error) {
    logger.error('Cancel subscription error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/monetization/subscriptions/creator/:creatorAddress
 * Get creator subscription tiers
 */
router.get('/subscriptions/creator/:creatorAddress', tryCatch(async (req, res) => {
  const { creatorAddress } = req.params;
  
  try {
    const result = await monetizationService.getCreatorTiers(creatorAddress);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/monetization/subscriptions/user
 * Get user subscriptions
 */
router.get('/subscriptions/user', auth, tryCatch(async (req, res) => {
  try {
    const result = await monetizationService.getUserSubscriptions(req.user.address);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Merchandise ==========

/**
 * POST /api/v1/monetization/merchandise/create
 * Create merchandise item (creator only)
 */
router.post('/merchandise/create', auth, tryCatch(async (req, res) => {
  const { name, description, price, imageUrl, inventory } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ error: 'Missing name or price' });
  }
  
  try {
    const result = await monetizationService.createMerchandiseItem(
      req.user.address,
      name,
      description,
      price,
      imageUrl,
      inventory
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Merchandise item created successfully'
    });
  } catch (error) {
    logger.error('Create merchandise error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/monetization/merchandise/:itemId/purchase
 * Purchase merchandise
 */
router.post('/merchandise/:itemId/purchase', auth, tryCatch(async (req, res) => {
  const { itemId } = req.params;
  const { quantity, shippingAddress } = req.body;
  
  if (!quantity) {
    return res.status(400).json({ error: 'Quantity required' });
  }
  
  try {
    const result = await monetizationService.purchaseMerchandise(
      itemId,
      quantity,
      shippingAddress
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Merchandise purchased successfully'
    });
  } catch (error) {
    logger.error('Purchase merchandise error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/monetization/merchandise/creator/:creatorAddress
 * Get creator merchandise
 */
router.get('/merchandise/creator/:creatorAddress', tryCatch(async (req, res) => {
  const { creatorAddress } = req.params;
  
  try {
    const result = await monetizationService.getCreatorMerchandise(creatorAddress);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/monetization/merchandise
 * Get all active merchandise
 */
router.get('/merchandise', tryCatch(async (req, res) => {
  try {
    const result = monetizationService.getAllMerchandise();
    const active = result.filter(m => m.isActive);
    
    res.json({
      success: true,
      data: active,
      count: active.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Earnings and Payouts ==========

/**
 * GET /api/v1/monetization/earnings
 * Get creator earnings
 */
router.get('/earnings', auth, tryCatch(async (req, res) => {
  try {
    const result = await monetizationService.getCreatorEarnings(req.user.address);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/monetization/payouts/request
 * Request payout
 */
router.post('/payouts/request', auth, tryCatch(async (req, res) => {
  const { payoutAddress, amount } = req.body;
  
  if (!payoutAddress || !amount) {
    return res.status(400).json({ error: 'Missing payoutAddress or amount' });
  }
  
  try {
    const result = await monetizationService.requestPayout(
      req.user.address,
      payoutAddress,
      amount
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Payout request submitted'
    });
  } catch (error) {
    logger.error('Request payout error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/monetization/payouts/history
 * Get payout history
 */
router.get('/payouts/history', auth, tryCatch(async (req, res) => {
  try {
    const result = await monetizationService.getPayoutHistory(req.user.address);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Analytics ==========

/**
 * GET /api/v1/monetization/stats
 * Get creator monetization stats
 */
router.get('/stats', auth, tryCatch(async (req, res) => {
  try {
    const result = await monetizationService.getMonetizationStats(req.user.address);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/monetization/trends
 * Get revenue trends
 */
router.get('/trends', auth, tryCatch(async (req, res) => {
  const { days = 30 } = req.query;
  
  try {
    const result = await monetizationService.getRevenueTrends(req.user.address, parseInt(days));
    
    res.json({
      success: true,
      data: result,
      daysAnalyzed: parseInt(days)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/monetization/creator/:creatorAddress/profile
 * Get creator monetization profile
 */
router.get('/creator/:creatorAddress/profile', tryCatch(async (req, res) => {
  const { creatorAddress } = req.params;
  
  try {
    const stats = await monetizationService.getMonetizationStats(creatorAddress);
    const tiers = await monetizationService.getCreatorTiers(creatorAddress);
    const merchandise = await monetizationService.getCreatorMerchandise(creatorAddress);
    const tips = await monetizationService.getTipsReceived(creatorAddress);
    
    res.json({
      success: true,
      data: {
        stats,
        tiers,
        merchandise,
        tips: tips.tipCount,
        totalEarnings: stats.totalEarnings
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Error Handling ==========

router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Monetization endpoint not found'
  });
});

module.exports = router;
