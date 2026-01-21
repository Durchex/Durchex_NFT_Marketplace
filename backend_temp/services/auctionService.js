/**
 * Auction Service
 * Business logic for managing NFT auctions
 */

import { ethers } from 'ethers';
import logger from '../utils/logger.js';

class AuctionService {
    constructor() {
        this.auctionContractAddress = process.env.AUCTION_CONTRACT_ADDRESS;
        this.auctionContractABI = JSON.parse(process.env.AUCTION_CONTRACT_ABI || '[]');
        this.provider = null;
        this.contract = null;
    }

    /**
     * Initialize auction service
     */
    async initialize(provider) {
        try {
            this.provider = provider;
            this.contract = new ethers.Contract(
                this.auctionContractAddress,
                this.auctionContractABI,
                provider
            );
            logger.info('AuctionService initialized', { contract: this.auctionContractAddress });
        } catch (error) {
            logger.error('Failed to initialize AuctionService', { error: error.message });
            throw error;
        }
    }

    /**
     * Create auction on blockchain
     * @param {Object} auctionData
     */
    async createAuction(auctionData, signer) {
        try {
            const {
                nftContract,
                tokenId,
                reservePrice,
                minBidIncrement,
                durationInSeconds,
                paymentToken
            } = auctionData;

            const contract = this.contract.connect(signer);
            
            const tx = await contract.createAuction(
                nftContract,
                tokenId,
                ethers.parseEther(reservePrice.toString()),
                minBidIncrement,
                durationInSeconds,
                paymentToken || ethers.ZeroAddress
            );

            const receipt = await tx.wait();
            
            logger.info('Auction created on blockchain', {
                txHash: receipt.hash,
                nftContract,
                tokenId,
                reservePrice
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to create auction', { error: error.message });
            throw error;
        }
    }

    /**
     * Place bid on auction
     */
    async placeBid(auctionId, bidAmount, signer, paymentToken = null) {
        try {
            const contract = this.contract.connect(signer);
            const bidInWei = ethers.parseEther(bidAmount.toString());

            let tx;
            if (paymentToken === ethers.ZeroAddress || !paymentToken) {
                // ETH payment
                tx = await contract.placeBid(auctionId, bidInWei, {
                    value: bidInWei
                });
            } else {
                // ERC20 payment
                tx = await contract.placeBid(auctionId, bidInWei);
            }

            const receipt = await tx.wait();

            logger.info('Bid placed on blockchain', {
                auctionId,
                bidAmount,
                bidder: await signer.getAddress(),
                txHash: receipt.hash
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to place bid', { error: error.message });
            throw error;
        }
    }

    /**
     * Settle auction
     */
    async settleAuction(auctionId, signer) {
        try {
            const contract = this.contract.connect(signer);
            const tx = await contract.settleAuction(auctionId);
            const receipt = await tx.wait();

            logger.info('Auction settled', {
                auctionId,
                txHash: receipt.hash
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to settle auction', { error: error.message });
            throw error;
        }
    }

    /**
     * Cancel auction
     */
    async cancelAuction(auctionId, signer) {
        try {
            const contract = this.contract.connect(signer);
            const tx = await contract.cancelAuction(auctionId);
            const receipt = await tx.wait();

            logger.info('Auction cancelled', {
                auctionId,
                txHash: receipt.hash
            });

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to cancel auction', { error: error.message });
            throw error;
        }
    }

    /**
     * Get auction details from contract
     */
    async getAuctionDetails(auctionId) {
        try {
            const auction = await this.contract.getAuction(auctionId);
            
            return {
                nftContract: auction.nftContract,
                tokenId: auction.tokenId.toString(),
                seller: auction.seller,
                currentBidder: auction.currentBidder,
                currentBid: ethers.formatEther(auction.currentBid),
                reservePrice: ethers.formatEther(auction.reservePrice),
                minBidIncrement: auction.minBidIncrement.toString(),
                startTime: auction.startTime.toNumber(),
                endTime: auction.endTime.toNumber(),
                paymentToken: auction.paymentToken,
                status: auction.status,
                settled: auction.settled
            };
        } catch (error) {
            logger.error('Failed to get auction details', { error: error.message });
            throw error;
        }
    }

    /**
     * Get minimum next bid
     */
    async getMinNextBid(auctionId) {
        try {
            const minBid = await this.contract.getMinNextBid(auctionId);
            return ethers.formatEther(minBid);
        } catch (error) {
            logger.error('Failed to get minimum next bid', { error: error.message });
            throw error;
        }
    }

    /**
     * Get time until auction ends
     */
    async getTimeUntilEnd(auctionId) {
        try {
            const time = await this.contract.getTimeUntilEnd(auctionId);
            return time.toNumber();
        } catch (error) {
            logger.error('Failed to get time until end', { error: error.message });
            throw error;
        }
    }

    /**
     * Get bid history
     */
    async getBidHistory(auctionId) {
        try {
            const bidCount = await this.contract.getBidCount(auctionId);
            const history = await this.contract.getBidHistory(auctionId);

            return history.map(bid => ({
                bidder: bid.bidder,
                amount: ethers.formatEther(bid.amount),
                timestamp: bid.timestamp.toNumber(),
                refunded: bid.refunded
            }));
        } catch (error) {
            logger.error('Failed to get bid history', { error: error.message });
            throw error;
        }
    }

    /**
     * Check if auction is active
     */
    async isAuctionActive(auctionId) {
        try {
            return await this.contract.isAuctionActive(auctionId);
        } catch (error) {
            logger.error('Failed to check auction active', { error: error.message });
            throw error;
        }
    }

    /**
     * Validate auction before bidding
     */
    async validateAuctionForBid(auctionId, bidAmount) {
        try {
            // Check if auction is active
            const isActive = await this.isAuctionActive(auctionId);
            if (!isActive) {
                throw new Error('Auction is not active');
            }

            // Get minimum next bid
            const minBid = await this.getMinNextBid(auctionId);
            if (parseFloat(bidAmount) < parseFloat(minBid)) {
                throw new Error(`Bid must be at least ${minBid}`);
            }

            // Get time until end
            const timeUntilEnd = await this.getTimeUntilEnd(auctionId);
            if (timeUntilEnd <= 0) {
                throw new Error('Auction has ended');
            }

            return {
                valid: true,
                minBid,
                timeUntilEnd
            };
        } catch (error) {
            logger.error('Auction validation failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Validate auction before settlement
     */
    async validateAuctionForSettlement(auctionId) {
        try {
            const details = await this.getAuctionDetails(auctionId);
            
            if (details.status !== 0) { // 0 = ACTIVE
                throw new Error('Auction is not active');
            }

            const timeUntilEnd = await this.getTimeUntilEnd(auctionId);
            if (timeUntilEnd > 0) {
                throw new Error(`Auction ends in ${timeUntilEnd} seconds`);
            }

            return {
                valid: true,
                reserveMet: parseFloat(details.currentBid) >= parseFloat(details.reservePrice),
                winner: details.currentBidder,
                winningBid: details.currentBid
            };
        } catch (error) {
            logger.error('Settlement validation failed', { error: error.message });
            throw error;
        }
    }
}

export default new AuctionService();
