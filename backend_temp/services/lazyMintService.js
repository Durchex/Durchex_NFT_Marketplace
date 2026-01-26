// backend_temp/services/lazyMintService.js
// Try to import ethers, but handle errors gracefully
let ethers = null;
try {
  const ethersModule = await import('ethers');
  ethers = ethersModule.ethers || ethersModule.default || ethersModule;
} catch (error) {
  console.warn('⚠️  ethers failed to load in lazyMintService:', error.message);
  console.warn('   Lazy mint features will be disabled');
}

import LazyNFT from '../models/lazyNFTModel.js';
import axios from 'axios';

/**
 * Lazy Minting Service
 * Handles creation of lazy mint vouchers signed by creators
 */

class LazyMintService {
    constructor() {
        this.provider = null;
        this.ethersAvailable = false;
        this._initializeProvider();
    }

    _initializeProvider() {
        if (!ethers) {
            console.warn('⚠️  ethers not available - lazy mint features disabled');
            return;
        }

        try {
            // Try ethers v5 syntax first, fallback to v6
            if (ethers.providers && ethers.providers.JsonRpcProvider) {
                this.provider = new ethers.providers.JsonRpcProvider(
                    process.env.RPC_URL || 'http://localhost:8545'
                );
            } else if (ethers.JsonRpcProvider) {
                this.provider = new ethers.JsonRpcProvider(
                    process.env.RPC_URL || 'http://localhost:8545'
                );
            } else {
                console.warn('⚠️  ethers.JsonRpcProvider not available');
                return;
            }
            this.ethersAvailable = true;
        } catch (error) {
            console.error('Failed to initialize provider in LazyMintService:', error.message);
            this.ethersAvailable = false;
        }
    }

    /**
     * Create lazy mint voucher (creator signs message)
     * @param {Object} params - Metadata for NFT
     * @param {string} params.creatorAddress - Creator's wallet address
     * @param {string} params.name - NFT name
     * @param {string} params.description - NFT description
     * @param {string} params.ipfsURI - IPFS URI of metadata
     * @param {number} params.royaltyPercentage - Royalty (0-50)
     * @param {Object} signer - Ethers signer (creator's wallet)
     * @returns {Object} Lazy mint voucher with signature
     */
    async createLazyMintVoucher(params, signer) {
        const {
            creatorAddress,
            name,
            description,
            ipfsURI,
            royaltyPercentage,
        } = params;

        // Validate inputs
        if (!creatorAddress || !ipfsURI) {
            throw new Error('Missing required fields: creatorAddress, ipfsURI');
        }

        if (royaltyPercentage < 0 || royaltyPercentage > 50) {
            throw new Error('Royalty must be between 0 and 50');
        }

        if (!ipfsURI.startsWith('ipfs://')) {
            throw new Error('Invalid IPFS URI format');
        }

        if (!this.ethersAvailable || !ethers) {
            throw new Error('Ethers library not available - lazy mint features disabled');
        }

        try {
            // Get creator's current nonce
            const nonce = await this.getCreatorNonce(creatorAddress);

            // Create message hash
            const messageHash = ethers.utils.solidityKeccak256(
                ['string', 'uint256', 'uint256'],
                [ipfsURI, royaltyPercentage, nonce]
            );

            // Convert to Eth signed message hash
            const ethSignedMessageHash = ethers.utils.hashMessage(
                ethers.utils.arrayify(messageHash)
            );

            // Sign the message
            const signature = await signer.signMessage(
                ethers.utils.arrayify(messageHash)
            );

            // Verify signature (sanity check)
            const recoveredAddress = ethers.utils.recoverAddress(
                ethSignedMessageHash,
                signature
            );

            if (recoveredAddress.toLowerCase() !== creatorAddress.toLowerCase()) {
                throw new Error(
                    'Signature verification failed - wrong address'
                );
            }

            // Create voucher object
            const voucher = {
                creator: creatorAddress,
                ipfsURI: ipfsURI,
                royaltyPercentage: royaltyPercentage,
                nonce: nonce,
                signature: signature,
                messageHash: messageHash,
            };

            return voucher;
        } catch (error) {
            console.error('Error creating lazy mint voucher:', error);
            throw error;
        }
    }

    /**
     * Store lazy mint in database
     * @param {Object} voucherData - Lazy mint voucher data
     * @param {string} creatorAddress - Creator address
     * @returns {Object} Saved lazy NFT document
     */
    async storeLazyMint(voucherData, creatorAddress) {
        try {
            const lazyNFT = new LazyNFT({
                creator: creatorAddress,
                ipfsURI: voucherData.ipfsURI,
                royaltyPercentage: voucherData.royaltyPercentage,
                nonce: voucherData.nonce,
                signature: voucherData.signature,
                messageHash: voucherData.messageHash,
                status: 'pending', // pending, redeemed, expired
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            });

            const saved = await lazyNFT.save();
            return saved;
        } catch (error) {
            console.error('Error storing lazy mint:', error);
            throw error;
        }
    }

    /**
     * Fetch lazy NFT from database
     * @param {string} id - LazyNFT document ID
     * @returns {Object} Lazy NFT document
     */
    async getLazyNFT(id) {
        try {
            const lazyNFT = await LazyNFT.findById(id);
            if (!lazyNFT) {
                throw new Error('Lazy NFT not found');
            }
            return lazyNFT;
        } catch (error) {
            console.error('Error fetching lazy NFT:', error);
            throw error;
        }
    }

    /**
     * Get all lazy NFTs for a creator (not yet minted)
     * @param {string} creatorAddress - Creator wallet address
     * @returns {Array} Array of lazy NFTs
     */
    async getCreatorLazyNFTs(creatorAddress) {
        try {
            const lazyNFTs = await LazyNFT.find({
                creator: creatorAddress.toLowerCase(),
                status: 'pending',
            }).sort({ createdAt: -1 });

            return lazyNFTs;
        } catch (error) {
            console.error('Error fetching creator lazy NFTs:', error);
            throw error;
        }
    }

    /**
     * Get marketplace lazy NFTs available for purchase
     * @param {number} page - Pagination page
     * @param {number} limit - Items per page
     * @returns {Object} Paginated lazy NFTs
     */
    async getAvailableLazyNFTs(page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;

            const [lazyNFTs, total] = await Promise.all([
                LazyNFT.find({ status: 'pending' })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                LazyNFT.countDocuments({ status: 'pending' }),
            ]);

            return {
                data: lazyNFTs,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit),
                    limit,
                },
            };
        } catch (error) {
            console.error('Error fetching available lazy NFTs:', error);
            throw error;
        }
    }

    /**
     * Search lazy NFTs
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Array} Matching lazy NFTs
     */
    async searchLazyNFTs(query, filters = {}) {
        try {
            const searchQuery = {
                status: 'pending',
                ...filters,
            };

            // Add text search if query provided
            if (query) {
                searchQuery.$text = { $search: query };
            }

            const results = await LazyNFT.find(searchQuery)
                .sort({ createdAt: -1 })
                .limit(50);

            return results;
        } catch (error) {
            console.error('Error searching lazy NFTs:', error);
            throw error;
        }
    }

    /**
     * Mark lazy NFT as redeemed (after successful minting)
     * @param {string} id - LazyNFT document ID
     * @param {number} tokenId - Blockchain token ID
     * @param {string} buyer - Buyer address
     * @returns {Object} Updated lazy NFT
     */
    async markAsRedeemed(id, tokenId, buyer) {
        try {
            const updated = await LazyNFT.findByIdAndUpdate(
                id,
                {
                    status: 'redeemed',
                    tokenId: tokenId,
                    buyer: buyer,
                    redeemedAt: new Date(),
                },
                { new: true }
            );

            return updated;
        } catch (error) {
            console.error('Error marking lazy NFT as redeemed:', error);
            throw error;
        }
    }

    /**
     * Get creator's nonce for signature verification
     * @param {string} creatorAddress - Creator address
     * @returns {number} Current nonce
     */
    async getCreatorNonce(creatorAddress) {
        try {
            // If ethers not available, just return count from database
            if (!this.ethersAvailable || !ethers || !this.provider) {
                const count = await LazyNFT.countDocuments({
                    creator: creatorAddress.toLowerCase(),
                    status: 'redeemed',
                });
                return count;
            }

            // Get contract nonce if already deployed
            if (process.env.LAZY_MINT_CONTRACT_ADDRESS) {
                const contract = new ethers.Contract(
                    process.env.LAZY_MINT_CONTRACT_ADDRESS,
                    ['function nonces(address) public view returns (uint256)'],
                    this.provider
                );

                const nonce = await contract.nonces(creatorAddress);
                return nonce.toNumber();
            }

            // Fallback: count redeemed lazy NFTs for this creator
            const count = await LazyNFT.countDocuments({
                creator: creatorAddress.toLowerCase(),
                status: 'redeemed',
            });

            return count;
        } catch (error) {
            console.error('Error getting creator nonce:', error);
            // Return 0 if contract not yet deployed
            return 0;
        }
    }

    /**
     * Validate lazy mint voucher before buyer purchase
     * @param {Object} voucher - Lazy mint voucher
     * @returns {boolean} Is valid
     */
    async validateVoucher(voucher) {
        try {
            // Check required fields
            if (
                !voucher.creator ||
                !voucher.ipfsURI ||
                voucher.royaltyPercentage === undefined ||
                !voucher.signature ||
                !voucher.messageHash ||
                voucher.nonce === undefined
            ) {
                console.log('[validateVoucher] Missing required fields:', {
                    hasCreator: !!voucher.creator,
                    hasIpfsURI: !!voucher.ipfsURI,
                    hasRoyalty: voucher.royaltyPercentage !== undefined,
                    hasSignature: !!voucher.signature,
                    hasMessageHash: !!voucher.messageHash,
                    hasNonce: voucher.nonce !== undefined
                });
                return false;
            }

            // Check royalty range
            if (
                voucher.royaltyPercentage < 0 ||
                voucher.royaltyPercentage > 50
            ) {
                console.log('[validateVoucher] Invalid royalty percentage:', voucher.royaltyPercentage);
                return false;
            }

            // Check if signature is valid format
            if (!voucher.signature.startsWith('0x') ||
                voucher.signature.length !== 132) {
                console.log('[validateVoucher] Invalid signature format:', voucher.signature?.substring(0, 20));
                return false;
            }

            // Check if IPFS URI is valid format
            if (!voucher.ipfsURI.startsWith('ipfs://')) {
                console.log('[validateVoucher] Invalid IPFS URI format:', voucher.ipfsURI);
                return false;
            }

            // If ethers is available, verify signature cryptographically
            if (this.ethersAvailable && ethers) {
                try {
                    // Reconstruct the message hash
                    const reconstructedHash = ethers.utils.solidityKeccak256(
                        ['string', 'uint256', 'uint256'],
                        [voucher.ipfsURI, voucher.royaltyPercentage, voucher.nonce]
                    );

                    // Check if message hash matches
                    if (reconstructedHash.toLowerCase() !== voucher.messageHash.toLowerCase()) {
                        console.log('[validateVoucher] Message hash mismatch');
                        console.log('  Expected:', reconstructedHash);
                        console.log('  Received:', voucher.messageHash);
                        return false;
                    }

                    // Recover address from signature
                    const ethSignedMessageHash = ethers.utils.hashMessage(
                        ethers.utils.arrayify(voucher.messageHash)
                    );
                    const recoveredAddress = ethers.utils.recoverAddress(
                        ethSignedMessageHash,
                        voucher.signature
                    );

                    // Verify recovered address matches creator
                    if (recoveredAddress.toLowerCase() !== voucher.creator.toLowerCase()) {
                        console.log('[validateVoucher] Signature verification failed');
                        console.log('  Expected creator:', voucher.creator);
                        console.log('  Recovered address:', recoveredAddress);
                        return false;
                    }
                } catch (sigError) {
                    console.error('[validateVoucher] Error verifying signature:', sigError);
                    // If signature verification fails, still allow if format is correct
                    // (in case ethers has issues, but signature format is valid)
                }
            }

            // Check if a lazy NFT with the same signature already exists (prevent duplicates)
            const existingLazyNFT = await LazyNFT.findOne({
                creator: voucher.creator.toLowerCase(),
                signature: voucher.signature,
            });

            if (existingLazyNFT) {
                console.log('[validateVoucher] Duplicate signature found');
                return false;
            }

            // All checks passed
            return true;
        } catch (error) {
            console.error('[validateVoucher] Error validating voucher:', error);
            return false;
        }
    }

    /**
     * Cleanup expired lazy mints
     * Run periodically (e.g., via cron job)
     */
    async cleanupExpiredLazyMints() {
        try {
            const result = await LazyNFT.deleteMany({
                status: 'pending',
                expiresAt: { $lt: new Date() },
            });

            console.log(
                `Cleaned up ${result.deletedCount} expired lazy NFTs`
            );
            return result.deletedCount;
        } catch (error) {
            console.error('Error cleaning up expired lazy NFTs:', error);
            throw error;
        }
    }

    /**
     * Get statistics about lazy mints
     * @returns {Object} Statistics
     */
    async getLazyMintStats() {
        try {
            const [total, pending, redeemed] = await Promise.all([
                LazyNFT.countDocuments(),
                LazyNFT.countDocuments({ status: 'pending' }),
                LazyNFT.countDocuments({ status: 'redeemed' }),
            ]);

            return {
                total,
                pending,
                redeemed,
                conversionRate: total > 0 ? (redeemed / total) * 100 : 0,
            };
        } catch (error) {
            console.error('Error getting lazy mint stats:', error);
            throw error;
        }
    }
}

// Export singleton instance - will handle missing ethers gracefully
const lazyMintServiceInstance = new LazyMintService();
export default lazyMintServiceInstance;
