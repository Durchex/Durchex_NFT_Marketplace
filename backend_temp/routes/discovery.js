/**
 * Discovery API Routes
 * NFT search, filtering, and discovery endpoints
 */

const express = require('express');
const router = express.Router();
const DiscoveryService = require('../services/discoveryService');
const logger = require('../utils/logger');

// Initialize discovery service (will be passed from main app)
let discoveryService;

router.setDiscoveryService = (service) => {
    discoveryService = service;
};

// ==================== Search & Filter ====================

/**
 * GET /api/discover/search
 * Search NFTs with filtering and sorting
 */
router.get('/search', async (req, res) => {
    try {
        const {
            q,
            minPrice,
            maxPrice,
            creator,
            collection,
            category,
            rarity,
            sortBy = 'newest',
            status = 'all',
            page = 1,
            limit = 20
        } = req.query;

        const filters = {
            searchTerm: q,
            minPrice,
            maxPrice,
            creator,
            collection,
            category,
            rarity,
            sortBy,
            status
        };

        const result = await discoveryService.searchNFTs(
            filters,
            parseInt(page),
            parseInt(limit)
        );

        res.json({
            status: 'success',
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        logger.error('Search failed', { error: error.message });
        res.status(500).json({ error: 'Search failed' });
    }
});

// ==================== Collections ====================

/**
 * GET /api/discover/collections/:collection
 * Get all NFTs in a collection
 */
router.get('/collections/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const result = await discoveryService.getNFTsByCollection(
            collection,
            parseInt(page),
            parseInt(limit)
        );

        res.json({
            status: 'success',
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        logger.error('Failed to get collection NFTs', { error: error.message });
        res.status(500).json({ error: 'Failed to get collection NFTs' });
    }
});

/**
 * GET /api/discover/top-collections
 * Get top collections by volume
 */
router.get('/top-collections', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const collections = await discoveryService.getTopCollections(parseInt(limit));

        res.json({
            status: 'success',
            data: collections
        });

    } catch (error) {
        logger.error('Failed to get top collections', { error: error.message });
        res.status(500).json({ error: 'Failed to get top collections' });
    }
});

// ==================== Creators ====================

/**
 * GET /api/discover/creators/:creator
 * Get all NFTs by a creator
 */
router.get('/creators/:creator', async (req, res) => {
    try {
        const { creator } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const result = await discoveryService.getNFTsByCreator(
            creator,
            parseInt(page),
            parseInt(limit)
        );

        res.json({
            status: 'success',
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        logger.error('Failed to get creator NFTs', { error: error.message });
        res.status(500).json({ error: 'Failed to get creator NFTs' });
    }
});

/**
 * GET /api/discover/top-creators
 * Get top creators by NFT count
 */
router.get('/top-creators', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const creators = await discoveryService.getTopCreators(parseInt(limit));

        res.json({
            status: 'success',
            data: creators
        });

    } catch (error) {
        logger.error('Failed to get top creators', { error: error.message });
        res.status(500).json({ error: 'Failed to get top creators' });
    }
});

// ==================== Trending & Featured ====================

/**
 * GET /api/discover/trending
 * Get trending NFTs
 */
router.get('/trending', async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const nfts = await discoveryService.getTrendingNFTs(parseInt(limit));

        res.json({
            status: 'success',
            data: nfts
        });

    } catch (error) {
        logger.error('Failed to get trending NFTs', { error: error.message });
        res.status(500).json({ error: 'Failed to get trending NFTs' });
    }
});

/**
 * GET /api/discover/on-sale
 * Get NFTs currently on sale
 */
router.get('/on-sale', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const result = await discoveryService.getNFTsOnSale(
            parseInt(page),
            parseInt(limit)
        );

        res.json({
            status: 'success',
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        logger.error('Failed to get NFTs on sale', { error: error.message });
        res.status(500).json({ error: 'Failed to get NFTs on sale' });
    }
});

// ==================== Statistics ====================

/**
 * GET /api/discover/categories
 * Get all categories with counts
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await discoveryService.getCategories();

        res.json({
            status: 'success',
            data: categories
        });

    } catch (error) {
        logger.error('Failed to get categories', { error: error.message });
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

/**
 * GET /api/discover/rarity-distribution
 * Get rarity distribution across all NFTs
 */
router.get('/rarity-distribution', async (req, res) => {
    try {
        const distribution = await discoveryService.getRarityDistribution();

        res.json({
            status: 'success',
            data: distribution
        });

    } catch (error) {
        logger.error('Failed to get rarity distribution', { error: error.message });
        res.status(500).json({ error: 'Failed to get rarity distribution' });
    }
});

/**
 * GET /api/discover/price-stats
 * Get price statistics
 */
router.get('/price-stats', async (req, res) => {
    try {
        const stats = await discoveryService.getPriceStats();

        res.json({
            status: 'success',
            data: stats
        });

    } catch (error) {
        logger.error('Failed to get price stats', { error: error.message });
        res.status(500).json({ error: 'Failed to get price stats' });
    }
});

// ==================== NFT Details ====================

/**
 * POST /api/discover/nfts/:nftId/view
 * Record NFT view for trending
 */
router.post('/nfts/:nftId/view', async (req, res) => {
    try {
        const { nftId } = req.params;

        await discoveryService.recordNFTView(nftId);

        res.json({
            status: 'success',
            message: 'View recorded'
        });

    } catch (error) {
        logger.error('Failed to record view', { error: error.message });
        res.status(500).json({ error: 'Failed to record view' });
    }
});

/**
 * GET /api/discover/nfts/:nftId/similar
 * Get similar NFTs
 */
router.get('/nfts/:nftId/similar', async (req, res) => {
    try {
        const { nftId } = req.params;
        const { limit = 6 } = req.query;

        const similar = await discoveryService.getSimilarNFTs(nftId, parseInt(limit));

        res.json({
            status: 'success',
            data: similar
        });

    } catch (error) {
        logger.error('Failed to get similar NFTs', { error: error.message });
        res.status(500).json({ error: 'Failed to get similar NFTs' });
    }
});

module.exports = router;
