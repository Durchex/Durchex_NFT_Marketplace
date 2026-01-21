/**
 * Pool Routes - Liquidity Pool API Endpoints
 * Handles:
 * - Pool creation and management
 * - Liquidity operations
 * - Swap execution
 * - Reward distribution
 * - Analytics and statistics
 */

import express from 'express';
import auth from '../middleware/auth.js';
import tryCatch from '../middleware/tryCatch.js';
import logger from '../utils/logger.js';
const router = express.Router();

// Pool service will be injected from server
let poolService = null;

// Middleware to inject pool service
router.use((req, res, next) => {
  poolService = req.app.locals.poolService;
  if (!poolService) {
    return res.status(500).json({ error: 'Pool service not initialized' });
  }
  next();
});

// ========== Pool Management ==========

/**
 * POST /api/v1/pool/create
 * Create a new liquidity pool
 * @param {string} token0 - First token address
 * @param {string} token1 - Second token address
 * @param {number} feeTier - Fee tier (0-3)
 */
router.post('/create', auth, tryCatch(async (req, res) => {
  const { token0, token1, feeTier } = req.body;
  
  if (!token0 || !token1 || feeTier === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const pool = await poolService.createPool(token0, token1, feeTier);
    
    res.status(201).json({
      success: true,
      data: pool,
      message: 'Pool created successfully'
    });
  } catch (error) {
    logger.error('Pool creation error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/pool/:poolId
 * Get pool information
 */
router.get('/:poolId', tryCatch(async (req, res) => {
  const { poolId } = req.params;
  
  try {
    const pool = poolService.getPoolInfo(poolId);
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    res.json({
      success: true,
      data: pool
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/pool
 * Get all pools
 */
router.get('/', tryCatch(async (req, res) => {
  try {
    const pools = poolService.getAllPools();
    
    res.json({
      success: true,
      data: pools,
      total: pools.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Liquidity Management ==========

/**
 * POST /api/v1/pool/:poolId/add-liquidity
 * Add liquidity to a pool
 */
router.post('/:poolId/add-liquidity', auth, tryCatch(async (req, res) => {
  const { poolId } = req.params;
  const { token0, token1, amount0, amount1 } = req.body;
  
  if (!amount0 || !amount1 || !token0 || !token1) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const result = await poolService.addLiquidity(poolId, token0, token1, amount0, amount1);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Liquidity added successfully'
    });
  } catch (error) {
    logger.error('Add liquidity error', { error: error.message, poolId });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/pool/:poolId/remove-liquidity
 * Remove liquidity from a pool
 */
router.post('/:poolId/remove-liquidity', auth, tryCatch(async (req, res) => {
  const { poolId } = req.params;
  const { lpTokens } = req.body;
  
  if (!lpTokens) {
    return res.status(400).json({ error: 'LP tokens amount required' });
  }
  
  try {
    const result = await poolService.removeLiquidity(poolId, lpTokens);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Liquidity removed successfully'
    });
  } catch (error) {
    logger.error('Remove liquidity error', { error: error.message, poolId });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/pool/:poolId/positions
 * Get user's liquidity positions
 */
router.get('/:poolId/positions', auth, tryCatch(async (req, res) => {
  try {
    const positions = await poolService.getUserLiquidityPositions(req.user.address);
    
    const poolPositions = positions.filter(p => p.poolId === req.params.poolId);
    
    res.json({
      success: true,
      data: poolPositions
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Swap Operations ==========

/**
 * POST /api/v1/pool/:poolId/swap
 * Execute a token swap
 */
router.post('/:poolId/swap', auth, tryCatch(async (req, res) => {
  const { poolId } = req.params;
  const { tokenIn, amountIn } = req.body;
  
  if (!tokenIn || !amountIn) {
    return res.status(400).json({ error: 'Missing tokenIn or amountIn' });
  }
  
  try {
    const result = await poolService.executeSwap(poolId, tokenIn, amountIn);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Swap executed successfully'
    });
  } catch (error) {
    logger.error('Swap execution error', { error: error.message, poolId });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/pool/:poolId/swap-quote
 * Get swap quote before execution
 */
router.post('/:poolId/swap-quote', tryCatch(async (req, res) => {
  const { poolId } = req.params;
  const { tokenIn, amountIn } = req.body;
  
  if (!tokenIn || !amountIn) {
    return res.status(400).json({ error: 'Missing tokenIn or amountIn' });
  }
  
  try {
    const quote = await poolService.getSwapQuote(poolId, tokenIn, amountIn);
    
    res.json({
      success: true,
      data: quote
    });
  } catch (error) {
    logger.error('Swap quote error', { error: error.message, poolId });
    res.status(400).json({ error: error.message });
  }
}));

// ========== Rewards ==========

/**
 * POST /api/v1/pool/:poolId/distribute-rewards
 * Distribute rewards to liquidity providers (Admin only)
 */
router.post('/:poolId/distribute-rewards', auth, tryCatch(async (req, res) => {
  const { poolId } = req.params;
  
  // Verify admin role
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await poolService.distributeRewards(poolId);
    
    res.json({
      success: true,
      data: result,
      message: 'Rewards distributed successfully'
    });
  } catch (error) {
    logger.error('Reward distribution error', { error: error.message, poolId });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/pool/:poolId/claim-rewards
 * Claim accumulated rewards
 */
router.post('/:poolId/claim-rewards', auth, tryCatch(async (req, res) => {
  const { poolId } = req.params;
  
  try {
    const result = await poolService.claimRewards(poolId, req.user.address);
    
    res.json({
      success: true,
      data: result,
      message: 'Rewards claimed successfully'
    });
  } catch (error) {
    logger.error('Reward claim error', { error: error.message, poolId });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/pool/user/rewards
 * Get user's reward history
 */
router.get('/user/rewards', auth, tryCatch(async (req, res) => {
  try {
    const positions = await poolService.getUserLiquidityPositions(req.user.address);
    
    const rewards = positions.map(p => ({
      poolId: p.poolId,
      tokens: p.tokens,
      earned: p.rewardsEarned
    }));
    
    const totalRewards = rewards.reduce((sum, r) => sum + BigInt(r.earned), 0n);
    
    res.json({
      success: true,
      data: {
        rewards,
        total: totalRewards.toString()
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Analytics ==========

/**
 * GET /api/v1/pool/:poolId/stats
 * Get pool statistics
 */
router.get('/:poolId/stats', tryCatch(async (req, res) => {
  const { poolId } = req.params;
  
  try {
    const stats = await poolService.getPoolStats(poolId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Pool stats error', { error: error.message, poolId });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/pool/stats/top-pools
 * Get top performing pools
 */
router.get('/stats/top-pools', tryCatch(async (req, res) => {
  const { limit = 10 } = req.query;
  
  try {
    const pools = poolService.getAllPools();
    const stats = await Promise.all(
      pools.map(p => poolService.getPoolStats(p.id))
    );
    
    // Sort by volume
    const topPools = stats
      .sort((a, b) => BigInt(b.volume24h) - BigInt(a.volume24h))
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: topPools,
      total: topPools.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/pool/user/liquidity
 * Get all user liquidity positions
 */
router.get('/user/liquidity', auth, tryCatch(async (req, res) => {
  try {
    const positions = await poolService.getUserLiquidityPositions(req.user.address);
    
    const totalLpValue = positions.reduce(
      (sum, p) => sum + BigInt(p.lpTokens),
      0n
    );
    
    res.json({
      success: true,
      data: {
        positions,
        totalValue: totalLpValue.toString(),
        count: positions.length
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/pool/market/overview
 * Get liquidity pool market overview
 */
router.get('/market/overview', tryCatch(async (req, res) => {
  try {
    const pools = poolService.getAllPools();
    
    const totalLiquidity = pools.reduce(
      (sum, p) => sum + BigInt(p.totalLiquidity),
      0n
    );
    
    const overview = {
      totalPools: pools.length,
      totalLiquidity: totalLiquidity.toString(),
      activePools: pools.filter(p => p.isActive).length,
      topTokens: _extractTopTokens(pools),
      market24hStats: _calculateMarket24hStats()
    };
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Helper Functions ==========

/**
 * Extract top token pairs
 */
function _extractTopTokens(pools) {
  const tokenMap = {};
  
  pools.forEach(pool => {
    tokenMap[pool.token0] = (tokenMap[pool.token0] || 0) + 1;
    tokenMap[pool.token1] = (tokenMap[pool.token1] || 0) + 1;
  });
  
  return Object.entries(tokenMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([token, count]) => ({ token, poolCount: count }));
}

/**
 * Calculate 24h market statistics
 */
function _calculateMarket24hStats() {
  // Placeholder - would be calculated from swap history
  return {
    volume24h: '0',
    trades24h: 0,
    avgSwapSize: '0',
    totalFees24h: '0'
  };
}

// ========== Error Handling ==========

/**
 * 404 handler
 */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Pool endpoint not found'
  });
});

export default router;
