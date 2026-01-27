// backend_temp/routes/lazyMint.js
import express from 'express';
import lazyMintService from '../services/lazyMintService.js';
import LazyNFT from '../models/lazyNFTModel.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/lazy-mint/create-voucher
 * Creator signs NFT metadata to create a lazy mint voucher
 * No blockchain transaction yet
 */
router.post('/create-voucher', authMiddleware, async (req, res) => {
    try {
        const { name, description, ipfsURI, royaltyPercentage } = req.body;
        const creatorAddress = req.user.address;

        if (!ipfsURI || !creatorAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: ipfsURI, creator address',
            });
        }

        if (!ipfsURI.startsWith('ipfs://')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IPFS URI format',
            });
        }

        if (royaltyPercentage < 0 || royaltyPercentage > 50) {
            return res.status(400).json({
                success: false,
                error: 'Royalty must be between 0 and 50',
            });
        }

        // Create the voucher (signing happens on frontend, we just prepare it)
        const voucherData = {
            creator: creatorAddress,
            name,
            description,
            ipfsURI,
            royaltyPercentage,
        };

        // This is what the creator needs to sign
        const messageToSign = {
            uri: ipfsURI,
            royaltyPercentage,
            creatorAddress,
        };

        res.json({
            success: true,
            message: 'Voucher prepared. Creator should sign this on frontend.',
            messageToSign,
            creatorAddress,
        });
    } catch (error) {
        console.error('Error creating voucher:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/lazy-mint/submit
 * Store lazy mint voucher after creator signs
 * Voucher includes signature from creator
 */
router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            description,
            ipfsURI,
            royaltyPercentage,
            signature,
            messageHash,
            nonce,
            pieces,
            price,
            category,
            collection,
            enableStraightBuy,
        } = req.body;
        const creatorAddress = req.user.address;

        if (!signature || !ipfsURI || !messageHash || nonce === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: signature, ipfsURI, messageHash, nonce',
            });
        }

        // Validate voucher
        const isValid = await lazyMintService.validateVoucher({
            creator: creatorAddress,
            ipfsURI,
            royaltyPercentage,
            signature,
            messageHash,
            nonce,
        });

        if (!isValid) {
            console.error('[lazyMint/submit] Voucher validation failed:', {
                creator: creatorAddress,
                ipfsURI,
                royaltyPercentage,
                hasSignature: !!signature,
                hasMessageHash: !!messageHash,
                nonce
            });
            return res.status(400).json({
                success: false,
                error: 'Invalid voucher or signature. Please check: signature format, message hash, nonce, and that this voucher hasn\'t been submitted before.',
            });
        }

        // Try to fetch image from IPFS metadata if ipfsURI is provided
        let imageURI = '';
        if (ipfsURI) {
            try {
                // Convert IPFS URI to HTTP gateway URL
                let httpURI = ipfsURI;
                if (ipfsURI.startsWith('ipfs://')) {
                    const cid = ipfsURI.replace('ipfs://', '');
                    httpURI = `https://ipfs.io/ipfs/${cid}`;
                }
                
                // Fetch metadata to extract image (with timeout)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                
                try {
                    const metadataResponse = await fetch(httpURI, { 
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    
                    if (metadataResponse.ok) {
                        const metadata = await metadataResponse.json();
                        if (metadata.image) {
                            // Convert image IPFS URI to HTTP gateway if needed
                            if (metadata.image.startsWith('ipfs://')) {
                                const imageCID = metadata.image.replace('ipfs://', '');
                                imageURI = `https://ipfs.io/ipfs/${imageCID}`;
                            } else {
                                imageURI = metadata.image;
                            }
                        }
                    }
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    throw fetchError;
                }
            } catch (metadataError) {
                // If metadata fetch fails, continue without imageURI
                // The frontend can fetch it later if needed
                console.warn('Could not fetch IPFS metadata for image:', metadataError.message);
            }
        }

        // Store in database
        const lazyNFT = new LazyNFT({
            creator: creatorAddress.toLowerCase(),
            name,
            description,
            ipfsURI,
            imageURI: imageURI || '', // Store extracted image URI
            royaltyPercentage,
            signature,
            messageHash,
            nonce,
            pieces: pieces || 1,
            remainingPieces: pieces || 1,
            price: price || null,
            category: category || '',
            collection: collection || null,
            enableStraightBuy: enableStraightBuy !== undefined ? enableStraightBuy : true,
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });

        await lazyNFT.save();

        res.json({
            success: true,
            message: 'Lazy mint created successfully',
            lazyNFT: {
                id: lazyNFT._id,
                creator: lazyNFT.creator,
                name: lazyNFT.name,
                ipfsURI: lazyNFT.ipfsURI,
                royaltyPercentage: lazyNFT.royaltyPercentage,
                status: lazyNFT.status,
                createdAt: lazyNFT.createdAt,
            },
        });
    } catch (error) {
        console.error('Error submitting lazy mint:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/lazy-mint/creator/:address/nonce
 * Get creator's current nonce for signature verification
 */
router.get('/creator/:address/nonce', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Creator address required',
            });
        }

        // Get nonce from service (which queries contract or returns 0)
        const nonce = await lazyMintService.getCreatorNonce(address.toLowerCase());

        res.json({
            success: true,
            nonce,
            creator: address.toLowerCase(),
        });
    } catch (error) {
        console.error('Error getting creator nonce:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/lazy-mint/creator
 * Get all lazy mints created by authenticated user
 */
router.get('/creator', authMiddleware, async (req, res) => {
    try {
        const creatorAddress = req.user.address;
        const status = req.query.status || 'pending';

        const lazyNFTs = await LazyNFT.find({
            creator: creatorAddress.toLowerCase(),
            status: status,
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: lazyNFTs.length,
            lazyNFTs,
        });
    } catch (error) {
        console.error('Error fetching creator lazy mints:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/lazy-mint/available
 * Get all available lazy mints for marketplace
 */
router.get('/available', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const skip = (page - 1) * limit;

        const [lazyNFTs, total] = await Promise.all([
            LazyNFT.find({ status: 'pending' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            LazyNFT.countDocuments({ status: 'pending' }),
        ]);

        res.json({
            success: true,
            data: lazyNFTs,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
        });
    } catch (error) {
        console.error('Error fetching available lazy mints:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/lazy-mint/:id
 * Get specific lazy mint details
 */
router.get('/:id', async (req, res) => {
    try {
        const lazyNFT = await LazyNFT.findById(req.params.id);

        if (!lazyNFT) {
            return res.status(404).json({
                success: false,
                error: 'Lazy NFT not found',
            });
        }

        // Increment views
        lazyNFT.views += 1;
        await lazyNFT.save();

        res.json({
            success: true,
            lazyNFT,
        });
    } catch (error) {
        console.error('Error fetching lazy NFT:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/lazy-mint/:id/like
 * Like a lazy mint NFT
 */
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const lazyNFT = await LazyNFT.findById(req.params.id);

        if (!lazyNFT) {
            return res.status(404).json({
                success: false,
                error: 'Lazy NFT not found',
            });
        }

        const userAddress = req.user.address.toLowerCase();

        if (!lazyNFT.likes.includes(userAddress)) {
            lazyNFT.likes.push(userAddress);
            await lazyNFT.save();
        }

        res.json({
            success: true,
            message: 'Liked successfully',
            likes: lazyNFT.likes.length,
        });
    } catch (error) {
        console.error('Error liking lazy NFT:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/lazy-mint/:id/unlike
 * Unlike a lazy mint NFT
 */
router.post('/:id/unlike', authMiddleware, async (req, res) => {
    try {
        const lazyNFT = await LazyNFT.findById(req.params.id);

        if (!lazyNFT) {
            return res.status(404).json({
                success: false,
                error: 'Lazy NFT not found',
            });
        }

        const userAddress = req.user.address.toLowerCase();

        lazyNFT.likes = lazyNFT.likes.filter((like) => like !== userAddress);
        await lazyNFT.save();

        res.json({
            success: true,
            message: 'Unliked successfully',
            likes: lazyNFT.likes.length,
        });
    } catch (error) {
        console.error('Error unliking lazy NFT:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/lazy-mint/:id/redeem
 * Redeem lazy mint on blockchain (buyer calls this)
 * Includes payment and signature verification
 */
router.post('/:id/redeem', authMiddleware, async (req, res) => {
    try {
        const { salePrice } = req.body;
        const buyerAddress = req.user.address;

        const lazyNFT = await LazyNFT.findById(req.params.id);

        if (!lazyNFT) {
            return res.status(404).json({
                success: false,
                error: 'Lazy NFT not found',
            });
        }

        if (lazyNFT.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `Lazy NFT is ${lazyNFT.status}, cannot be redeemed`,
            });
        }

        // Return redemption instructions
        res.json({
            success: true,
            message: 'Ready to redeem on blockchain',
            redemptionData: {
                lazyNFTId: lazyNFT._id,
                creator: lazyNFT.creator,
                ipfsURI: lazyNFT.ipfsURI,
                royaltyPercentage: lazyNFT.royaltyPercentage,
                signature: lazyNFT.signature,
                messageHash: lazyNFT.messageHash,
                nonce: lazyNFT.nonce,
                salePrice,
                buyer: buyerAddress,
            },
        });
    } catch (error) {
        console.error('Error redeeming lazy NFT:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/lazy-mint/:id/confirm-redemption
 * Confirm redemption after blockchain transaction
 * Called after NFT is actually minted on-chain
 */
router.post('/:id/confirm-redemption', authMiddleware, async (req, res) => {
    try {
        const { tokenId, transactionHash, salePrice } = req.body;
        const buyerAddress = req.user.address;

        const lazyNFT = await LazyNFT.findByIdAndUpdate(
            req.params.id,
            {
                status: 'redeemed',
                tokenId: tokenId.toString(),
                buyer: buyerAddress.toLowerCase(),
                transactionHash,
                salePrice,
                redeemedAt: new Date(),
            },
            { new: true }
        );

        if (!lazyNFT) {
            return res.status(404).json({
                success: false,
                error: 'Lazy NFT not found',
            });
        }

        res.json({
            success: true,
            message: 'Redemption confirmed',
            lazyNFT,
        });
    } catch (error) {
        console.error('Error confirming redemption:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/lazy-mint/stats/overview
 * Get lazy minting statistics
 */
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = await LazyNFT.getStats();

        res.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/lazy-mint/search
 * Search lazy mints
 */
router.post('/search', async (req, res) => {
    try {
        const { query, filters, page = 1, limit = 20 } = req.body;

        const skip = (page - 1) * limit;

        const searchQuery = { status: 'pending', ...filters };

        if (query) {
            searchQuery.$text = { $search: query };
        }

        const [results, total] = await Promise.all([
            LazyNFT.find(searchQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            LazyNFT.countDocuments(searchQuery),
        ]);

        res.json({
            success: true,
            data: results,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
        });
    } catch (error) {
        console.error('Error searching lazy NFTs:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
