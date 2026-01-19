/**
 * Performance Optimization Routes - Caching, Indexing, Metrics
 * Endpoints for performance monitoring and optimization
 */

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const tryCatch = require('../middleware/tryCatch');
const logger = require('../utils/logger');

let performanceService = null;

router.use((req, res, next) => {
  performanceService = req.app.locals.performanceService;
  if (!performanceService) {
    return res.status(500).json({ error: 'Performance service not initialized' });
  }
  next();
});

// ========== Cache Management ==========

/**
 * GET /api/v1/performance/cache/stats
 * Get cache statistics (Admin only)
 */
router.get('/cache/stats', adminAuth, tryCatch(async (req, res) => {
  try {
    const result = await performanceService.getCacheStats();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * DELETE /api/v1/performance/cache/clear
 * Clear all cache (Admin only)
 */
router.delete('/cache/clear', adminAuth, tryCatch(async (req, res) => {
  try {
    const result = await performanceService.clearCache();

    res.json({
      success: true,
      data: result,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    logger.error('Clear cache error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/performance/cache/invalidate
 * Invalidate cache by pattern (Admin only)
 */
router.post('/cache/invalidate', adminAuth, tryCatch(async (req, res) => {
  const { pattern } = req.body;

  if (!pattern) {
    return res.status(400).json({ error: 'Cache pattern required' });
  }

  try {
    const result = await performanceService.invalidateCachePattern(pattern);

    res.json({
      success: true,
      data: { invalidatedCount: result },
      message: 'Cache pattern invalidated'
    });
  } catch (error) {
    logger.error('Invalidate cache pattern error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

// ========== Index Management ==========

/**
 * POST /api/v1/performance/indexes/create
 * Create database index (Admin only)
 */
router.post('/indexes/create', adminAuth, tryCatch(async (req, res) => {
  const { collection, field, type, unique } = req.body;

  if (!collection || !field) {
    return res.status(400).json({ error: 'Collection and field required' });
  }

  try {
    const result = await performanceService.createIndex(collection, field, {
      type: type || 'btree',
      unique: unique || false
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Index created successfully'
    });
  } catch (error) {
    logger.error('Create index error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/performance/indexes/stats
 * Get index statistics (Admin only)
 */
router.get('/indexes/stats', adminAuth, tryCatch(async (req, res) => {
  try {
    const result = await performanceService.getIndexStats();

    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Query Analysis ==========

/**
 * POST /api/v1/performance/queries/analyze
 * Analyze query performance (Admin only)
 */
router.post('/queries/analyze', adminAuth, tryCatch(async (req, res) => {
  const { query, executionTime } = req.body;

  if (!query || executionTime === undefined) {
    return res.status(400).json({ error: 'Query and execution time required' });
  }

  try {
    const result = await performanceService.analyzeQuery(query, parseInt(executionTime));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Analyze query error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/performance/queries/slow
 * Get slow queries (Admin only)
 */
router.get('/queries/slow', adminAuth, tryCatch(async (req, res) => {
  const { limit = 20 } = req.query;

  try {
    const result = await performanceService.getSlowQueries(parseInt(limit));

    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Rate Limiting ==========

/**
 * POST /api/v1/performance/rate-limit/check
 * Check rate limit for identifier
 */
router.post('/rate-limit/check', tryCatch(async (req, res) => {
  const { identifier, limit = 100, windowMs = 60000 } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: 'Identifier required' });
  }

  try {
    const result = await performanceService.checkRateLimit(
      identifier,
      parseInt(limit),
      parseInt(windowMs)
    );

    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        data: result
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Check rate limit error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/performance/rate-limit/stats
 * Get rate limiting statistics (Admin only)
 */
router.get('/rate-limit/stats', adminAuth, tryCatch(async (req, res) => {
  try {
    const result = await performanceService.getRateLimitStats();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/performance/rate-limit/reset/:identifier
 * Reset rate limit for identifier (Admin only)
 */
router.post('/rate-limit/reset/:identifier', adminAuth, tryCatch(async (req, res) => {
  const { identifier } = req.params;

  try {
    await performanceService.resetRateLimit(identifier);

    res.json({
      success: true,
      message: 'Rate limit reset successfully'
    });
  } catch (error) {
    logger.error('Reset rate limit error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

// ========== Performance Monitoring ==========

/**
 * GET /api/v1/performance/metrics
 * Get performance metrics (Admin only)
 */
router.get('/metrics', adminAuth, tryCatch(async (req, res) => {
  try {
    const result = await performanceService.getPerformanceMetrics();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/performance/recommendations
 * Get performance optimization recommendations (Admin only)
 */
router.get('/recommendations', adminAuth, tryCatch(async (req, res) => {
  try {
    const result = await performanceService.getPerformanceRecommendations();

    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Health Check ==========

/**
 * GET /api/v1/performance/health
 * Performance system health check
 */
router.get('/health', tryCatch(async (req, res) => {
  try {
    const metrics = await performanceService.getPerformanceMetrics();
    const cacheStats = await performanceService.getCacheStats();

    const health = {
      status: 'healthy',
      cache: {
        status: parseFloat(cacheStats.hitRatio) > 50 ? 'healthy' : 'degraded',
        hitRatio: cacheStats.hitRatio
      },
      database: {
        status: metrics.database.avgQueryTime < '100ms' ? 'healthy' : 'degraded',
        avgQueryTime: metrics.database.avgQueryTime
      },
      indexes: {
        status: metrics.indexes.total > 0 ? 'healthy' : 'warning',
        total: metrics.indexes.total
      }
    };

    // Determine overall health
    const unhealthyCount = Object.values(health).filter(h => h.status && h.status !== 'healthy').length;
    if (unhealthyCount >= 2) {
      health.status = 'degraded';
    }

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Error Handling ==========

router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Performance endpoint not found'
  });
});

module.exports = router;
