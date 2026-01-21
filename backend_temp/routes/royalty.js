// Royalty Routes - ERC-2981 compliant royalty management
import express from 'express';
import RoyaltyService from '../services/RoyaltyService.js';
import { ethers } from 'ethers';
const router = express.Router();

/**
 * Initialize RoyaltyService
 * Note: Replace with actual contract address and provider
 */
const ROYALTY_CONTRACT_ADDRESS = process.env.ROYALTY_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca');
const royaltyService = new RoyaltyService(ROYALTY_CONTRACT_ADDRESS, provider);

/**
 * Set collection-level royalties
 * POST /api/v1/royalty/set-collection
 */
router.post('/set-collection', async (req, res) => {
  try {
    const { collection, recipients } = req.body;

    // Validate collection address
    if (!collection || !ethers.isAddress(collection)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection address',
      });
    }

    // Validate recipients
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient required',
      });
    }

    // Calculate total percentage
    const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (totalPercentage > 50) {
      return res.status(400).json({
        success: false,
        message: 'Total royalty percentage cannot exceed 50%',
      });
    }

    // Get signer from request (would come from authenticated user)
    // For now, use contract owner signer
    const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
    if (!ownerPrivateKey) {
      return res.status(500).json({
        success: false,
        message: 'Signer not configured',
      });
    }

    const signer = new ethers.Wallet(ownerPrivateKey, provider);
    const result = await royaltyService.setCollectionRoyalty(collection, recipients, signer);

    res.json({
      success: true,
      message: 'Collection royalty set successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error setting collection royalty:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Set NFT-level royalties
 * POST /api/v1/royalty/set-nft
 */
router.post('/set-nft', async (req, res) => {
  try {
    const { collection, tokenId, recipients } = req.body;

    // Validate inputs
    if (!collection || !ethers.isAddress(collection)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection address',
      });
    }

    if (!tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Token ID required',
      });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient required',
      });
    }

    const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (totalPercentage > 50) {
      return res.status(400).json({
        success: false,
        message: 'Total royalty percentage cannot exceed 50%',
      });
    }

    const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
    const signer = new ethers.Wallet(ownerPrivateKey, provider);
    const result = await royaltyService.setNFTRoyalty(collection, tokenId, recipients, signer);

    res.json({
      success: true,
      message: 'NFT royalty set successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error setting NFT royalty:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get royalty information for a sale
 * GET /api/v1/royalty/info/:collection/:tokenId/:salePrice
 */
router.get('/info/:collection/:tokenId/:salePrice', async (req, res) => {
  try {
    const { collection, tokenId, salePrice } = req.params;

    if (!ethers.isAddress(collection)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection address',
      });
    }

    const result = await royaltyService.getRoyaltyInfo(
      collection,
      tokenId,
      ethers.parseEther(salePrice)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error getting royalty info:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get collection royalties
 * GET /api/v1/royalty/collection/:address
 */
router.get('/collection/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection address',
      });
    }

    const result = await royaltyService.getCollectionRoyalties(address);

    res.json({
      success: true,
      data: result,
      total: result.length,
    });
  } catch (error) {
    console.error('Error getting collection royalties:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get NFT royalties
 * GET /api/v1/royalty/nft/:collection/:tokenId
 */
router.get('/nft/:collection/:tokenId', async (req, res) => {
  try {
    const { collection, tokenId } = req.params;

    if (!ethers.isAddress(collection)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection address',
      });
    }

    const result = await royaltyService.getNFTRoyalties(collection, tokenId);

    res.json({
      success: true,
      data: result,
      total: result.length,
    });
  } catch (error) {
    console.error('Error getting NFT royalties:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get pending royalties for recipient
 * GET /api/v1/royalty/pending/:recipient/:collection
 */
router.get('/pending/:recipient/:collection', async (req, res) => {
  try {
    const { recipient, collection } = req.params;

    if (!ethers.isAddress(recipient) || !ethers.isAddress(collection)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address format',
      });
    }

    const result = await royaltyService.getPendingRoyalties(recipient, collection);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error getting pending royalties:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Claim pending royalties
 * POST /api/v1/royalty/claim
 */
router.post('/claim', async (req, res) => {
  try {
    const { collection, recipientPrivateKey } = req.body;

    if (!collection || !ethers.isAddress(collection)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection address',
      });
    }

    if (!recipientPrivateKey) {
      return res.status(400).json({
        success: false,
        message: 'Recipient private key required',
      });
    }

    const signer = new ethers.Wallet(recipientPrivateKey, provider);
    const result = await royaltyService.claimRoyalties(collection, signer);

    res.json({
      success: true,
      message: 'Royalties claimed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error claiming royalties:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Calculate batch royalties
 * POST /api/v1/royalty/calculate-batch
 */
router.post('/calculate-batch', async (req, res) => {
  try {
    const { sales } = req.body;

    if (!Array.isArray(sales) || sales.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sales array required',
      });
    }

    // Validate sale objects
    for (const sale of sales) {
      if (!sale.collection || !sale.tokenId || !sale.salePrice) {
        return res.status(400).json({
          success: false,
          message: 'Each sale must have collection, tokenId, and salePrice',
        });
      }
      if (!ethers.isAddress(sale.collection)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid collection address in sales',
        });
      }
    }

    // Convert sale prices to BigInt
    const salesToCalculate = sales.map(s => ({
      ...s,
      salePrice: ethers.parseEther(s.salePrice.toString()),
    }));

    const results = await royaltyService.calculateBatchRoyalties(salesToCalculate);

    res.json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (error) {
    console.error('Error calculating batch royalties:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get royalty statistics
 * GET /api/v1/royalty/stats/:userAddress
 */
router.get('/stats/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user address',
      });
    }

    const stats = royaltyService.getStats();

    res.json({
      success: true,
      data: {
        ...stats,
        totalDistributed: stats.totalDistributed.toFixed(4),
        collectionCount: Object.keys(stats.distributionsByCollection).length,
        recipientCount: stats.totalRecipients,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error getting royalty statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Add royalty recipient
 * POST /api/v1/royalty/add-recipient
 */
router.post('/add-recipient', async (req, res) => {
  try {
    const { collection, recipient, percentage } = req.body;

    if (!ethers.isAddress(collection) || !ethers.isAddress(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid addresses',
      });
    }

    if (percentage < 0.1 || percentage > 50) {
      return res.status(400).json({
        success: false,
        message: 'Percentage must be between 0.1% and 50%',
      });
    }

    const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
    const signer = new ethers.Wallet(ownerPrivateKey, provider);

    const result = await royaltyService.addRoyaltyRecipient(
      collection,
      recipient,
      Math.round(percentage * 100), // Convert to basis points
      signer
    );

    res.json({
      success: true,
      message: 'Recipient added successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error adding recipient:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Remove royalty recipient
 * POST /api/v1/royalty/remove-recipient
 */
router.post('/remove-recipient', async (req, res) => {
  try {
    const { collection, recipient } = req.body;

    if (!ethers.isAddress(collection) || !ethers.isAddress(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid addresses',
      });
    }

    const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
    const signer = new ethers.Wallet(ownerPrivateKey, provider);

    const result = await royaltyService.removeRoyaltyRecipient(collection, recipient, signer);

    res.json({
      success: true,
      message: 'Recipient removed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error removing recipient:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get cache statistics
 * GET /api/v1/royalty/cache/stats
 */
router.get('/cache/stats', (req, res) => {
  try {
    const stats = royaltyService.getCacheStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Clear cache
 * POST /api/v1/royalty/cache/clear
 */
router.post('/cache/clear', (req, res) => {
  try {
    royaltyService.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
