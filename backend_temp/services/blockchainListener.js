/**
 * Blockchain Event Listener Service
 * Listens for LazyMintNFT contract events and updates database
 * Handles: NFT Redeemed, Transfer, Royalty Paid events
 */

const ethers = require('ethers');
const LazyNFTModel = require('../models/lazyNFTModel');
const logger = require('../utils/logger');

class BlockchainListener {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.listeners = {};
        this.eventQueue = [];
        this.processing = false;
        this.retryAttempts = {};
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds
    }

    /**
     * Initialize blockchain listener
     * @param {string} contractAddress - LazyMintNFT contract address
     * @param {string} contractABI - Contract ABI
     * @param {string} rpcUrl - Blockchain RPC URL
     */
    async initialize(contractAddress, contractABI, rpcUrl) {
        try {
            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            this.contract = new ethers.Contract(contractAddress, contractABI, this.provider);
            this.contractAddress = contractAddress;
            
            logger.info('BlockchainListener initialized', {
                contract: contractAddress,
                network: (await this.provider.getNetwork()).name
            });

            // Test connection
            const blockNumber = await this.provider.getBlockNumber();
            logger.info(`Connected to blockchain at block ${blockNumber}`);

            return true;
        } catch (error) {
            logger.error('Failed to initialize BlockchainListener', { error: error.message });
            throw error;
        }
    }

    /**
     * Start listening to contract events
     */
    async startListening() {
        if (!this.contract) {
            throw new Error('BlockchainListener not initialized');
        }

        try {
            // Listen for NFTRedeemed events
            this.listeners.redeemed = this.contract.on('NFTRedeemed', async (event) => {
                await this.handleNFTRedeemed(event);
            });

            // Listen for Transfer events
            this.listeners.transfer = this.contract.on('Transfer', async (event) => {
                await this.handleTransfer(event);
            });

            // Listen for RoyaltyPaid events
            this.listeners.royalty = this.contract.on('RoyaltyPaid', async (event) => {
                await this.handleRoyaltyPaid(event);
            });

            logger.info('BlockchainListener started - listening for events');

            // Start processing event queue
            this.startProcessingQueue();

            return true;
        } catch (error) {
            logger.error('Failed to start listening to events', { error: error.message });
            throw error;
        }
    }

    /**
     * Stop listening to contract events
     */
    async stopListening() {
        try {
            if (this.listeners.redeemed) {
                this.contract.off('NFTRedeemed', this.listeners.redeemed);
            }
            if (this.listeners.transfer) {
                this.contract.off('Transfer', this.listeners.transfer);
            }
            if (this.listeners.royalty) {
                this.contract.off('RoyaltyPaid', this.listeners.royalty);
            }

            this.listeners = {};
            logger.info('BlockchainListener stopped');
            return true;
        } catch (error) {
            logger.error('Failed to stop listening', { error: error.message });
            throw error;
        }
    }

    /**
     * Handle NFTRedeemed event
     * Updates lazy NFT record to "redeemed" status
     */
    async handleNFTRedeemed(event) {
        const eventId = `redeemed-${event.transactionHash}-${event.logIndex}`;
        
        this.eventQueue.push({
            id: eventId,
            type: 'NFTRedeemed',
            data: {
                buyer: event.args.buyer,
                tokenId: event.args.tokenId.toString(),
                messageHash: event.args.messageHash,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date()
            },
            retries: 0
        });

        logger.info('NFTRedeemed event queued', { eventId, buyer: event.args.buyer });
    }

    /**
     * Handle Transfer event
     * Tracks NFT ownership changes for analytics
     */
    async handleTransfer(event) {
        const eventId = `transfer-${event.transactionHash}-${event.logIndex}`;

        // Skip minting transfers (from zero address)
        if (event.args.from === '0x0000000000000000000000000000000000000000') {
            return;
        }

        this.eventQueue.push({
            id: eventId,
            type: 'Transfer',
            data: {
                from: event.args.from,
                to: event.args.to,
                tokenId: event.args.tokenId.toString(),
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date()
            },
            retries: 0
        });

        logger.info('Transfer event queued', { eventId, from: event.args.from, to: event.args.to });
    }

    /**
     * Handle RoyaltyPaid event
     * Tracks royalty payments for creator earnings
     */
    async handleRoyaltyPaid(event) {
        const eventId = `royalty-${event.transactionHash}-${event.logIndex}`;

        this.eventQueue.push({
            id: eventId,
            type: 'RoyaltyPaid',
            data: {
                creator: event.args.creator,
                amount: event.args.amount.toString(),
                tokenId: event.args.tokenId.toString(),
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: new Date()
            },
            retries: 0
        });

        logger.info('RoyaltyPaid event queued', { eventId, creator: event.args.creator });
    }

    /**
     * Process queued events
     * Handles database updates with retry logic
     */
    async startProcessingQueue() {
        if (this.processing) return;

        this.processing = true;

        setInterval(async () => {
            while (this.eventQueue.length > 0 && this.processing) {
                const event = this.eventQueue.shift();

                try {
                    await this.processEvent(event);
                    // Clear retry count on success
                    delete this.retryAttempts[event.id];
                } catch (error) {
                    logger.error(`Failed to process event ${event.id}`, { 
                        error: error.message,
                        retries: event.retries
                    });

                    // Retry with exponential backoff
                    if (event.retries < this.maxRetries) {
                        event.retries++;
                        setTimeout(() => {
                            this.eventQueue.push(event);
                        }, this.retryDelay * Math.pow(2, event.retries));
                    } else {
                        logger.error(`Event ${event.id} failed after ${this.maxRetries} retries`, {
                            event: event.type
                        });
                        
                        // Store failed event for manual review
                        await this.storeFailedEvent(event, error);
                    }
                }
            }
        }, 1000); // Check every 1 second
    }

    /**
     * Process individual event
     */
    async processEvent(event) {
        switch (event.type) {
            case 'NFTRedeemed':
                return await this.processNFTRedeemed(event);
            case 'Transfer':
                return await this.processTransfer(event);
            case 'RoyaltyPaid':
                return await this.processRoyaltyPaid(event);
            default:
                throw new Error(`Unknown event type: ${event.type}`);
        }
    }

    /**
     * Process NFTRedeemed event
     * Update lazy NFT to "redeemed" status
     */
    async processNFTRedeemed(event) {
        const { buyer, tokenId, messageHash, transactionHash, blockNumber } = event.data;

        // Find lazy NFT by message hash
        const lazyNFT = await LazyNFTModel.findOne({ messageHash });

        if (!lazyNFT) {
            logger.warn('Lazy NFT not found for message hash', { messageHash });
            return;
        }

        // Update to redeemed status
        lazyNFT.status = 'redeemed';
        lazyNFT.tokenId = tokenId;
        lazyNFT.buyer = buyer;
        lazyNFT.transactionHash = transactionHash;
        lazyNFT.blockNumber = blockNumber;
        lazyNFT.redeemedAt = new Date();
        lazyNFT.updatedAt = new Date();

        await lazyNFT.save();

        logger.info('Lazy NFT marked as redeemed', {
            lazyNFTId: lazyNFT._id,
            tokenId,
            buyer,
            transactionHash
        });

        // Emit event for other services (could use event emitter)
        this.emitRedemptionComplete({
            lazyNFTId: lazyNFT._id,
            creator: lazyNFT.creator,
            buyer,
            tokenId,
            transactionHash
        });
    }

    /**
     * Process Transfer event
     * Track ownership changes for analytics and portfolio tracking
     */
    async processTransfer(event) {
        const { from, to, tokenId, transactionHash, blockNumber } = event.data;

        try {
            // Find all lazy NFTs with this token ID
            const lazyNFTs = await LazyNFTModel.find({ tokenId });

            for (const lazyNFT of lazyNFTs) {
                // Add to ownership history
                if (!lazyNFT.ownershipHistory) {
                    lazyNFT.ownershipHistory = [];
                }

                lazyNFT.ownershipHistory.push({
                    owner: to,
                    acquiredAt: new Date(),
                    previousOwner: from,
                    transactionHash,
                    blockNumber
                });

                // Keep only last 10 transfers
                if (lazyNFT.ownershipHistory.length > 10) {
                    lazyNFT.ownershipHistory = lazyNFT.ownershipHistory.slice(-10);
                }

                lazyNFT.updatedAt = new Date();
                await lazyNFT.save();
            }

            logger.info('Transfer processed', {
                tokenId,
                from,
                to,
                transactionHash
            });
        } catch (error) {
            logger.error('Failed to process transfer', { error: error.message, tokenId });
            throw error;
        }
    }

    /**
     * Process RoyaltyPaid event
     * Track royalty payments to creator
     */
    async processRoyaltyPaid(event) {
        const { creator, amount, tokenId, transactionHash, blockNumber } = event.data;

        try {
            // Find lazy NFT
            const lazyNFT = await LazyNFTModel.findOne({ tokenId });

            if (!lazyNFT) {
                logger.warn('Lazy NFT not found for royalty payment', { tokenId });
                return;
            }

            // Add to royalty payments history
            if (!lazyNFT.royaltyPayments) {
                lazyNFT.royaltyPayments = [];
            }

            lazyNFT.royaltyPayments.push({
                amount,
                paidAt: new Date(),
                transactionHash,
                blockNumber
            });

            lazyNFT.totalRoyaltiesEarned = (lazyNFT.totalRoyaltiesEarned || 0) + BigInt(amount);
            lazyNFT.updatedAt = new Date();

            await lazyNFT.save();

            logger.info('Royalty payment processed', {
                lazyNFTId: lazyNFT._id,
                creator,
                amount,
                transactionHash
            });
        } catch (error) {
            logger.error('Failed to process royalty payment', { error: error.message, tokenId });
            throw error;
        }
    }

    /**
     * Store failed event for manual review
     */
    async storeFailedEvent(event, error) {
        try {
            // Could store in a FailedEvents collection
            logger.error('Storing failed event for review', {
                eventId: event.id,
                type: event.type,
                error: error.message,
                timestamp: new Date()
            });
            
            // TODO: Implement FailedEvent model to store for manual processing
        } catch (err) {
            logger.error('Failed to store failed event', { error: err.message });
        }
    }

    /**
     * Emit redemption complete event
     * Could be used by notification service, analytics, etc.
     */
    emitRedemptionComplete(data) {
        // TODO: Implement event emitter pattern
        // Could use EventEmitter or WebSocket to notify services
        logger.info('Redemption complete event emitted', data);
    }

    /**
     * Get event queue statistics
     */
    getQueueStats() {
        return {
            queueLength: this.eventQueue.length,
            processing: this.processing,
            listeners: Object.keys(this.listeners).length,
            timestamp: new Date()
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            if (!this.provider) {
                return { status: 'disconnected' };
            }

            const blockNumber = await this.provider.getBlockNumber();
            const gasPrice = await this.provider.getFeeData();

            return {
                status: 'healthy',
                blockNumber,
                gasPrice: gasPrice.gasPrice.toString(),
                queueStats: this.getQueueStats(),
                timestamp: new Date()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date()
            };
        }
    }
}

// Export singleton instance
module.exports = new BlockchainListener();
