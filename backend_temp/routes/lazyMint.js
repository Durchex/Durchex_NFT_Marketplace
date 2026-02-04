// backend_temp/routes/lazyMint.js
import express from 'express';
import { ethers } from 'ethers';
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
            // For legacy vouchers, nonce was required; for multi-piece listings we use listingId-based vouchers.
            nonce,
            pieces,
            price,
            floorPrice,
            category,
            collection,
            enableStraightBuy,
        } = req.body;
        const creatorAddress = req.user.address;

        // Read network explicitly from body (creation form dropdown) so it's always used
        const networkFromBody = req.body?.network ?? req.body?.Network;

        if (!signature || !ipfsURI || !messageHash) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: signature, ipfsURI, messageHash',
            });
        }

        // For new multi-piece lazy mint, we use listing-based vouchers:
        // messageHash = keccak256(abi.encodePacked(listingId)), where
        // listingId = keccak256(abi.encodePacked(creator, uri, royaltyBps, pricePerPieceWei, maxSupply)).
        // Full cryptographic verification is performed on-chain by MultiPieceLazyMintNFT.redeemListing.
        // We intentionally do not reject here; any invalid voucher will be rejected by the contract at redeem time.

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

        // Normalize network from form (dropdown selection) – must match what frontend sends
        const network = (networkFromBody != null && String(networkFromBody).trim() !== '')
            ? String(networkFromBody).toLowerCase().trim()
            : 'polygon';

        if (process.env.NODE_ENV !== 'production') {
            console.log('[lazy-mint/submit] network from body:', networkFromBody, '-> saved as:', network);
        }

        // Store in database (including selected network for marketplace display)
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
            floorPrice: floorPrice || null,
            category: category || '',
            collection: collection || null,
            network,
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
                network: lazyNFT.network || network,
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
 * Redeem lazy mint on blockchain (buyer calls this).
 * Accepts quantity (default 1). Total price = pricePerPiece * quantity.
 */
router.post('/:id/redeem', authMiddleware, async (req, res) => {
    try {
        const { salePrice, quantity: reqQuantity } = req.body;
        const buyerAddress = req.user.address;
        const quantity = Math.max(1, parseInt(reqQuantity, 10) || 1);

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

        const remaining = lazyNFT.remainingPieces ?? lazyNFT.pieces ?? 1;
        if (quantity > remaining) {
            return res.status(400).json({
                success: false,
                error: `Only ${remaining} piece(s) available. Requested ${quantity}.`,
            });
        }

        const pricePerPiece = parseFloat(lazyNFT.price) || parseFloat(salePrice) || 0;
        const totalPrice = pricePerPiece * quantity;
        const maxQuantity = lazyNFT.pieces ?? 1;

        res.json({
            success: true,
            message: 'Ready to redeem on blockchain',
            quantity,
            pricePerPiece,
            totalPrice,
            maxQuantity,
            redemptionData: {
                lazyNFTId: lazyNFT._id,
                creator: lazyNFT.creator,
                ipfsURI: lazyNFT.ipfsURI,
                royaltyPercentage: lazyNFT.royaltyPercentage,
                signature: lazyNFT.signature,
                messageHash: lazyNFT.messageHash,
                nonce: lazyNFT.nonce,
                salePrice: quantity === 1 ? String(totalPrice) : undefined,
                pricePerPiece: quantity > 1 ? String(pricePerPiece) : undefined,
                totalPrice: String(totalPrice),
                quantity,
                maxQuantity,
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
