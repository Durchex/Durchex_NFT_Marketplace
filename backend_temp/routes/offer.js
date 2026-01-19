/**
 * Offer API Routes
 * Endpoints for creating, managing, and responding to offers
 */

const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const OfferService = require('../services/offerService');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

// Validation middleware
const validateOfferData = (req, res, next) => {
    const { nftContract, tokenId, seller, offerAmount, durationDays } = req.body;
    
    if (!ethers.isAddress(nftContract)) {
        return res.status(400).json({ error: 'Invalid NFT contract address' });
    }
    
    if (!tokenId || isNaN(tokenId)) {
        return res.status(400).json({ error: 'Invalid token ID' });
    }
    
    if (!ethers.isAddress(seller)) {
        return res.status(400).json({ error: 'Invalid seller address' });
    }
    
    if (offerAmount <= 0) {
        return res.status(400).json({ error: 'Offer amount must be > 0' });
    }
    
    if (durationDays < 1 || durationDays > 365) {
        return res.status(400).json({ error: 'Duration must be between 1 and 365 days' });
    }
    
    next();
};

// ==================== Offer Creation ====================

/**
 * POST /api/offers/create
 * Create new offer on NFT
 */
router.post('/create', authMiddleware, validateOfferData, async (req, res) => {
    try {
        const {
            nftContract,
            tokenId,
            seller,
            offerAmount,
            paymentToken = ethers.ZeroAddress,
            durationDays = 7
        } = req.body;

        const buyer = req.user.address;

        // Validate offer can be created
        const validation = await OfferService.validateOfferCreation(
            nftContract,
            tokenId,
            seller
        );

        if (!validation.valid) {
            return res.status(400).json({ error: 'Offer validation failed' });
        }

        logger.info('Offer creation initiated', {
            nftContract,
            tokenId,
            buyer,
            seller,
            offerAmount
        });

        res.json({
            status: 'pending',
            message: 'Offer creation initiated. Please sign transaction in wallet.',
            data: {
                nftContract,
                tokenId,
                seller,
                offerAmount,
                durationDays,
                estimatedExpiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
            }
        });

    } catch (error) {
        logger.error('Failed to create offer', { error: error.message });
        res.status(500).json({ error: error.message || 'Failed to create offer' });
    }
});

/**
 * POST /api/offers/confirm-creation
 * Confirm offer creation on blockchain
 */
router.post('/confirm-creation', authMiddleware, async (req, res) => {
    try {
        const { offerId, transactionHash, blockNumber } = req.body;

        if (!offerId || !transactionHash) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        logger.info('Offer creation confirmed', {
            offerId,
            transactionHash
        });

        res.json({
            status: 'confirmed',
            offerId,
            message: 'Offer created successfully',
            transactionHash,
            blockNumber
        });

    } catch (error) {
        logger.error('Failed to confirm offer creation', { error: error.message });
        res.status(500).json({ error: 'Failed to confirm offer creation' });
    }
});

// ==================== Offer Response ====================

/**
 * POST /api/offers/:offerId/accept
 * Accept offer and transfer NFT
 */
router.post('/:offerId/accept', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        const seller = req.user.address;

        // Validate offer
        const validation = await OfferService.validateOfferForAcceptance(offerId);

        if (!validation.valid) {
            return res.status(400).json({ error: 'Offer cannot be accepted' });
        }

        logger.info('Offer acceptance initiated', {
            offerId,
            seller,
            buyer: validation.offer.buyer
        });

        res.json({
            status: 'pending',
            message: 'Offer acceptance initiated. Please sign transaction in wallet.',
            data: {
                offerId,
                buyer: validation.offer.buyer,
                offerAmount: validation.offer.offerAmount
            }
        });

    } catch (error) {
        logger.error('Failed to accept offer', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/offers/:offerId/confirm-acceptance
 * Confirm acceptance
 */
router.post('/:offerId/confirm-acceptance', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        const { transactionHash } = req.body;

        const offerDetails = await OfferService.getOfferDetails(offerId);

        logger.info('Offer acceptance confirmed', {
            offerId,
            transactionHash,
            buyer: offerDetails.buyer
        });

        res.json({
            status: 'confirmed',
            message: 'Offer accepted successfully',
            data: {
                offerId,
                buyer: offerDetails.buyer,
                seller: offerDetails.seller,
                nftContract: offerDetails.nftContract,
                tokenId: offerDetails.tokenId,
                transactionHash
            }
        });

    } catch (error) {
        logger.error('Failed to confirm acceptance', { error: error.message });
        res.status(500).json({ error: 'Failed to confirm acceptance' });
    }
});

/**
 * POST /api/offers/:offerId/reject
 * Reject offer
 */
router.post('/:offerId/reject', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        const user = req.user.address;

        logger.info('Offer rejection initiated', {
            offerId,
            rejectedBy: user
        });

        res.json({
            status: 'pending',
            message: 'Offer rejection initiated. Please sign transaction in wallet.',
            data: { offerId }
        });

    } catch (error) {
        logger.error('Failed to reject offer', { error: error.message });
        res.status(500).json({ error: 'Failed to reject offer' });
    }
});

/**
 * POST /api/offers/:offerId/confirm-rejection
 * Confirm rejection
 */
router.post('/:offerId/confirm-rejection', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        const { transactionHash } = req.body;

        logger.info('Offer rejection confirmed', {
            offerId,
            transactionHash
        });

        res.json({
            status: 'confirmed',
            message: 'Offer rejected successfully',
            data: { offerId, transactionHash }
        });

    } catch (error) {
        logger.error('Failed to confirm rejection', { error: error.message });
        res.status(500).json({ error: 'Failed to confirm rejection' });
    }
});

/**
 * POST /api/offers/:offerId/cancel
 * Cancel offer (buyer only)
 */
router.post('/:offerId/cancel', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        const buyer = req.user.address;

        logger.info('Offer cancellation initiated', {
            offerId,
            buyer
        });

        res.json({
            status: 'pending',
            message: 'Offer cancellation initiated. Please sign transaction in wallet.',
            data: { offerId }
        });

    } catch (error) {
        logger.error('Failed to cancel offer', { error: error.message });
        res.status(500).json({ error: 'Failed to cancel offer' });
    }
});

/**
 * POST /api/offers/:offerId/confirm-cancellation
 * Confirm cancellation
 */
router.post('/:offerId/confirm-cancellation', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        const { transactionHash } = req.body;

        logger.info('Offer cancellation confirmed', {
            offerId,
            transactionHash
        });

        res.json({
            status: 'confirmed',
            message: 'Offer cancelled successfully',
            data: { offerId, transactionHash }
        });

    } catch (error) {
        logger.error('Failed to confirm cancellation', { error: error.message });
        res.status(500).json({ error: 'Failed to confirm cancellation' });
    }
});

// ==================== Counter Offers ====================

/**
 * POST /api/offers/:offerId/counter
 * Make counter-offer
 */
router.post('/:offerId/counter', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        const { counterAmount, durationDays = 3 } = req.body;
        const seller = req.user.address;

        if (!counterAmount || counterAmount <= 0) {
            return res.status(400).json({ error: 'Invalid counter amount' });
        }

        if (durationDays < 1 || durationDays > 7) {
            return res.status(400).json({ error: 'Duration must be between 1 and 7 days' });
        }

        const offerDetails = await OfferService.getOfferDetails(offerId);

        logger.info('Counter-offer creation initiated', {
            offerId,
            counterAmount,
            counterFrom: seller
        });

        res.json({
            status: 'pending',
            message: 'Counter-offer initiated. Please sign transaction in wallet.',
            data: {
                offerId,
                counterAmount,
                durationDays,
                estimatedExpiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
            }
        });

    } catch (error) {
        logger.error('Failed to create counter-offer', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/offers/:offerId/counter/:counterIndex/accept
 * Accept counter-offer
 */
router.post('/:offerId/counter/:counterIndex/accept', authMiddleware, async (req, res) => {
    try {
        const { offerId, counterIndex } = req.params;
        const buyer = req.user.address;

        logger.info('Counter-offer acceptance initiated', {
            offerId,
            counterIndex,
            buyer
        });

        res.json({
            status: 'pending',
            message: 'Counter-offer acceptance initiated. Please sign transaction in wallet.',
            data: { offerId, counterIndex }
        });

    } catch (error) {
        logger.error('Failed to accept counter-offer', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/offers/:offerId/confirm-counter-acceptance
 * Confirm counter-offer acceptance
 */
router.post('/:offerId/confirm-counter-acceptance', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        const { counterIndex, transactionHash } = req.body;

        logger.info('Counter-offer acceptance confirmed', {
            offerId,
            counterIndex,
            transactionHash
        });

        res.json({
            status: 'confirmed',
            message: 'Counter-offer accepted successfully',
            data: { offerId, counterIndex, transactionHash }
        });

    } catch (error) {
        logger.error('Failed to confirm counter-offer acceptance', { error: error.message });
        res.status(500).json({ error: 'Failed to confirm counter-offer acceptance' });
    }
});

// ==================== Offer Management ====================

/**
 * POST /api/offers/:offerId/increase
 * Increase offer amount
 */
router.post('/:offerId/increase', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        const { additionalAmount } = req.body;
        const buyer = req.user.address;

        if (!additionalAmount || additionalAmount <= 0) {
            return res.status(400).json({ error: 'Invalid additional amount' });
        }

        logger.info('Offer increase initiated', {
            offerId,
            additionalAmount,
            buyer
        });

        res.json({
            status: 'pending',
            message: 'Offer increase initiated. Please sign transaction in wallet.',
            data: { offerId, additionalAmount }
        });

    } catch (error) {
        logger.error('Failed to increase offer', { error: error.message });
        res.status(500).json({ error: 'Failed to increase offer' });
    }
});

/**
 * POST /api/offers/:offerId/confirm-increase
 * Confirm increase
 */
router.post('/:offerId/confirm-increase', authMiddleware, async (req, res) => {
    try {
        const { offerId } = req.params;
        const { additionalAmount, transactionHash } = req.body;

        const offerDetails = await OfferService.getOfferDetails(offerId);

        logger.info('Offer increase confirmed', {
            offerId,
            newAmount: offerDetails.offerAmount,
            transactionHash
        });

        res.json({
            status: 'confirmed',
            message: 'Offer amount increased successfully',
            data: {
                offerId,
                newAmount: offerDetails.offerAmount,
                transactionHash
            }
        });

    } catch (error) {
        logger.error('Failed to confirm increase', { error: error.message });
        res.status(500).json({ error: 'Failed to confirm increase' });
    }
});

// ==================== Offer Information ====================

/**
 * GET /api/offers/:offerId
 * Get offer details
 */
router.get('/:offerId', async (req, res) => {
    try {
        const { offerId } = req.params;

        const offer = await OfferService.getOfferDetails(offerId);
        const timeUntilExpiry = await OfferService.getTimeUntilExpiry(offerId);
        const isActive = await OfferService.isOfferActive(offerId);
        const counters = await OfferService.getCounterOffers(offerId);

        res.json({
            status: 'success',
            data: {
                ...offer,
                isActive,
                timeUntilExpiry,
                counterOffers: counters
            }
        });

    } catch (error) {
        logger.error('Failed to get offer details', { error: error.message });
        res.status(500).json({ error: 'Failed to get offer details' });
    }
});

/**
 * GET /api/offers/:offerId/counters
 * Get counter-offers for offer
 */
router.get('/:offerId/counters', async (req, res) => {
    try {
        const { offerId } = req.params;

        const counters = await OfferService.getCounterOffers(offerId);

        res.json({
            status: 'success',
            data: counters,
            total: counters.length
        });

    } catch (error) {
        logger.error('Failed to get counter-offers', { error: error.message });
        res.status(500).json({ error: 'Failed to get counter-offers' });
    }
});

/**
 * GET /api/offers/:offerId/status
 * Get offer status
 */
router.get('/:offerId/status', async (req, res) => {
    try {
        const { offerId } = req.params;

        const offer = await OfferService.getOfferDetails(offerId);
        const isActive = await OfferService.isOfferActive(offerId);
        const timeUntilExpiry = await OfferService.getTimeUntilExpiry(offerId);

        res.json({
            status: 'success',
            data: {
                offerId,
                status: offer.status,
                isActive,
                timeUntilExpiry,
                buyer: offer.buyer,
                seller: offer.seller,
                amount: offer.offerAmount
            }
        });

    } catch (error) {
        logger.error('Failed to get offer status', { error: error.message });
        res.status(500).json({ error: 'Failed to get offer status' });
    }
});

// ==================== User Offers ====================

/**
 * GET /api/offers/user/received
 * Get offers received by user
 */
router.get('/user/received', authMiddleware, async (req, res) => {
    try {
        const seller = req.user.address;

        logger.info('Getting received offers', { seller });

        // TODO: Implement query from blockchain or database
        res.json({
            status: 'success',
            data: [],
            message: 'Received offers query not yet implemented'
        });

    } catch (error) {
        logger.error('Failed to get received offers', { error: error.message });
        res.status(500).json({ error: 'Failed to get received offers' });
    }
});

/**
 * GET /api/offers/user/sent
 * Get offers sent by user
 */
router.get('/user/sent', authMiddleware, async (req, res) => {
    try {
        const buyer = req.user.address;

        logger.info('Getting sent offers', { buyer });

        // TODO: Implement query from blockchain or database
        res.json({
            status: 'success',
            data: [],
            message: 'Sent offers query not yet implemented'
        });

    } catch (error) {
        logger.error('Failed to get sent offers', { error: error.message });
        res.status(500).json({ error: 'Failed to get sent offers' });
    }
});

module.exports = router;
