/**
 * Offer Service
 * Business logic for P2P offer management
 */

const ethers = require('ethers');
const logger = require('../utils/logger');

class OfferService {
    constructor() {
        this.offerContractAddress = process.env.OFFER_CONTRACT_ADDRESS;
        this.offerContractABI = JSON.parse(process.env.OFFER_CONTRACT_ABI || '[]');
        this.provider = null;
        this.contract = null;
    }

    /**
     * Initialize offer service
     */
    async initialize(provider) {
        try {
            this.provider = provider;
            this.contract = new ethers.Contract(
                this.offerContractAddress,
                this.offerContractABI,
                provider
            );
            logger.info('OfferService initialized', { contract: this.offerContractAddress });
        } catch (error) {
            logger.error('Failed to initialize OfferService', { error: error.message });
            throw error;
        }
    }

    /**
     * Create offer on blockchain
     */
    async createOffer(offerData, signer) {
        try {
            const {
                nftContract,
                tokenId,
                seller,
                offerAmount,
                paymentToken,
                durationDays
            } = offerData;

            const contract = this.contract.connect(signer);
            const amountInWei = ethers.parseEther(offerAmount.toString());

            let tx;
            if (paymentToken === ethers.ZeroAddress || !paymentToken) {
                // ETH payment
                tx = await contract.createOffer(
                    nftContract,
                    tokenId,
                    seller,
                    amountInWei,
                    ethers.ZeroAddress,
                    durationDays,
                    { value: amountInWei }
                );
            } else {
                // ERC20 payment
                tx = await contract.createOffer(
                    nftContract,
                    tokenId,
                    seller,
                    amountInWei,
                    paymentToken,
                    durationDays
                );
            }

            const receipt = await tx.wait();

            logger.info('Offer created on blockchain', {
                nftContract,
                tokenId,
                offerAmount,
                txHash: receipt.hash
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to create offer', { error: error.message });
            throw error;
        }
    }

    /**
     * Accept offer
     */
    async acceptOffer(offerId, signer) {
        try {
            const contract = this.contract.connect(signer);
            const tx = await contract.acceptOffer(offerId);
            const receipt = await tx.wait();

            logger.info('Offer accepted', {
                offerId,
                txHash: receipt.hash
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to accept offer', { error: error.message });
            throw error;
        }
    }

    /**
     * Reject offer
     */
    async rejectOffer(offerId, signer) {
        try {
            const contract = this.contract.connect(signer);
            const tx = await contract.rejectOffer(offerId);
            const receipt = await tx.wait();

            logger.info('Offer rejected', {
                offerId,
                txHash: receipt.hash
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to reject offer', { error: error.message });
            throw error;
        }
    }

    /**
     * Cancel offer
     */
    async cancelOffer(offerId, signer) {
        try {
            const contract = this.contract.connect(signer);
            const tx = await contract.cancelOffer(offerId);
            const receipt = await tx.wait();

            logger.info('Offer cancelled', {
                offerId,
                txHash: receipt.hash
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to cancel offer', { error: error.message });
            throw error;
        }
    }

    /**
     * Make counter-offer
     */
    async makeCounterOffer(offerId, counterAmount, durationDays, signer, paymentToken = null) {
        try {
            const contract = this.contract.connect(signer);
            const amountInWei = ethers.parseEther(counterAmount.toString());

            let tx;
            if (!paymentToken || paymentToken === ethers.ZeroAddress) {
                tx = await contract.makeCounterOffer(
                    offerId,
                    amountInWei,
                    durationDays,
                    { value: amountInWei }
                );
            } else {
                tx = await contract.makeCounterOffer(
                    offerId,
                    amountInWei,
                    durationDays
                );
            }

            const receipt = await tx.wait();

            logger.info('Counter-offer created', {
                offerId,
                counterAmount,
                txHash: receipt.hash
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to make counter-offer', { error: error.message });
            throw error;
        }
    }

    /**
     * Accept counter-offer
     */
    async acceptCounterOffer(offerId, counterIndex, signer) {
        try {
            const contract = this.contract.connect(signer);
            const tx = await contract.acceptCounterOffer(offerId, counterIndex);
            const receipt = await tx.wait();

            logger.info('Counter-offer accepted', {
                offerId,
                counterIndex,
                txHash: receipt.hash
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to accept counter-offer', { error: error.message });
            throw error;
        }
    }

    /**
     * Increase offer amount
     */
    async increaseOfferAmount(offerId, additionalAmount, signer, paymentToken = null) {
        try {
            const contract = this.contract.connect(signer);
            const amountInWei = ethers.parseEther(additionalAmount.toString());

            let tx;
            if (!paymentToken || paymentToken === ethers.ZeroAddress) {
                tx = await contract.increaseOfferAmount(offerId, amountInWei, {
                    value: amountInWei
                });
            } else {
                tx = await contract.increaseOfferAmount(offerId, amountInWei);
            }

            const receipt = await tx.wait();

            logger.info('Offer amount increased', {
                offerId,
                additionalAmount,
                txHash: receipt.hash
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to increase offer amount', { error: error.message });
            throw error;
        }
    }

    /**
     * Get offer details
     */
    async getOfferDetails(offerId) {
        try {
            const offer = await this.contract.getOffer(offerId);

            return {
                offerId: offerId,
                nftContract: offer.nftContract,
                tokenId: offer.tokenId.toString(),
                buyer: offer.buyer,
                seller: offer.seller,
                offerAmount: ethers.formatEther(offer.offerAmount),
                paymentToken: offer.paymentToken,
                expiresAt: offer.expiresAt.toNumber(),
                status: offer.status,
                createdAt: offer.createdAt.toNumber(),
                respondedAt: offer.respondedAt.toNumber(),
                isCounterOffer: offer.isCounterOffer
            };
        } catch (error) {
            logger.error('Failed to get offer details', { error: error.message });
            throw error;
        }
    }

    /**
     * Get counter-offers
     */
    async getCounterOffers(offerId) {
        try {
            const counters = await this.contract.getCounterOffers(offerId);

            return counters.map(counter => ({
                counterId: counter.counterId.toString(),
                originalOfferId: counter.originalOfferId.toString(),
                counterFrom: counter.counterFrom,
                counterAmount: ethers.formatEther(counter.counterAmount),
                expiresAt: counter.expiresAt.toNumber(),
                status: counter.status,
                createdAt: counter.createdAt.toNumber()
            }));
        } catch (error) {
            logger.error('Failed to get counter-offers', { error: error.message });
            throw error;
        }
    }

    /**
     * Check if offer is active
     */
    async isOfferActive(offerId) {
        try {
            return await this.contract.isOfferActive(offerId);
        } catch (error) {
            logger.error('Failed to check if offer active', { error: error.message });
            throw error;
        }
    }

    /**
     * Get time until expiry
     */
    async getTimeUntilExpiry(offerId) {
        try {
            const time = await this.contract.getTimeUntilExpiry(offerId);
            return time.toNumber();
        } catch (error) {
            logger.error('Failed to get time until expiry', { error: error.message });
            throw error;
        }
    }

    /**
     * Expire old offer
     */
    async expireOffer(offerId, signer) {
        try {
            const contract = this.contract.connect(signer);
            const tx = await contract.expireOffer(offerId);
            const receipt = await tx.wait();

            logger.info('Offer expired', {
                offerId,
                txHash: receipt.hash
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to expire offer', { error: error.message });
            throw error;
        }
    }

    /**
     * Validate offer before creation
     */
    async validateOfferCreation(nftContract, tokenId, seller) {
        try {
            // Verify seller owns NFT
            const nftABI = ['function ownerOf(uint256) view returns (address)'];
            const nftContract_ = new ethers.Contract(nftContract, nftABI, this.provider);
            const owner = await nftContract_.ownerOf(tokenId);

            if (owner.toLowerCase() !== seller.toLowerCase()) {
                throw new Error('Seller does not own this NFT');
            }

            return { valid: true };
        } catch (error) {
            logger.error('Offer validation failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Validate offer for acceptance
     */
    async validateOfferForAcceptance(offerId) {
        try {
            const offer = await this.getOfferDetails(offerId);

            if (offer.status !== 0) { // 0 = PENDING
                throw new Error('Offer is not pending');
            }

            const now = Math.floor(Date.now() / 1000);
            if (now >= offer.expiresAt) {
                throw new Error('Offer has expired');
            }

            // Verify seller still owns NFT
            const nftABI = ['function ownerOf(uint256) view returns (address)'];
            const nftContract = new ethers.Contract(offer.nftContract, nftABI, this.provider);
            const owner = await nftContract.ownerOf(offer.tokenId);

            if (owner.toLowerCase() !== offer.seller.toLowerCase()) {
                throw new Error('Seller no longer owns this NFT');
            }

            return { valid: true, offer };
        } catch (error) {
            logger.error('Acceptance validation failed', { error: error.message });
            throw error;
        }
    }
}

module.exports = new OfferService();
