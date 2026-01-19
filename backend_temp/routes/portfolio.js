/**
 * Portfolio Routes
 * API endpoints for user portfolio, activity, and statistics
 */

const express = require('express');
const router = express.Router();
const PortfolioService = require('../services/portfolioService');
const { requireAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

// Initialize portfolio service
let portfolioService = null;

router.use((req, res, next) => {
    portfolioService = req.app.locals.portfolioService;
    if (!portfolioService) {
        return res.status(500).json({ error: 'Portfolio service not initialized' });
    }
    next();
});

/**
 * GET /api/portfolio/:address
 * Get user's complete portfolio overview
 */
router.get('/:address', async (req, res) => {
    try {
        const { address } = req.params;

        // Validate address
        if (!portfolioService.validateAddress(address)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        logger.info('Fetching portfolio for user', { address });

        const portfolio = await portfolioService.getUserPortfolio(address);

        res.json({
            success: true,
            data: portfolio
        });
    } catch (error) {
        logger.error('Error fetching portfolio', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/portfolio/:address/nfts
 * Get user's owned NFTs (paginated)
 */
router.get('/:address/nfts', async (req, res) => {
    try {
        const { address } = req.params;
        const { offset = 0, limit = 20, sort = 'recent' } = req.query;

        if (!portfolioService.validateAddress(address)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        if (limit > 100) {
            return res.status(400).json({ error: 'Limit cannot exceed 100' });
        }

        logger.info('Fetching owned NFTs', { address, offset, limit });

        const nfts = await portfolioService.getOwnedNFTs(address, parseInt(offset), parseInt(limit));

        // Apply sorting
        const sorted = this.sortNFTs(nfts, sort);

        res.json({
            success: true,
            data: sorted,
            pagination: {
                offset: parseInt(offset),
                limit: parseInt(limit),
                total: nfts.length
            }
        });
    } catch (error) {
        logger.error('Error fetching owned NFTs', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/portfolio/:address/stats
 * Get portfolio statistics
 */
router.get('/:address/stats', async (req, res) => {
    try {
        const { address } = req.params;

        if (!portfolioService.validateAddress(address)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        logger.info('Fetching portfolio stats', { address });

        const stats = await portfolioService.getPortfolioStats(address);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error fetching portfolio stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/portfolio/:address/activity
 * Get user's activity history (paginated)
 */
router.get('/:address/activity', async (req, res) => {
    try {
        const { address } = req.params;
        const { offset = 0, limit = 50, type = null } = req.query;

        if (!portfolioService.validateAddress(address)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        if (limit > 200) {
            return res.status(400).json({ error: 'Limit cannot exceed 200' });
        }

        logger.info('Fetching activity history', { address, offset, limit });

        let activity = await portfolioService.getActivityHistory(
            address,
            parseInt(offset),
            parseInt(limit)
        );

        // Filter by type if specified
        if (type && ['mint', 'transfer', 'sale', 'offer', 'bid', 'auction'].includes(type)) {
            activity = activity.filter(a => a.type === type);
        }

        res.json({
            success: true,
            data: activity,
            pagination: {
                offset: parseInt(offset),
                limit: parseInt(limit),
                total: activity.length
            }
        });
    } catch (error) {
        logger.error('Error fetching activity history', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/portfolio/:address/performance
 * Get portfolio performance over time
 */
router.get('/:address/performance', async (req, res) => {
    try {
        const { address } = req.params;
        const { timeframe = '7d' } = req.query;

        if (!portfolioService.validateAddress(address)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const validTimeframes = ['7d', '30d', '90d', '1y'];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching portfolio performance', { address, timeframe });

        const performance = await portfolioService.getPortfolioPerformance(address, timeframe);

        res.json({
            success: true,
            data: performance
        });
    } catch (error) {
        logger.error('Error fetching portfolio performance', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/portfolio/:address/spending
 * Get spending analysis
 */
router.get('/:address/spending', async (req, res) => {
    try {
        const { address } = req.params;
        const { timeframe = '30d' } = req.query;

        if (!portfolioService.validateAddress(address)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const validTimeframes = ['7d', '30d', '90d', '1y'];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        logger.info('Fetching spending analysis', { address, timeframe });

        const spending = await portfolioService.getSpendingAnalysis(address, timeframe);

        res.json({
            success: true,
            data: spending
        });
    } catch (error) {
        logger.error('Error fetching spending analysis', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/portfolio/:address/composition
 * Get portfolio composition breakdown
 */
router.get('/:address/composition', async (req, res) => {
    try {
        const { address } = req.params;

        if (!portfolioService.validateAddress(address)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        logger.info('Fetching portfolio composition', { address });

        const nfts = await portfolioService.getOwnedNFTs(address, 0, 1000);
        const composition = portfolioService.getPortfolioComposition(nfts);

        res.json({
            success: true,
            data: composition
        });
    } catch (error) {
        logger.error('Error fetching portfolio composition', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/portfolio/my-portfolio
 * Get authenticated user's portfolio
 */
router.get('/user/me', requireAuth, async (req, res) => {
    try {
        const userAddress = req.user.address;

        logger.info('Fetching authenticated user portfolio', { userAddress });

        const portfolio = await portfolioService.getUserPortfolio(userAddress);

        res.json({
            success: true,
            data: portfolio
        });
    } catch (error) {
        logger.error('Error fetching authenticated user portfolio', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/portfolio/my-portfolio/nfts
 * Get authenticated user's NFTs
 */
router.get('/user/me/nfts', requireAuth, async (req, res) => {
    try {
        const userAddress = req.user.address;
        const { offset = 0, limit = 20, sort = 'recent' } = req.query;

        if (limit > 100) {
            return res.status(400).json({ error: 'Limit cannot exceed 100' });
        }

        logger.info('Fetching authenticated user NFTs', { userAddress });

        const nfts = await portfolioService.getOwnedNFTs(userAddress, parseInt(offset), parseInt(limit));

        res.json({
            success: true,
            data: nfts,
            pagination: {
                offset: parseInt(offset),
                limit: parseInt(limit),
                total: nfts.length
            }
        });
    } catch (error) {
        logger.error('Error fetching authenticated user NFTs', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/portfolio/my-portfolio/activity
 * Get authenticated user's activity
 */
router.get('/user/me/activity', requireAuth, async (req, res) => {
    try {
        const userAddress = req.user.address;
        const { offset = 0, limit = 50, type = null } = req.query;

        if (limit > 200) {
            return res.status(400).json({ error: 'Limit cannot exceed 200' });
        }

        logger.info('Fetching authenticated user activity', { userAddress });

        let activity = await portfolioService.getActivityHistory(
            userAddress,
            parseInt(offset),
            parseInt(limit)
        );

        if (type && ['mint', 'transfer', 'sale', 'offer', 'bid', 'auction'].includes(type)) {
            activity = activity.filter(a => a.type === type);
        }

        res.json({
            success: true,
            data: activity,
            pagination: {
                offset: parseInt(offset),
                limit: parseInt(limit),
                total: activity.length
            }
        });
    } catch (error) {
        logger.error('Error fetching authenticated user activity', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/portfolio/my-portfolio/stats
 * Get authenticated user's portfolio stats
 */
router.get('/user/me/stats', requireAuth, async (req, res) => {
    try {
        const userAddress = req.user.address;

        logger.info('Fetching authenticated user stats', { userAddress });

        const stats = await portfolioService.getPortfolioStats(userAddress);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error fetching authenticated user stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * Helper function to sort NFTs
 */
function sortNFTs(nfts, sort) {
    const sorted = [...nfts];
    
    switch(sort) {
        case 'value-high':
            return sorted.sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0));
        case 'value-low':
            return sorted.sort((a, b) => (a.estimatedValue || 0) - (b.estimatedValue || 0));
        case 'rarity':
            return sorted.sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
        case 'recent':
        default:
            return sorted.sort((a, b) => new Date(b.acquiredAt) - new Date(a.acquiredAt));
    }
}

module.exports = router;
