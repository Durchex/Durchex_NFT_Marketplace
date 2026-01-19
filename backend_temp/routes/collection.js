/**
 * Collection Routes
 * API endpoints for collection management
 */

const express = require('express');
const router = express.Router();
const CollectionService = require('../services/collectionService');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

// Initialize collection service (should be injected via middleware)
let collectionService = null;

router.use((req, res, next) => {
    collectionService = req.app.locals.collectionService;
    if (!collectionService) {
        return res.status(500).json({ error: 'Collection service not initialized' });
    }
    next();
});

/**
 * POST /api/collections
 * Create a new collection
 * Auth required
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const { name, description, imageURI, externalLink } = req.body;
        const userAddress = req.user.address;

        // Validate input
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Collection name is required' });
        }

        if (name.length > 100) {
            return res.status(400).json({ error: 'Collection name too long (max 100 chars)' });
        }

        if (description && description.length > 1000) {
            return res.status(400).json({ error: 'Collection description too long (max 1000 chars)' });
        }

        logger.info('Creating collection', {
            name,
            creator: userAddress
        });

        const result = await collectionService.createCollection(
            name,
            description || '',
            imageURI || '',
            externalLink || ''
        );

        res.status(201).json({
            success: true,
            data: {
                collectionId: result.collectionId,
                transactionHash: result.transactionHash,
                blockNumber: result.blockNumber
            }
        });
    } catch (error) {
        logger.error('Error creating collection', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/collections/:id
 * Get collection details
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid collection ID' });
        }

        const collection = await collectionService.getCollectionDetails(id);

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        res.json({
            success: true,
            data: collection
        });
    } catch (error) {
        logger.error('Error getting collection', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/collections/:id
 * Update collection metadata
 * Auth required (creator only)
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, imageURI, externalLink } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid collection ID' });
        }

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Collection name is required' });
        }

        if (name.length > 100) {
            return res.status(400).json({ error: 'Collection name too long' });
        }

        logger.info('Updating collection', { collectionId: id });

        const result = await collectionService.updateCollectionMetadata(
            id,
            name,
            description || '',
            imageURI || '',
            externalLink || ''
        );

        res.json({
            success: true,
            data: {
                transactionHash: result.transactionHash,
                blockNumber: result.blockNumber
            }
        });
    } catch (error) {
        logger.error('Error updating collection', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/collections/:id
 * Delete collection
 * Auth required (creator only)
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid collection ID' });
        }

        logger.info('Deleting collection', { collectionId: id });

        const result = await collectionService.deleteCollection(id);

        res.json({
            success: true,
            data: {
                transactionHash: result.transactionHash,
                blockNumber: result.blockNumber
            }
        });
    } catch (error) {
        logger.error('Error deleting collection', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/collections/:id/nfts
 * Add NFT to collection
 * Auth required (collection creator only)
 */
router.post('/:id/nfts', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { nftContract, tokenId } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid collection ID' });
        }

        if (!nftContract || !tokenId) {
            return res.status(400).json({ error: 'NFT contract and tokenId required' });
        }

        // Validate contract address
        if (!/^0x[a-fA-F0-9]{40}$/.test(nftContract)) {
            return res.status(400).json({ error: 'Invalid NFT contract address' });
        }

        logger.info('Adding NFT to collection', {
            collectionId: id,
            nftContract,
            tokenId
        });

        const result = await collectionService.addNFTToCollection(
            id,
            nftContract,
            tokenId
        );

        res.status(201).json({
            success: true,
            data: {
                transactionHash: result.transactionHash,
                blockNumber: result.blockNumber
            }
        });
    } catch (error) {
        logger.error('Error adding NFT to collection', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/collections/:id/nfts/:contract/:tokenId
 * Remove NFT from collection
 * Auth required (collection creator only)
 */
router.delete('/:id/nfts/:contract/:tokenId', requireAuth, async (req, res) => {
    try {
        const { id, contract, tokenId } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid collection ID' });
        }

        if (!contract || !tokenId) {
            return res.status(400).json({ error: 'Invalid NFT parameters' });
        }

        logger.info('Removing NFT from collection', {
            collectionId: id,
            nftContract: contract,
            tokenId
        });

        const result = await collectionService.removeNFTFromCollection(
            id,
            contract,
            tokenId
        );

        res.json({
            success: true,
            data: {
                transactionHash: result.transactionHash,
                blockNumber: result.blockNumber
            }
        });
    } catch (error) {
        logger.error('Error removing NFT from collection', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/collections/:id/nfts
 * Get collection NFTs
 */
router.get('/:id/nfts', async (req, res) => {
    try {
        const { id } = req.params;
        const { offset = 0, limit = 20 } = req.query;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid collection ID' });
        }

        if (limit > 100) {
            return res.status(400).json({ error: 'Limit cannot exceed 100' });
        }

        const nfts = await collectionService.getCollectionNFTs(id);

        // Pagination
        const paginatedNFTs = nfts.slice(
            parseInt(offset),
            parseInt(offset) + parseInt(limit)
        );

        res.json({
            success: true,
            data: paginatedNFTs,
            pagination: {
                offset: parseInt(offset),
                limit: parseInt(limit),
                total: nfts.length
            }
        });
    } catch (error) {
        logger.error('Error getting collection NFTs', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/collections/:id/stats
 * Get collection statistics
 */
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid collection ID' });
        }

        const stats = await collectionService.getCollectionStats(id);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting collection stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/collections/:id/verify
 * Verify collection (admin only)
 * Auth required (admin only)
 */
router.post('/:id/verify', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid collection ID' });
        }

        logger.info('Verifying collection', { collectionId: id, admin: req.user.address });

        // Call verify method on smart contract
        if (collectionService.contractWithSigner && collectionService.contractWithSigner.verifyCollection) {
            const tx = await collectionService.contractWithSigner.verifyCollection(id);
            const receipt = await tx.wait();

            res.json({
                success: true,
                data: {
                    transactionHash: tx.hash,
                    blockNumber: receipt.blockNumber
                }
            });
        } else {
            res.status(501).json({ error: 'Verification method not available' });
        }
    } catch (error) {
        logger.error('Error verifying collection', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/collections/user/:address
 * Get user's collections
 */
router.get('/user/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { offset = 0, limit = 20 } = req.query;

        // Validate address
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        if (limit > 100) {
            return res.status(400).json({ error: 'Limit cannot exceed 100' });
        }

        const collections = await collectionService.getUserCollections(address);

        // Pagination
        const paginatedCollections = collections.slice(
            parseInt(offset),
            parseInt(offset) + parseInt(limit)
        );

        res.json({
            success: true,
            data: paginatedCollections,
            pagination: {
                offset: parseInt(offset),
                limit: parseInt(limit),
                total: collections.length
            }
        });
    } catch (error) {
        logger.error('Error getting user collections', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/collections
 * Get all collections (paginated)
 */
router.get('/', async (req, res) => {
    try {
        const { offset = 0, limit = 20 } = req.query;

        if (limit > 100) {
            return res.status(400).json({ error: 'Limit cannot exceed 100' });
        }

        const totalCollections = await collectionService.getTotalCollections();

        // This is a simplified implementation
        // In production, you'd want to fetch collections from a database
        res.json({
            success: true,
            data: [],
            pagination: {
                offset: parseInt(offset),
                limit: parseInt(limit),
                total: totalCollections
            }
        });
    } catch (error) {
        logger.error('Error getting collections', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/collections/:id/batch-add-nfts
 * Batch add NFTs to collection
 * Auth required (collection creator only)
 */
router.post('/:id/batch-add-nfts', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { nfts } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid collection ID' });
        }

        if (!Array.isArray(nfts) || nfts.length === 0) {
            return res.status(400).json({ error: 'NFTs array is required' });
        }

        if (nfts.length > 100) {
            return res.status(400).json({ error: 'Cannot add more than 100 NFTs at once' });
        }

        logger.info('Batch adding NFTs to collection', {
            collectionId: id,
            count: nfts.length
        });

        const results = await collectionService.batchAddNFTs(id, nfts);

        res.status(201).json({
            success: true,
            data: results
        });
    } catch (error) {
        logger.error('Error batch adding NFTs', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
