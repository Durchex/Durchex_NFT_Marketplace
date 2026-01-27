/**
 * Batch Mint Routes
 * REST API endpoints for batch minting operations
 */

const express = require('express');
const router = express.Router();
const batchMintService = require('../services/batchMintService');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * POST /batch-mint
 * Create new batch mint operation
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { nfts, autoPublish, category, network } = req.body;
        const userId = req.user.id;

        if (!nfts || !Array.isArray(nfts) || nfts.length === 0) {
            return res.status(400).json({ error: 'NFT data array required' });
        }

        if (nfts.length > 1000) {
            return res.status(400).json({ error: 'Maximum 1000 NFTs per batch' });
        }

        const batch = await batchMintService.createBatchMint(userId, nfts, {
            autoPublish: autoPublish || false,
            category: category || null,
            network: network || null,
        });

        res.json({ message: 'Batch mint created', batch });
    } catch (error) {
        console.error('Error creating batch mint:', error);
        res.status(500).json({ error: error.message || 'Failed to create batch mint' });
    }
});

/**
 * GET /batch-mint/:batchId
 * Get batch mint details
 */
router.get('/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;

        if (!batchId) {
            return res.status(400).json({ error: 'Batch ID required' });
        }

        const batch = await batchMintService.getBatchMint(batchId);

        res.json(batch);
    } catch (error) {
        console.error('Error fetching batch mint:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch batch' });
    }
});

/**
 * GET /batch-mint/:batchId/stats
 * Get batch statistics
 */
router.get('/:batchId/stats', async (req, res) => {
    try {
        const { batchId } = req.params;

        if (!batchId) {
            return res.status(400).json({ error: 'Batch ID required' });
        }

        const stats = await batchMintService.getBatchStats(batchId);

        res.json(stats);
    } catch (error) {
        console.error('Error fetching batch stats:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch statistics' });
    }
});

/**
 * GET /batch-mint/user/history
 * Get batch history for current user
 */
router.get('/user/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10, skip = 0, status } = req.query;

        const result = await batchMintService.getUserBatches(userId, {
            limit: Math.min(parseInt(limit) || 10, 100),
            skip: parseInt(skip) || 0,
            status: status || null
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching batch history:', error);
        res.status(500).json({ error: 'Failed to fetch batch history' });
    }
});

/**
 * POST /batch-mint/:batchId/publish
 * Publish batch NFTs to marketplace
 */
router.post('/:batchId/publish', authMiddleware, async (req, res) => {
    try {
        const { batchId } = req.params;
        const { listings } = req.body;

        if (!batchId) {
            return res.status(400).json({ error: 'Batch ID required' });
        }

        if (!listings || !Array.isArray(listings) || listings.length === 0) {
            return res.status(400).json({ error: 'Listings array required' });
        }

        // Validate listing data
        for (const listing of listings) {
            if (!listing.nftId || !listing.price) {
                return res.status(400).json({ error: 'Each listing requires nftId and price' });
            }
        }

        const result = await batchMintService.publishBatchNFTs(batchId, listings);

        res.json({ message: 'Batch NFTs published', result });
    } catch (error) {
        console.error('Error publishing batch:', error);
        res.status(500).json({ error: error.message || 'Failed to publish batch' });
    }
});

/**
 * POST /batch-mint/:batchId/cancel
 * Cancel batch mint operation
 */
router.post('/:batchId/cancel', authMiddleware, async (req, res) => {
    try {
        const { batchId } = req.params;

        if (!batchId) {
            return res.status(400).json({ error: 'Batch ID required' });
        }

        const batch = await batchMintService.cancelBatchMint(batchId);

        res.json({ message: 'Batch cancelled', batch });
    } catch (error) {
        console.error('Error cancelling batch:', error);
        res.status(500).json({ error: error.message || 'Failed to cancel batch' });
    }
});

/**
 * GET /batch-mint/:batchId/export
 * Export batch as CSV
 */
router.get('/:batchId/export', async (req, res) => {
    try {
        const { batchId } = req.params;

        if (!batchId) {
            return res.status(400).json({ error: 'Batch ID required' });
        }

        const csv = await batchMintService.exportBatchAsCSV(batchId);

        // Convert to CSV string
        const csvString = csv.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="batch-${batchId}.csv"`);
        res.send(csvString);
    } catch (error) {
        console.error('Error exporting batch:', error);
        res.status(500).json({ error: error.message || 'Failed to export batch' });
    }
});

/**
 * GET /batch-mint/template
 * Download CSV template
 */
router.get('/template', (req, res) => {
    try {
        const template = batchMintService.getCSVTemplate();

        // Convert to CSV string
        const csvString = template.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="batch-template.csv"');
        res.send(csvString);
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ error: 'Failed to generate template' });
    }
});

module.exports = router;
