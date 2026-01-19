/**
 * wishlist.js
 * API routes for wishlist management
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const wishlistService = require('../services/wishlistService');

/**
 * POST /wishlist/add/:nftId
 * Add NFT to wishlist
 */
router.post('/add/:nftId', authMiddleware, async (req, res) => {
    try {
        const { nftId } = req.params;
        const userId = req.user.id;

        const item = await wishlistService.addToWishlist(userId, nftId);

        res.status(201).json({
            success: true,
            data: item,
            message: 'Added to wishlist',
        });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding to wishlist',
            error: error.message,
        });
    }
});

/**
 * DELETE /wishlist/remove/:nftId
 * Remove NFT from wishlist
 */
router.delete('/remove/:nftId', authMiddleware, async (req, res) => {
    try {
        const { nftId } = req.params;
        const userId = req.user.id;

        const removed = await wishlistService.removeFromWishlist(userId, nftId);

        if (!removed) {
            return res.status(404).json({
                success: false,
                message: 'Item not in wishlist',
            });
        }

        res.json({
            success: true,
            message: 'Removed from wishlist',
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing from wishlist',
            error: error.message,
        });
    }
});

/**
 * GET /wishlist
 * Get user's wishlist with pagination
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = parseInt(req.query.skip) || 0;
        const includePriceChange = req.query.priceChange === 'true';

        const result = await wishlistService.getWishlist(userId, limit, skip, {
            includePriceChange,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wishlist',
            error: error.message,
        });
    }
});

/**
 * GET /wishlist/check/:nftId
 * Check if NFT is in wishlist
 */
router.get('/check/:nftId', authMiddleware, async (req, res) => {
    try {
        const { nftId } = req.params;
        const userId = req.user.id;

        const inWishlist = await wishlistService.isInWishlist(userId, nftId);

        res.json({
            success: true,
            data: { inWishlist },
        });
    } catch (error) {
        console.error('Error checking wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking wishlist',
            error: error.message,
        });
    }
});

/**
 * GET /wishlist/count
 * Get wishlist count
 */
router.get('/count', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await wishlistService.getWishlistCount(userId);

        res.json({
            success: true,
            data: { count },
        });
    } catch (error) {
        console.error('Error getting wishlist count:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting wishlist count',
            error: error.message,
        });
    }
});

/**
 * GET /wishlist/price-drops
 * Get wishlist items with price drops
 */
router.get('/price-drops', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const dropPercentage = parseFloat(req.query.drop) || 5;

        const items = await wishlistService.getWishlistWithPriceDrops(
            userId,
            dropPercentage
        );

        res.json({
            success: true,
            data: {
                items,
                count: items.length,
                priceDropThreshold: dropPercentage,
            },
        });
    } catch (error) {
        console.error('Error fetching price drops:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching price drops',
            error: error.message,
        });
    }
});

/**
 * GET /wishlist/export
 * Export wishlist as CSV
 */
router.get('/export', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const csv = await wishlistService.exportWishlistCSV(userId);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=wishlist.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting wishlist',
            error: error.message,
        });
    }
});

/**
 * DELETE /wishlist/clear
 * Clear entire wishlist
 */
router.delete('/clear', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const deletedCount = await wishlistService.clearWishlist(userId);

        res.json({
            success: true,
            data: { deletedCount },
            message: 'Wishlist cleared',
        });
    } catch (error) {
        console.error('Error clearing wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing wishlist',
            error: error.message,
        });
    }
});

module.exports = router;
