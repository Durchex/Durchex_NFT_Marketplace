/**
 * wishlistService.js
 * Service for managing user wishlists and favorites
 */

const Wishlist = require('../models/Wishlist');
const NFT = require('../models/NFT');
const redis = require('redis');
const redisClient = redis.createClient();

class WishlistService {
    /**
     * Add NFT to user's wishlist
     */
    async addToWishlist(userId, nftId) {
        try {
            // Check if already in wishlist
            const existing = await Wishlist.findOne({ userId, nftId });
            if (existing) {
                return existing; // Already in wishlist
            }

            // Add to wishlist
            const wishlistItem = new Wishlist({
                userId,
                nftId,
                addedAt: new Date(),
            });

            await wishlistItem.save();

            // Invalidate cache
            await redisClient.del(`wishlist:${userId}`);
            await redisClient.del(`wishlist:count:${userId}`);

            return wishlistItem;
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            throw error;
        }
    }

    /**
     * Remove NFT from wishlist
     */
    async removeFromWishlist(userId, nftId) {
        try {
            const result = await Wishlist.deleteOne({ userId, nftId });

            // Invalidate cache
            await redisClient.del(`wishlist:${userId}`);
            await redisClient.del(`wishlist:count:${userId}`);

            return result.deletedCount > 0;
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            throw error;
        }
    }

    /**
     * Get user's wishlist with pagination
     */
    async getWishlist(userId, limit = 20, skip = 0, options = {}) {
        try {
            // Try cache first
            const cacheKey = `wishlist:${userId}:${skip}:${limit}`;
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }

            // Query wishlist
            const wishlist = await Wishlist.find({ userId })
                .populate('nftId', 'name imageUrl currentPrice owner collection')
                .sort({ addedAt: -1 })
                .limit(limit)
                .skip(skip);

            const total = await Wishlist.countDocuments({ userId });

            // Add price change info if requested
            let items = wishlist;
            if (options.includePriceChange) {
                items = await Promise.all(
                    wishlist.map(async (item) => {
                        const priceHistory = await this._getPriceHistory(item.nftId);
                        return {
                            ...item.toObject(),
                            priceChange: priceHistory,
                        };
                    })
                );
            }

            const result = {
                items,
                total,
                page: Math.ceil(skip / limit) + 1,
                pages: Math.ceil(total / limit),
            };

            // Cache for 1 hour
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));

            return result;
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            throw error;
        }
    }

    /**
     * Check if NFT is in wishlist
     */
    async isInWishlist(userId, nftId) {
        try {
            const item = await Wishlist.findOne({ userId, nftId });
            return !!item;
        } catch (error) {
            console.error('Error checking wishlist:', error);
            throw error;
        }
    }

    /**
     * Get wishlist count
     */
    async getWishlistCount(userId) {
        try {
            // Try cache first
            const cached = await redisClient.get(`wishlist:count:${userId}`);
            if (cached) {
                return parseInt(cached);
            }

            const count = await Wishlist.countDocuments({ userId });

            // Cache for 1 hour
            await redisClient.setEx(
                `wishlist:count:${userId}`,
                3600,
                count.toString()
            );

            return count;
        } catch (error) {
            console.error('Error getting wishlist count:', error);
            throw error;
        }
    }

    /**
     * Get NFTs in wishlist with price drops
     */
    async getWishlistWithPriceDrops(userId, dropPercentage = 5) {
        try {
            const wishlist = await Wishlist.find({ userId })
                .populate('nftId')
                .lean();

            const itemsWithDrops = [];

            for (const item of wishlist) {
                const priceHistory = await this._getPriceHistory(item.nftId._id);

                if (priceHistory.percentChange <= -dropPercentage) {
                    itemsWithDrops.push({
                        ...item,
                        nft: item.nftId,
                        priceChange: priceHistory,
                    });
                }
            }

            return itemsWithDrops.sort(
                (a, b) => a.priceChange.percentChange - b.priceChange.percentChange
            );
        } catch (error) {
            console.error('Error getting wishlist with price drops:', error);
            throw error;
        }
    }

    /**
     * Export wishlist as CSV
     */
    async exportWishlistCSV(userId) {
        try {
            const wishlist = await Wishlist.find({ userId })
                .populate('nftId', 'name creator currentPrice')
                .lean();

            let csv = 'NFT Name,Creator,Current Price,Added Date\n';

            for (const item of wishlist) {
                csv += `"${item.nftId.name}","${item.nftId.creator}",${item.nftId.currentPrice},"${item.addedAt.toLocaleDateString()}"\n`;
            }

            return csv;
        } catch (error) {
            console.error('Error exporting wishlist CSV:', error);
            throw error;
        }
    }

    /**
     * Clear entire wishlist
     */
    async clearWishlist(userId) {
        try {
            const result = await Wishlist.deleteMany({ userId });

            // Invalidate cache
            await redisClient.del(`wishlist:${userId}`);
            await redisClient.del(`wishlist:count:${userId}`);

            return result.deletedCount;
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            throw error;
        }
    }

    /**
     * Internal: Get price history for an NFT
     */
    async _getPriceHistory(nftId, days = 30) {
        try {
            const nft = await NFT.findById(nftId)
                .select('currentPrice priceHistory')
                .lean();

            if (!nft || !nft.priceHistory || nft.priceHistory.length === 0) {
                return {
                    currentPrice: nft?.currentPrice || 0,
                    previousPrice: nft?.currentPrice || 0,
                    change: 0,
                    percentChange: 0,
                };
            }

            // Get oldest price from history within time range
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const oldestPrice =
                nft.priceHistory.find((p) => p.date <= cutoffDate) ||
                nft.priceHistory[nft.priceHistory.length - 1];

            const previousPrice = oldestPrice?.price || nft.currentPrice;
            const change = nft.currentPrice - previousPrice;
            const percentChange = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

            return {
                currentPrice: nft.currentPrice,
                previousPrice,
                change,
                percentChange: parseFloat(percentChange.toFixed(2)),
            };
        } catch (error) {
            console.error('Error getting price history:', error);
            return { currentPrice: 0, previousPrice: 0, change: 0, percentChange: 0 };
        }
    }
}

module.exports = new WishlistService();
