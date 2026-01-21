/**
 * Analytics Routes
 * API endpoints for marketplace analytics and statistics
 */

import express from 'express';
const router = express.Router();
import AnalyticsService from '../services/analyticsService.js';
import logger from '../utils/logger.js';

// Initialize analytics service
let analyticsService = null;

router.use((req, res, next) => {
    analyticsService = req.app.locals.analyticsService;
    if (!analyticsService) {
        return res.status(500).json({ error: 'Analytics service not initialized' });
    }
    next();
});

/**
 * GET /api/analytics/marketplace-stats
 * Get overall marketplace statistics
 */
router.get('/marketplace-stats', async (req, res) => {
    try {
        const { timeframe = '24h' } = req.query;

        const validTimeframes = ['1h', '24h', '7d', '30d', '90d', '1y'];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching marketplace stats', { timeframe });

        const stats = await analyticsService.getMarketplaceStats(timeframe);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error fetching marketplace stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analytics/volume-trends
 * Get volume trends over time
 */
router.get('/volume-trends', async (req, res) => {
    try {
        const { timeframe = '7d', interval = 'daily' } = req.query;

        const validTimeframes = ['1h', '24h', '7d', '30d', '90d', '1y'];
        const validIntervals = ['hourly', 'daily', 'weekly'];

        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        if (!validIntervals.includes(interval)) {
            return res.status(400).json({ error: 'Invalid interval' });
        }

        logger.info('Fetching volume trends', { timeframe, interval });

        const trends = await analyticsService.getVolumeTrends(timeframe, interval);

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        logger.error('Error fetching volume trends', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analytics/trending-collections
 * Get trending collections
 */
router.get('/trending-collections', async (req, res) => {
    try {
        const { limit = 10, timeframe = '7d' } = req.query;

        const limitInt = Math.min(parseInt(limit), 100);
        const validTimeframes = ['24h', '7d', '30d'];

        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching trending collections', { limit: limitInt, timeframe });

        const collections = await analyticsService.getTrendingCollections(limitInt, timeframe);

        res.json({
            success: true,
            data: collections
        });
    } catch (error) {
        logger.error('Error fetching trending collections', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analytics/trending-nfts
 * Get trending NFTs
 */
router.get('/trending-nfts', async (req, res) => {
    try {
        const { limit = 10, timeframe = '7d' } = req.query;

        const limitInt = Math.min(parseInt(limit), 100);
        const validTimeframes = ['24h', '7d', '30d'];

        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching trending NFTs', { limit: limitInt, timeframe });

        const nfts = await analyticsService.getTrendingNFTs(limitInt, timeframe);

        res.json({
            success: true,
            data: nfts
        });
    } catch (error) {
        logger.error('Error fetching trending NFTs', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analytics/top-creators
 * Get top creators
 */
router.get('/top-creators', async (req, res) => {
    try {
        const { limit = 10, timeframe = '7d' } = req.query;

        const limitInt = Math.min(parseInt(limit), 100);
        const validTimeframes = ['24h', '7d', '30d'];

        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching top creators', { limit: limitInt, timeframe });

        const creators = await analyticsService.getTopCreators(limitInt, timeframe);

        res.json({
            success: true,
            data: creators
        });
    } catch (error) {
        logger.error('Error fetching top creators', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analytics/top-collectors
 * Get top collectors
 */
router.get('/top-collectors', async (req, res) => {
    try {
        const { limit = 10, timeframe = '7d' } = req.query;

        const limitInt = Math.min(parseInt(limit), 100);
        const validTimeframes = ['24h', '7d', '30d'];

        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching top collectors', { limit: limitInt, timeframe });

        const collectors = await analyticsService.getTopCollectors(limitInt, timeframe);

        res.json({
            success: true,
            data: collectors
        });
    } catch (error) {
        logger.error('Error fetching top collectors', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analytics/price-distribution
 * Get NFT price distribution
 */
router.get('/price-distribution', async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;

        const validTimeframes = ['1h', '24h', '7d', '30d'];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching price distribution', { timeframe });

        const distribution = await analyticsService.getPriceDistribution(timeframe);

        res.json({
            success: true,
            data: distribution
        });
    } catch (error) {
        logger.error('Error fetching price distribution', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analytics/market-sentiment
 * Get market sentiment analysis
 */
router.get('/market-sentiment', async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;

        const validTimeframes = ['24h', '7d', '30d'];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching market sentiment', { timeframe });

        const sentiment = await analyticsService.getMarketSentiment(timeframe);

        res.json({
            success: true,
            data: sentiment
        });
    } catch (error) {
        logger.error('Error fetching market sentiment', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analytics/nft-metrics
 * Get NFT-related metrics
 */
router.get('/nft-metrics', async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;

        const validTimeframes = ['24h', '7d', '30d'];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching NFT metrics', { timeframe });

        const metrics = await analyticsService.getNFTMetrics(timeframe);

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        logger.error('Error fetching NFT metrics', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analytics/collection-metrics
 * Get collection-related metrics
 */
router.get('/collection-metrics', async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;

        const validTimeframes = ['24h', '7d', '30d'];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching collection metrics', { timeframe });

        const metrics = await analyticsService.getCollectionMetrics(timeframe);

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        logger.error('Error fetching collection metrics', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analytics/user-metrics
 * Get user-related metrics
 */
router.get('/user-metrics', async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;

        const validTimeframes = ['24h', '7d', '30d'];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching user metrics', { timeframe });

        const metrics = await analyticsService.getUserMetrics(timeframe);

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        logger.error('Error fetching user metrics', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analytics/transaction-metrics
 * Get transaction-related metrics
 */
router.get('/transaction-metrics', async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;

        const validTimeframes = ['24h', '7d', '30d'];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching transaction metrics', { timeframe });

        const metrics = await analyticsService.getTransactionMetrics(timeframe);

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        logger.error('Error fetching transaction metrics', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

export default router;
