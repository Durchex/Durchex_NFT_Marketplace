/**
 * Discovery Service
 * Handles NFT filtering, search, and discovery queries
 */

const logger = require('../utils/logger');

class DiscoveryService {
    constructor(db) {
        this.db = db;
        this.nftsCollection = db.collection('nfts');
        this.auctionsCollection = db.collection('auctions');
    }

    /**
     * Search NFTs with advanced filtering
     */
    async searchNFTs(filters = {}, page = 1, limit = 20) {
        try {
            const {
                searchTerm,
                minPrice,
                maxPrice,
                creator,
                collection,
                category,
                rarity,
                sortBy = 'newest',
                status = 'all' // all, for_sale, auction, offer
            } = filters;

            const skip = (page - 1) * limit;
            const query = {};

            // Text search
            if (searchTerm) {
                query.$text = { $search: searchTerm };
            }

            // Price filtering
            if (minPrice !== undefined || maxPrice !== undefined) {
                query.floorPrice = {};
                if (minPrice !== undefined) query.floorPrice.$gte = parseFloat(minPrice);
                if (maxPrice !== undefined) query.floorPrice.$lte = parseFloat(maxPrice);
            }

            // Creator filtering
            if (creator) {
                query.creator = creator.toLowerCase();
            }

            // Collection filtering
            if (collection) {
                query.collection = collection.toLowerCase();
            }

            // Category filtering
            if (category) {
                query.category = category;
            }

            // Rarity filtering
            if (rarity) {
                if (rarity === 'common') query.rarityScore = { $lt: 25 };
                else if (rarity === 'uncommon') query.rarityScore = { $gte: 25, $lt: 50 };
                else if (rarity === 'rare') query.rarityScore = { $gte: 50, $lt: 75 };
                else if (rarity === 'epic') query.rarityScore = { $gte: 75, $lt: 95 };
                else if (rarity === 'legendary') query.rarityScore = { $gte: 95 };
            }

            // Status filtering
            if (status === 'for_sale') {
                query.listingStatus = 'active';
            } else if (status === 'auction') {
                query.hasActiveAuction = true;
            } else if (status === 'offer') {
                query.hasActiveOffers = true;
            }

            // Sorting
            let sort = {};
            switch (sortBy) {
                case 'newest':
                    sort = { createdAt: -1 };
                    break;
                case 'oldest':
                    sort = { createdAt: 1 };
                    break;
                case 'price_low':
                    sort = { floorPrice: 1 };
                    break;
                case 'price_high':
                    sort = { floorPrice: -1 };
                    break;
                case 'recently_listed':
                    sort = { listedAt: -1 };
                    break;
                case 'trending':
                    sort = { viewCount: -1 };
                    break;
                case 'rarity':
                    sort = { rarityScore: -1 };
                    break;
                default:
                    sort = { createdAt: -1 };
            }

            // Execute query with pagination
            const total = await this.nftsCollection.countDocuments(query);
            const nfts = await this.nftsCollection
                .find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .toArray();

            logger.info('NFT search executed', {
                filters,
                total,
                returned: nfts.length,
                page
            });

            return {
                data: nfts,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('NFT search failed', { error: error.message, filters });
            throw error;
        }
    }

    /**
     * Get NFTs by collection
     */
    async getNFTsByCollection(collection, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;

            const total = await this.nftsCollection.countDocuments({
                collection: collection.toLowerCase()
            });

            const nfts = await this.nftsCollection
                .find({ collection: collection.toLowerCase() })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            return {
                data: nfts,
                pagination: { total, page, limit, pages: Math.ceil(total / limit) }
            };
        } catch (error) {
            logger.error('Failed to get NFTs by collection', { error: error.message });
            throw error;
        }
    }

    /**
     * Get NFTs by creator
     */
    async getNFTsByCreator(creator, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;

            const total = await this.nftsCollection.countDocuments({
                creator: creator.toLowerCase()
            });

            const nfts = await this.nftsCollection
                .find({ creator: creator.toLowerCase() })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            return {
                data: nfts,
                pagination: { total, page, limit, pages: Math.ceil(total / limit) }
            };
        } catch (error) {
            logger.error('Failed to get NFTs by creator', { error: error.message });
            throw error;
        }
    }

    /**
     * Get trending NFTs
     */
    async getTrendingNFTs(limit = 20) {
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const nfts = await this.nftsCollection
                .find({ updatedAt: { $gte: sevenDaysAgo } })
                .sort({ viewCount: -1, floorPrice: 1 })
                .limit(limit)
                .toArray();

            return nfts;
        } catch (error) {
            logger.error('Failed to get trending NFTs', { error: error.message });
            throw error;
        }
    }

    /**
     * Get categories with counts
     */
    async getCategories() {
        try {
            const categories = await this.nftsCollection
                .aggregate([
                    {
                        $group: {
                            _id: '$category',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } }
                ])
                .toArray();

            return categories.map(cat => ({
                name: cat._id || 'uncategorized',
                count: cat.count
            }));
        } catch (error) {
            logger.error('Failed to get categories', { error: error.message });
            throw error;
        }
    }

    /**
     * Get rarity distribution
     */
    async getRarityDistribution() {
        try {
            const distribution = await this.nftsCollection
                .aggregate([
                    {
                        $bucket: {
                            groupBy: '$rarityScore',
                            boundaries: [0, 25, 50, 75, 95, 100],
                            default: 'other',
                            output: {
                                count: { $sum: 1 }
                            }
                        }
                    }
                ])
                .toArray();

            return {
                common: distribution[0]?.count || 0,
                uncommon: distribution[1]?.count || 0,
                rare: distribution[2]?.count || 0,
                epic: distribution[3]?.count || 0,
                legendary: distribution[4]?.count || 0
            };
        } catch (error) {
            logger.error('Failed to get rarity distribution', { error: error.message });
            throw error;
        }
    }

    /**
     * Get price statistics
     */
    async getPriceStats() {
        try {
            const stats = await this.nftsCollection
                .aggregate([
                    {
                        $group: {
                            _id: null,
                            min: { $min: '$floorPrice' },
                            max: { $max: '$floorPrice' },
                            avg: { $avg: '$floorPrice' },
                            median: { $median: { input: '$floorPrice', method: 'approximate' } }
                        }
                    }
                ])
                .toArray();

            return stats[0] || { min: 0, max: 0, avg: 0, median: 0 };
        } catch (error) {
            logger.error('Failed to get price stats', { error: error.message });
            throw error;
        }
    }

    /**
     * Get top creators
     */
    async getTopCreators(limit = 10) {
        try {
            const creators = await this.nftsCollection
                .aggregate([
                    {
                        $group: {
                            _id: '$creator',
                            count: { $sum: 1 },
                            totalVolume: { $sum: '$floorPrice' },
                            avgPrice: { $avg: '$floorPrice' }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: limit }
                ])
                .toArray();

            return creators.map(creator => ({
                address: creator._id,
                nftCount: creator.count,
                totalVolume: creator.totalVolume,
                avgPrice: creator.avgPrice
            }));
        } catch (error) {
            logger.error('Failed to get top creators', { error: error.message });
            throw error;
        }
    }

    /**
     * Get collections by volume
     */
    async getTopCollections(limit = 10) {
        try {
            const collections = await this.nftsCollection
                .aggregate([
                    {
                        $group: {
                            _id: '$collection',
                            count: { $sum: 1 },
                            totalVolume: { $sum: '$floorPrice' },
                            floorPrice: { $min: '$floorPrice' },
                            avgPrice: { $avg: '$floorPrice' }
                        }
                    },
                    { $sort: { totalVolume: -1 } },
                    { $limit: limit }
                ])
                .toArray();

            return collections.map(col => ({
                address: col._id,
                nftCount: col.count,
                totalVolume: col.totalVolume,
                floorPrice: col.floorPrice,
                avgPrice: col.avgPrice
            }));
        } catch (error) {
            logger.error('Failed to get top collections', { error: error.message });
            throw error;
        }
    }

    /**
     * Get NFTs on sale
     */
    async getNFTsOnSale(page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;

            const total = await this.nftsCollection.countDocuments({
                listingStatus: 'active'
            });

            const nfts = await this.nftsCollection
                .find({ listingStatus: 'active' })
                .sort({ listedAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            return {
                data: nfts,
                pagination: { total, page, limit, pages: Math.ceil(total / limit) }
            };
        } catch (error) {
            logger.error('Failed to get NFTs on sale', { error: error.message });
            throw error;
        }
    }

    /**
     * Record NFT view
     */
    async recordNFTView(nftId) {
        try {
            await this.nftsCollection.updateOne(
                { _id: nftId },
                {
                    $inc: { viewCount: 1 },
                    $set: { lastViewedAt: new Date() }
                }
            );

            logger.info('NFT view recorded', { nftId });
        } catch (error) {
            logger.error('Failed to record NFT view', { error: error.message });
        }
    }

    /**
     * Get similar NFTs
     */
    async getSimilarNFTs(nftId, limit = 6) {
        try {
            const nft = await this.nftsCollection.findOne({ _id: nftId });

            if (!nft) {
                return [];
            }

            const similar = await this.nftsCollection
                .find({
                    _id: { $ne: nftId },
                    collection: nft.collection,
                    category: nft.category
                })
                .sort({ rarityScore: -1 })
                .limit(limit)
                .toArray();

            return similar;
        } catch (error) {
            logger.error('Failed to get similar NFTs', { error: error.message });
            throw error;
        }
    }
}

module.exports = DiscoveryService;
