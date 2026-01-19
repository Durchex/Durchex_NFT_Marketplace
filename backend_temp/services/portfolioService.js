/**
 * Portfolio Service
 * Handles user portfolio data, owned NFTs, activity history, and statistics
 */

const { ethers } = require('ethers');
const logger = require('../utils/logger');

class PortfolioService {
    constructor(provider, nftContract) {
        this.provider = provider;
        this.nftContract = nftContract;
    }

    /**
     * Get user portfolio overview
     */
    async getUserPortfolio(userAddress) {
        try {
            if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
                throw new Error('Invalid wallet address');
            }

            logger.info('Fetching user portfolio', { userAddress });

            // Get NFTs owned by user
            const ownedNFTs = await this.getOwnedNFTs(userAddress);
            
            // Get portfolio stats
            const stats = await this.getPortfolioStats(userAddress);
            
            // Get activity history
            const activity = await this.getActivityHistory(userAddress);

            return {
                userAddress,
                nftCount: ownedNFTs.length,
                totalValue: stats.totalValue,
                floorValue: stats.floorValue,
                stats,
                ownedNFTs,
                recentActivity: activity.slice(0, 10)
            };
        } catch (error) {
            logger.error('Failed to get user portfolio', { error: error.message });
            throw error;
        }
    }

    /**
     * Get NFTs owned by user
     */
    async getOwnedNFTs(userAddress, offset = 0, limit = 20) {
        try {
            // Query blockchain for user's NFTs
            // This would typically be done via The Graph or similar indexing service
            // For now, we'll return a structure that would be populated from blockchain queries
            
            const nfts = await this.queryUserNFTBalances(userAddress, offset, limit);
            
            return nfts.map(nft => ({
                tokenId: nft.tokenId.toString(),
                contractAddress: nft.contractAddress,
                name: nft.name,
                description: nft.description,
                imageURI: nft.imageURI,
                attributes: nft.attributes || [],
                rarity: this.calculateRarity(nft),
                estimatedValue: this.estimateValue(nft),
                acquiredAt: nft.acquiredAt,
                chain: nft.chain || 'ethereum'
            }));
        } catch (error) {
            logger.error('Failed to get owned NFTs', { error: error.message });
            throw error;
        }
    }

    /**
     * Query user NFT balances from blockchain
     */
    async queryUserNFTBalances(userAddress, offset = 0, limit = 20) {
        try {
            // This would integrate with The Graph or similar indexing service
            // Placeholder implementation
            return [];
        } catch (error) {
            logger.error('Failed to query NFT balances', { error: error.message });
            throw error;
        }
    }

    /**
     * Get portfolio statistics
     */
    async getPortfolioStats(userAddress) {
        try {
            const nfts = await this.getOwnedNFTs(userAddress, 0, 1000);

            const totalValue = nfts.reduce((sum, nft) => sum + (nft.estimatedValue || 0), 0);
            const floorValue = nfts.length > 0 
                ? Math.min(...nfts.map(nft => nft.estimatedValue || 0))
                : 0;
            
            const ceilingValue = nfts.length > 0
                ? Math.max(...nfts.map(nft => nft.estimatedValue || 0))
                : 0;

            // Calculate average
            const avgValue = nfts.length > 0 ? totalValue / nfts.length : 0;

            // Get rarity distribution
            const rarityDistribution = this.getRarityDistribution(nfts);

            // Get collection distribution
            const collectionDistribution = this.getCollectionDistribution(nfts);

            return {
                totalNFTs: nfts.length,
                totalValue: parseFloat(totalValue.toFixed(2)),
                avgValue: parseFloat(avgValue.toFixed(2)),
                floorValue: parseFloat(floorValue.toFixed(2)),
                ceilingValue: parseFloat(ceilingValue.toFixed(2)),
                rarityDistribution,
                collectionDistribution,
                lastUpdated: new Date()
            };
        } catch (error) {
            logger.error('Failed to get portfolio stats', { error: error.message });
            throw error;
        }
    }

    /**
     * Calculate rarity score for NFT
     */
    calculateRarity(nft) {
        try {
            if (!nft.attributes || nft.attributes.length === 0) {
                return 0;
            }

            // Simple rarity calculation based on trait frequency
            let rarityScore = 0;
            nft.attributes.forEach(attr => {
                // Lower frequency traits = higher rarity
                if (attr.frequency) {
                    rarityScore += (1 / attr.frequency) * 100;
                }
            });

            return Math.round(rarityScore);
        } catch (error) {
            logger.error('Failed to calculate rarity', { error: error.message });
            return 0;
        }
    }

    /**
     * Estimate NFT value based on similar sales
     */
    estimateValue(nft) {
        try {
            // This would integrate with price APIs or similar sales data
            // For now, returning a placeholder
            return 0;
        } catch (error) {
            logger.error('Failed to estimate NFT value', { error: error.message });
            return 0;
        }
    }

    /**
     * Get rarity distribution
     */
    getRarityDistribution(nfts) {
        try {
            const distribution = {
                common: 0,
                uncommon: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            };

            nfts.forEach(nft => {
                const rarity = nft.rarity || 0;
                if (rarity < 50) distribution.common++;
                else if (rarity < 150) distribution.uncommon++;
                else if (rarity < 300) distribution.rare++;
                else if (rarity < 600) distribution.epic++;
                else distribution.legendary++;
            });

            return distribution;
        } catch (error) {
            logger.error('Failed to get rarity distribution', { error: error.message });
            return {};
        }
    }

    /**
     * Get collection distribution
     */
    getCollectionDistribution(nfts) {
        try {
            const distribution = {};

            nfts.forEach(nft => {
                const collection = nft.contractAddress || 'unknown';
                distribution[collection] = (distribution[collection] || 0) + 1;
            });

            return distribution;
        } catch (error) {
            logger.error('Failed to get collection distribution', { error: error.message });
            return {};
        }
    }

    /**
     * Get user activity history
     */
    async getActivityHistory(userAddress, offset = 0, limit = 50) {
        try {
            if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
                throw new Error('Invalid wallet address');
            }

            logger.info('Fetching activity history', { userAddress, offset, limit });

            // Query blockchain events for user activity
            // This would typically be done via The Graph
            const activities = await this.queryUserActivityEvents(userAddress, offset, limit);

            return activities.map(activity => ({
                id: activity.transactionHash,
                type: activity.type, // 'mint', 'transfer', 'sale', 'offer', 'bid', 'auction'
                nftName: activity.nftName,
                nftImage: activity.nftImage,
                fromAddress: activity.from,
                toAddress: activity.to,
                value: activity.value,
                currency: activity.currency || 'ETH',
                timestamp: new Date(activity.timestamp * 1000),
                transactionHash: activity.transactionHash,
                blockNumber: activity.blockNumber,
                status: activity.status || 'confirmed'
            }));
        } catch (error) {
            logger.error('Failed to get activity history', { error: error.message });
            throw error;
        }
    }

    /**
     * Query user activity events from blockchain
     */
    async queryUserActivityEvents(userAddress, offset = 0, limit = 50) {
        try {
            // This would integrate with The Graph or blockchain RPC
            // Placeholder implementation
            return [];
        } catch (error) {
            logger.error('Failed to query activity events', { error: error.message });
            throw error;
        }
    }

    /**
     * Get NFT acquisition value (purchase price)
     */
    async getNFTAcquisitionValue(contractAddress, tokenId) {
        try {
            // Query blockchain for original sale/mint event
            // Placeholder implementation
            return 0;
        } catch (error) {
            logger.error('Failed to get acquisition value', { error: error.message });
            throw error;
        }
    }

    /**
     * Calculate portfolio performance
     */
    async getPortfolioPerformance(userAddress, timeframe = '7d') {
        try {
            const currentPortfolio = await this.getPortfolioStats(userAddress);
            
            // Query historical portfolio value
            const historicalValue = await this.getHistoricalPortfolioValue(userAddress, timeframe);

            const changeAmount = currentPortfolio.totalValue - (historicalValue || 0);
            const changePercent = historicalValue > 0 
                ? ((changeAmount / historicalValue) * 100).toFixed(2)
                : 0;

            return {
                currentValue: currentPortfolio.totalValue,
                previousValue: historicalValue,
                changeAmount: parseFloat(changeAmount.toFixed(2)),
                changePercent: parseFloat(changePercent),
                timeframe
            };
        } catch (error) {
            logger.error('Failed to get portfolio performance', { error: error.message });
            throw error;
        }
    }

    /**
     * Get historical portfolio value
     */
    async getHistoricalPortfolioValue(userAddress, timeframe) {
        try {
            // Query database for historical snapshots
            // Placeholder implementation
            return null;
        } catch (error) {
            logger.error('Failed to get historical value', { error: error.message });
            throw error;
        }
    }

    /**
     * Get spending analysis
     */
    async getSpendingAnalysis(userAddress, timeframe = '30d') {
        try {
            const activities = await this.getActivityHistory(userAddress, 0, 500);

            const spendingData = {
                totalSpent: 0,
                totalEarned: 0,
                transactionCount: 0,
                avgTransactionValue: 0,
                transactions: []
            };

            const now = new Date();
            const timeframeMs = this.getTimeframeMs(timeframe);
            const cutoffDate = new Date(now.getTime() - timeframeMs);

            activities.forEach(activity => {
                if (activity.timestamp >= cutoffDate) {
                    if (activity.type === 'sale' && activity.fromAddress === userAddress) {
                        spendingData.totalSpent += activity.value;
                    } else if (activity.type === 'transfer' && activity.fromAddress === userAddress) {
                        spendingData.totalSpent += activity.value;
                    } else if (activity.type === 'sale' && activity.toAddress === userAddress) {
                        spendingData.totalEarned += activity.value;
                    }
                    spendingData.transactionCount++;
                    spendingData.transactions.push(activity);
                }
            });

            spendingData.avgTransactionValue = spendingData.transactionCount > 0
                ? ((spendingData.totalSpent + spendingData.totalEarned) / spendingData.transactionCount).toFixed(2)
                : 0;

            return spendingData;
        } catch (error) {
            logger.error('Failed to get spending analysis', { error: error.message });
            throw error;
        }
    }

    /**
     * Convert timeframe string to milliseconds
     */
    getTimeframeMs(timeframe) {
        const timeframes = {
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000,
            '1y': 365 * 24 * 60 * 60 * 1000
        };
        return timeframes[timeframe] || timeframes['30d'];
    }

    /**
     * Get portfolio composition
     */
    getPortfolioComposition(nfts) {
        try {
            const composition = {
                byType: {},
                byValue: {
                    '0-1ETH': 0,
                    '1-5ETH': 0,
                    '5-10ETH': 0,
                    '10ETH+': 0
                }
            };

            nfts.forEach(nft => {
                // By type
                const type = nft.type || 'other';
                composition.byType[type] = (composition.byType[type] || 0) + 1;

                // By value
                const value = nft.estimatedValue || 0;
                if (value < 1) composition.byValue['0-1ETH']++;
                else if (value < 5) composition.byValue['1-5ETH']++;
                else if (value < 10) composition.byValue['5-10ETH']++;
                else composition.byValue['10ETH+']++;
            });

            return composition;
        } catch (error) {
            logger.error('Failed to get portfolio composition', { error: error.message });
            return {};
        }
    }

    /**
     * Validate user address
     */
    validateAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
}

module.exports = PortfolioService;
