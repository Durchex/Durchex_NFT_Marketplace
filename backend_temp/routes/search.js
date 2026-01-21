import express from 'express';
import SearchService from '../services/elasticsearch/SearchService.js';
import logger from '../utils/logger.js';
const router = express.Router();

/**
 * POST /api/search
 * Advanced NFT search with filters and sorting
 */
router.post('/search', async (req, res) => {
  try {
    const {
      query = '',
      filters = {},
      sort = 'relevance',
      page = 1,
      limit = 20,
      facets = [],
    } = req.body;

    // Validate pagination
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const results = await SearchService.searchNFTs({
      query,
      filters,
      sort,
      page: validPage,
      limit: validLimit,
      facets,
    });

    res.json({
      success: true,
      data: results,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/search/autocomplete
 * Get autocomplete suggestions
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { q = '' } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: [],
      });
    }

    const suggestions = await SearchService.getAutocompleteSuggestions(q);

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    logger.error('Autocomplete error:', error);
    res.status(500).json({
      success: false,
      error: 'Autocomplete failed',
    });
  }
});

/**
 * GET /api/search/trending
 * Get trending NFTs
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const nfts = await SearchService.getTrendingNFTs(limit);

    res.json({
      success: true,
      data: nfts,
      count: nfts.length,
    });
  } catch (error) {
    logger.error('Trending search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trending NFTs',
    });
  }
});

/**
 * GET /api/search/similar/:nftId
 * Get NFTs similar to the specified NFT
 */
router.get('/similar/:nftId', async (req, res) => {
  try {
    const { nftId } = req.params;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const similarNFTs = await SearchService.getSimilarNFTs(nftId, limit);

    res.json({
      success: true,
      data: similarNFTs,
      count: similarNFTs.length,
    });
  } catch (error) {
    logger.error('Similar NFT search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get similar NFTs',
    });
  }
});

/**
 * POST /api/search/advanced
 * Advanced search with multi-field support
 */
router.post('/advanced', async (req, res) => {
  try {
    const {
      query = '',
      fields = {},
      limit = 20,
    } = req.body;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters',
      });
    }

    const results = await SearchService.advancedSearch({
      query,
      fields,
      limit: Math.min(100, limit),
    });

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    logger.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      error: 'Advanced search failed',
    });
  }
});

/**
 * POST /api/search/filter
 * Filter NFTs by multiple criteria
 */
router.post('/filter', async (req, res) => {
  try {
    const {
      category,
      collection,
      priceMin,
      priceMax,
      verificationStatus,
      isListed,
      attributes,
      page = 1,
      limit = 20,
    } = req.body;

    const filters = {
      category,
      collection,
      priceMin,
      priceMax,
      verificationStatus,
      isListed,
      attributes,
    };

    // Remove undefined filters
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    const results = await SearchService.searchNFTs({
      query: '',
      filters,
      sort: 'relevance',
      page: Math.max(1, page),
      limit: Math.min(100, limit),
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error('Filter error:', error);
    res.status(500).json({
      success: false,
      error: 'Filter operation failed',
    });
  }
});

/**
 * GET /api/search/stats
 * Get search statistics and insights
 */
router.get('/stats', async (req, res) => {
  try {
    // Get trending searches (in production, you'd track this)
    const trendingSearches = [
      'rare NFTs',
      'art collection',
      'gaming items',
      'virtual land',
      'celebrity NFTs',
    ];

    // Get popular categories (would come from aggregation)
    const popularCategories = [
      'Art',
      'Gaming',
      'Virtual Worlds',
      'Collectibles',
      'Music',
    ];

    res.json({
      success: true,
      data: {
        trendingSearches,
        popularCategories,
        totalSearches: 0, // Would track this
        averageResponseTime: 0, // Would measure this
      },
    });
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search stats',
    });
  }
});

/**
 * POST /api/search/log
 * Log search query for analytics
 */
router.post('/log', async (req, res) => {
  try {
    const { query, userId, resultsCount, responseTime } = req.body;

    // In production, save to database:
    // await SearchLog.create({ query, userId, resultsCount, responseTime, timestamp: new Date() })

    logger.info('Search logged:', {
      query,
      userId,
      resultsCount,
      responseTime,
    });

    res.json({
      success: true,
      message: 'Search logged',
    });
  } catch (error) {
    logger.error('Search logging error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log search',
    });
  }
});

export default router;
