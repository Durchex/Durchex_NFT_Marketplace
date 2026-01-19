/**
 * advancedFilterService.js
 * Advanced filtering and saved filters management
 */

const NFT = require('../models/NFT');
const User = require('../models/User');
const redis = require('redis');

const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});

class AdvancedFilterService {
    /**
     * Build advanced filter query
     */
    static async buildAdvancedQuery(filters) {
        const query = {};

        // Text search
        if (filters.search) {
            query.$text = { $search: filters.search };
        }

        // Price range
        if (filters.priceMin || filters.priceMax) {
            query.price = {};
            if (filters.priceMin) query.price.$gte = parseFloat(filters.priceMin);
            if (filters.priceMax) query.price.$lte = parseFloat(filters.priceMax);
        }

        // Rarity tier
        if (filters.rarity && filters.rarity.length > 0) {
            query.rarity = { $in: filters.rarity };
        }

        // Collection
        if (filters.collection && filters.collection.length > 0) {
            query.collectionId = { $in: filters.collection };
        }

        // Creator
        if (filters.creator && filters.creator.length > 0) {
            query.creator = { $in: filters.creator };
        }

        // Status
        if (filters.status && filters.status.length > 0) {
            query.status = { $in: filters.status }; // listed, unlisted, sold
        }

        // Attributes
        if (filters.attributes && Object.keys(filters.attributes).length > 0) {
            const attributeConditions = [];
            for (const [key, values] of Object.entries(filters.attributes)) {
                attributeConditions.push({
                    'attributes.name': key,
                    'attributes.value': { $in: Array.isArray(values) ? values : [values] },
                });
            }
            if (attributeConditions.length > 0) {
                query.$and = [{ attributes: { $elemMatch: { $or: attributeConditions } } }];
            }
        }

        // Date range
        if (filters.dateMin || filters.dateMax) {
            query.createdAt = {};
            if (filters.dateMin)
                query.createdAt.$gte = new Date(filters.dateMin);
            if (filters.dateMax)
                query.createdAt.$lte = new Date(filters.dateMax);
        }

        // Verified creators only
        if (filters.verifiedOnly) {
            query.creatorVerified = true;
        }

        // Has bids
        if (filters.hasBids) {
            query.bids = { $exists: true, $ne: [] };
        }

        // Recently listed
        if (filters.recentlyListed) {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - (filters.recentlyListedDays || 7));
            query.createdAt = { $gte: daysAgo };
        }

        return query;
    }

    /**
     * Apply sorting
     */
    static applySorting(sortBy = 'recent') {
        const sortMap = {
            recent: { createdAt: -1 },
            oldest: { createdAt: 1 },
            priceAsc: { price: 1 },
            priceDesc: { price: -1 },
            trending: { views: -1 },
            mostFavorited: { favorites: -1 },
            endingSoon: { auctionEnd: 1 },
            newestAuction: { auctionStart: -1 },
            mostOffers: { offerCount: -1 },
        };

        return sortMap[sortBy] || sortMap['recent'];
    }

    /**
     * Get filter options (for UI dropdowns)
     */
    static async getFilterOptions() {
        const cacheKey = 'filter_options';

        try {
            // Check cache
            const cached = await client.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }

            const [collections, rarities, statuses] = await Promise.all([
                NFT.distinct('collectionId'),
                NFT.distinct('rarity'),
                NFT.distinct('status'),
            ]);

            const options = {
                collections,
                rarities: rarities.filter((r) => r), // Remove null
                statuses,
                priceRange: {
                    min: await NFT.findOne({}, { price: 1 }).sort({ price: 1 }),
                    max: await NFT.findOne({}, { price: 1 }).sort({ price: -1 }),
                },
            };

            // Cache for 1 hour
            await client.setex(cacheKey, 3600, JSON.stringify(options));

            return options;
        } catch (err) {
            console.error('Error getting filter options:', err);
            throw err;
        }
    }

    /**
     * Save filter preset
     */
    static async saveFilter(userId, filterData) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const newFilter = {
                _id: new mongoose.Types.ObjectId(),
                name: filterData.name,
                description: filterData.description,
                filters: filterData.filters,
                color: filterData.color || '#667eea',
                isPublic: filterData.isPublic || false,
                createdAt: new Date(),
            };

            user.savedFilters = user.savedFilters || [];
            user.savedFilters.push(newFilter);
            await user.save();

            return newFilter;
        } catch (err) {
            console.error('Error saving filter:', err);
            throw err;
        }
    }

    /**
     * Get saved filters
     */
    static async getSavedFilters(userId) {
        try {
            const user = await User.findById(userId).select('savedFilters');
            return user?.savedFilters || [];
        } catch (err) {
            console.error('Error getting saved filters:', err);
            throw err;
        }
    }

    /**
     * Update saved filter
     */
    static async updateFilter(userId, filterId, updateData) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const filterIndex = user.savedFilters.findIndex(
                (f) => f._id.toString() === filterId
            );
            if (filterIndex === -1) throw new Error('Filter not found');

            // Update filter
            user.savedFilters[filterIndex] = {
                ...user.savedFilters[filterIndex],
                ...updateData,
                updatedAt: new Date(),
            };

            await user.save();
            return user.savedFilters[filterIndex];
        } catch (err) {
            console.error('Error updating filter:', err);
            throw err;
        }
    }

    /**
     * Delete saved filter
     */
    static async deleteFilter(userId, filterId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            user.savedFilters = user.savedFilters.filter(
                (f) => f._id.toString() !== filterId
            );

            await user.save();
            return { success: true };
        } catch (err) {
            console.error('Error deleting filter:', err);
            throw err;
        }
    }

    /**
     * Share filter
     */
    static async shareFilter(userId, filterId) {
        try {
            const shareCode = require('crypto')
                .randomBytes(6)
                .toString('hex');

            const user = await User.findById(userId);
            const filter = user.savedFilters.find(
                (f) => f._id.toString() === filterId
            );

            if (!filter) throw new Error('Filter not found');

            // Store share in Redis for 30 days
            await client.setex(
                `filter_share:${shareCode}`,
                2592000,
                JSON.stringify({
                    userId,
                    filterId,
                    filter,
                })
            );

            return shareCode;
        } catch (err) {
            console.error('Error sharing filter:', err);
            throw err;
        }
    }

    /**
     * Get shared filter
     */
    static async getSharedFilter(shareCode) {
        try {
            const shared = await client.get(`filter_share:${shareCode}`);
            if (!shared) throw new Error('Share code expired');

            return JSON.parse(shared);
        } catch (err) {
            console.error('Error getting shared filter:', err);
            throw err;
        }
    }

    /**
     * Import shared filter
     */
    static async importSharedFilter(userId, shareCode, customName) {
        try {
            const shared = await this.getSharedFilter(shareCode);

            const newFilter = {
                _id: new mongoose.Types.ObjectId(),
                name: customName || `${shared.filter.name} (imported)`,
                filters: shared.filter.filters,
                color: shared.filter.color,
                isPublic: false,
                createdAt: new Date(),
                importedFrom: shared.userId,
            };

            const user = await User.findById(userId);
            user.savedFilters = user.savedFilters || [];
            user.savedFilters.push(newFilter);
            await user.save();

            return newFilter;
        } catch (err) {
            console.error('Error importing filter:', err);
            throw err;
        }
    }
}

module.exports = AdvancedFilterService;
