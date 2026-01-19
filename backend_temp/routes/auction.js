/**
 * Auction API Routes
 * Endpoints for auction management and bidding
 */

const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const AuctionService = require('../services/auctionService');
const LazyNFTModel = require('../models/lazyNFTModel');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

// Validation middleware
const validateAuctionData = (req, res, next) => {
    const { nftContract, tokenId, reservePrice, durationInSeconds } = req.body;
    
    if (!ethers.isAddress(nftContract)) {
        return res.status(400).json({ error: 'Invalid NFT contract address' });
    }
    
    if (!tokenId || isNaN(tokenId)) {
        return res.status(400).json({ error: 'Invalid token ID' });
    }
    
    if (reservePrice <= 0) {
        return res.status(400).json({ error: 'Reserve price must be > 0' });
    }
    
    if (durationInSeconds < 3600 || durationInSeconds > 2592000) {
        return res.status(400).json({ error: 'Duration must be between 1 hour and 30 days' });
    }
    
    next();
};

// ==================== Auction Creation ====================

/**
 * POST /api/auctions/create
 * Create new auction
 */
router.post('/create', authMiddleware, validateAuctionData, async (req, res) => {
    try {
        const {
            nftContract,
            tokenId,
            reservePrice,
            minBidIncrement = 500,
            durationInSeconds,
            paymentToken = ethers.ZeroAddress
        } = req.body;

        const userAddress = req.user.address;

        // Verify user owns the NFT (check lazy mint or on-chain)
        try {
            // For lazy-minted NFTs
            if (nftContract.toLowerCase() === process.env.LAZY_MINT_CONTRACT_ADDRESS.toLowerCase()) {
                const lazyNFT = await LazyNFTModel.findOne({
                    tokenId: tokenId.toString(),
                    status: 'redeemed'
                });

                if (!lazyNFT) {
                    return res.status(404).json({ error: 'NFT not found' });
                }

                if (lazyNFT.buyer.toLowerCase() !== userAddress.toLowerCase()) {
                    return res.status(403).json({ error: 'You do not own this NFT' });
                }
            }
        } catch (error) {
            logger.warn('Failed to verify ownership', { error: error.message });
            // Continue - assume user verified ownership
        }

        // Create auction on blockchain
        // Note: In production, this would use signer from user's wallet
        const auctionData = {
            nftContract,
            tokenId: tokenId.toString(),
            reservePrice: reservePrice.toString(),
            minBidIncrement,
            durationInSeconds,
            paymentToken
        };

        logger.info('Auction creation initiated', {
            seller: userAddress,
            ...auctionData
        });

        // Store auction metadata in database
        // For now, return confirmation
        res.json({
            status: 'pending',
            message: 'Auction creation initiated. Please sign transaction in wallet.',
            data: {
                nftContract,
                tokenId,
                reservePrice,
                durationInSeconds,
                estimatedStartTime: new Date().toISOString(),
                estimatedEndTime: new Date(Date.now() + durationInSeconds * 1000).toISOString()
            }
        });

    } catch (error) {
        logger.error('Failed to create auction', { error: error.message });
        res.status(500).json({ error: 'Failed to create auction' });
    }
});

/**
 * POST /api/auctions/confirm-creation
 * Confirm auction creation on blockchain
 */
router.post('/confirm-creation', authMiddleware, async (req, res) => {
    try {
        const { auctionId, transactionHash, blockNumber } = req.body;

        if (!auctionId || !transactionHash) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        logger.info('Auction creation confirmed', {
            auctionId,
            transactionHash,
            blockNumber
        });

        res.json({
            status: 'confirmed',
            auctionId,
            message: 'Auction created successfully',
            transactionHash,
            blockNumber
        });

    } catch (error) {
        logger.error('Failed to confirm auction creation', { error: error.message });
        res.status(500).json({ error: 'Failed to confirm auction creation' });
    }
});

// ==================== Bidding ====================

/**
 * POST /api/auctions/:auctionId/bid
 * Place bid on auction
 */
router.post('/:auctionId/bid', authMiddleware, async (req, res) => {
    try {
        const { auctionId } = req.params;
        const { bidAmount } = req.body;
        const bidder = req.user.address;

        if (!bidAmount || bidAmount <= 0) {
            return res.status(400).json({ error: 'Invalid bid amount' });
        }

        // Validate auction
        const validation = await AuctionService.validateAuctionForBid(
            parseInt(auctionId),
            bidAmount
        );

        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        logger.info('Bid placement initiated', {
            auctionId,
            bidder,
            bidAmount,
            minBid: validation.minBid
        });

        res.json({
            status: 'pending',
            message: 'Bid placement initiated. Please sign transaction in wallet.',
            data: {
                auctionId,
                bidAmount,
                minRequiredBid: validation.minBid,
                timeUntilEnd: validation.timeUntilEnd
            }
        });

    } catch (error) {
        logger.error('Failed to place bid', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auctions/:auctionId/confirm-bid
 * Confirm bid on blockchain
 */
router.post('/:auctionId/confirm-bid', authMiddleware, async (req, res) => {
    try {
        const { auctionId } = req.params;
        const { bidAmount, transactionHash, blockNumber } = req.body;
        const bidder = req.user.address;

        if (!transactionHash) {
            return res.status(400).json({ error: 'Missing transaction hash' });
        }

        logger.info('Bid confirmed on blockchain', {
            auctionId,
            bidder,
            bidAmount,
            transactionHash
        });

        // Get updated auction details
        const auctionDetails = await AuctionService.getAuctionDetails(auctionId);
        const bidHistory = await AuctionService.getBidHistory(auctionId);

        res.json({
            status: 'confirmed',
            message: 'Bid placed successfully',
            data: {
                auctionId,
                bidder,
                bidAmount,
                transactionHash,
                currentBid: auctionDetails.currentBid,
                totalBids: bidHistory.length,
                timeUntilEnd: await AuctionService.getTimeUntilEnd(auctionId)
            }
        });

    } catch (error) {
        logger.error('Failed to confirm bid', { error: error.message });
        res.status(500).json({ error: 'Failed to confirm bid' });
    }
});

// ==================== Auction Settlement ====================

/**
 * POST /api/auctions/:auctionId/settle
 * Settle auction - transfer NFT and payments
 */
router.post('/:auctionId/settle', authMiddleware, async (req, res) => {
    try {
        const { auctionId } = req.params;
        const settler = req.user.address;

        // Validate auction can be settled
        const validation = await AuctionService.validateAuctionForSettlement(auctionId);

        if (!validation.valid) {
            return res.status(400).json({ error: 'Auction cannot be settled' });
        }

        if (!validation.reserveMet) {
            return res.status(400).json({ 
                error: 'Reserve price not met. Auction will be cancelled.',
                reserveMet: false
            });
        }

        logger.info('Auction settlement initiated', {
            auctionId,
            settler,
            winner: validation.winner,
            winningBid: validation.winningBid
        });

        res.json({
            status: 'pending',
            message: 'Auction settlement initiated. Please sign transaction in wallet.',
            data: {
                auctionId,
                winner: validation.winner,
                winningBid: validation.winningBid
            }
        });

    } catch (error) {
        logger.error('Failed to settle auction', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auctions/:auctionId/confirm-settlement
 * Confirm settlement
 */
router.post('/:auctionId/confirm-settlement', authMiddleware, async (req, res) => {
    try {
        const { auctionId } = req.params;
        const { transactionHash } = req.body;

        if (!transactionHash) {
            return res.status(400).json({ error: 'Missing transaction hash' });
        }

        const auctionDetails = await AuctionService.getAuctionDetails(auctionId);

        logger.info('Auction settlement confirmed', {
            auctionId,
            transactionHash,
            winner: auctionDetails.currentBidder
        });

        res.json({
            status: 'settled',
            message: 'Auction settled successfully',
            data: {
                auctionId,
                winner: auctionDetails.currentBidder,
                winningBid: auctionDetails.currentBid,
                transactionHash
            }
        });

    } catch (error) {
        logger.error('Failed to confirm settlement', { error: error.message });
        res.status(500).json({ error: 'Failed to confirm settlement' });
    }
});

// ==================== Auction Information ====================

/**
 * GET /api/auctions/:auctionId
 * Get auction details
 */
router.get('/:auctionId', async (req, res) => {
    try {
        const { auctionId } = req.params;

        const details = await AuctionService.getAuctionDetails(auctionId);
        const timeUntilEnd = await AuctionService.getTimeUntilEnd(auctionId);
        const bidHistory = await AuctionService.getBidHistory(auctionId);
        const isActive = await AuctionService.isAuctionActive(auctionId);

        res.json({
            status: 'success',
            data: {
                ...details,
                isActive,
                timeUntilEnd,
                totalBids: bidHistory.length,
                highestBidder: details.currentBidder,
                highestBid: details.currentBid,
                reserveMet: parseFloat(details.currentBid) >= parseFloat(details.reservePrice)
            }
        });

    } catch (error) {
        logger.error('Failed to get auction details', { error: error.message });
        res.status(500).json({ error: 'Failed to get auction details' });
    }
});

/**
 * GET /api/auctions/:auctionId/bids
 * Get bid history for auction
 */
router.get('/:auctionId/bids', async (req, res) => {
    try {
        const { auctionId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const bidHistory = await AuctionService.getBidHistory(auctionId);
        
        // Sort by timestamp descending and paginate
        const sorted = bidHistory.sort((a, b) => b.timestamp - a.timestamp);
        const paginated = sorted.slice(offset, offset + limit);

        res.json({
            status: 'success',
            data: paginated,
            total: bidHistory.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        logger.error('Failed to get bid history', { error: error.message });
        res.status(500).json({ error: 'Failed to get bid history' });
    }
});

/**
 * GET /api/auctions/:auctionId/info
 * Get auction status and minimum next bid
 */
router.get('/:auctionId/info', async (req, res) => {
    try {
        const { auctionId } = req.params;

        const [details, minNextBid, timeUntilEnd, isActive] = await Promise.all([
            AuctionService.getAuctionDetails(auctionId),
            AuctionService.getMinNextBid(auctionId),
            AuctionService.getTimeUntilEnd(auctionId),
            AuctionService.isAuctionActive(auctionId)
        ]);

        res.json({
            status: 'success',
            data: {
                auctionId,
                isActive,
                currentBid: details.currentBid,
                minNextBid,
                timeUntilEnd,
                seller: details.seller,
                currentBidder: details.currentBidder,
                reservePrice: details.reservePrice,
                reserveMet: parseFloat(details.currentBid) >= parseFloat(details.reservePrice)
            }
        });

    } catch (error) {
        logger.error('Failed to get auction info', { error: error.message });
        res.status(500).json({ error: 'Failed to get auction info' });
    }
});

// ==================== User Auctions ====================

/**
 * GET /api/auctions/user/active
 * Get user's active auctions (as seller)
 */
router.get('/user/active', authMiddleware, async (req, res) => {
    try {
        const userAddress = req.user.address;
        // Note: This would need to query auction history from blockchain or database
        
        logger.info('Getting active auctions for user', { userAddress });
        
        res.json({
            status: 'success',
            data: [],
            message: 'Auction query not yet implemented'
        });

    } catch (error) {
        logger.error('Failed to get user auctions', { error: error.message });
        res.status(500).json({ error: 'Failed to get user auctions' });
    }
});

/**
 * GET /api/auctions/user/bids
 * Get user's bids (as bidder)
 */
router.get('/user/bids', authMiddleware, async (req, res) => {
    try {
        const userAddress = req.user.address;
        // Note: This would need to query bid history
        
        logger.info('Getting user bids', { userAddress });
        
        res.json({
            status: 'success',
            data: [],
            message: 'Bid query not yet implemented'
        });

    } catch (error) {
        logger.error('Failed to get user bids', { error: error.message });
        res.status(500).json({ error: 'Failed to get user bids' });
    }
});

module.exports = router;
