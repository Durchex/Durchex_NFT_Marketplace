/**
 * recommendationService.js
 * ML-based recommendation engine using collaborative filtering
 */

const NFT = require('../models/NFT');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const redis = require('redis');

const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});

class RecommendationService {
    /**
     * Calculate user-user similarity using collaborative filtering
     * Cosine similarity between user preference vectors
     */
    static async calculateUserSimilarity(userId1, userId2) {
        try {
            // Get user activities
            const [activities1, activities2] = await Promise.all([
                UserActivity.find({ userId: userId1 }).select('nftId rating'),
                UserActivity.find({ userId: userId2 }).select('nftId rating'),
            ]);

            // Build rating vectors
            const nftIds1 = new Set(activities1.map((a) => a.nftId.toString()));
            const nftIds2 = new Set(activities2.map((a) => a.nftId.toString()));

            // Common NFTs
            const commonNFTs = [...nftIds1].filter((id) => nftIds2.has(id));
            if (commonNFTs.length === 0) return 0;

            // Calculate cosine similarity
            let dotProduct = 0;
            let magnitude1 = 0;
            let magnitude2 = 0;

            const ratingMap1 = new Map(
                activities1.map((a) => [a.nftId.toString(), a.rating])
            );
            const ratingMap2 = new Map(
                activities2.map((a) => [a.nftId.toString(), a.rating])
            );

            for (const nftId of commonNFTs) {
                const r1 = ratingMap1.get(nftId) || 0;
                const r2 = ratingMap2.get(nftId) || 0;
                dotProduct += r1 * r2;
                magnitude1 += r1 * r1;
                magnitude2 += r2 * r2;
            }

            magnitude1 = Math.sqrt(magnitude1);
            magnitude2 = Math.sqrt(magnitude2);

            if (magnitude1 === 0 || magnitude2 === 0) return 0;

            return dotProduct / (magnitude1 * magnitude2);
        } catch (err) {
            console.error('Error calculating user similarity:', err);
            return 0;
        }
    }

    /**
     * Calculate item-item similarity based on attributes
     */
    static calculateItemSimilarity(nft1, nft2) {
        let similarity = 0;

        // Rarity match
        if (nft1.rarity === nft2.rarity) similarity += 0.3;

        // Collection match
        if (nft1.collectionId.equals(nft2.collectionId)) similarity += 0.3;

        // Creator match
        if (nft1.creator.equals(nft2.creator)) similarity += 0.2;

        // Attribute overlap
        if (nft1.attributes && nft2.attributes) {
            const attr1 = new Set(nft1.attributes.map((a) => `${a.name}:${a.value}`));
            const attr2 = new Set(nft2.attributes.map((a) => `${a.name}:${a.value}`));

            const intersection = [...attr1].filter((a) => attr2.has(a)).length;
            const union = new Set([...attr1, ...attr2]).size;

            if (union > 0) {
                similarity += (intersection / union) * 0.2;
            }
        }

        return Math.min(similarity, 1);
    }

    /**
     * Get collaborative filtering recommendations
     */
    static async getCollaborativeRecommendations(userId, limit = 10) {
        try {
            const cacheKey = `collab_recs:${userId}`;

            // Check cache
            const cached = await client.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }

            // Get all users
            const allUsers = await User.find({ _id: { $ne: userId } }).select('_id');

            // Calculate similarities
            const similarities = await Promise.all(
                allUsers.map(async (user) => ({
                    userId: user._id,
                    similarity: await this.calculateUserSimilarity(userId, user._id),
                }))
            );

            // Sort by similarity and get top similar users
            const similarUsers = similarities
                .filter((s) => s.similarity > 0.1)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 5);

            if (similarUsers.length === 0) {
                return [];
            }

            // Get recommended NFTs from similar users
            const userIds = similarUsers.map((s) => s.userId);
            const recommendedNFTs = await UserActivity.find({
                userId: { $in: userIds },
                rating: { $gte: 4 }, // Only high-rated items
            })
                .populate('nftId')
                .limit(limit * 2);

            // Score recommendations by similarity
            const nftScores = new Map();
            for (const activity of recommendedNFTs) {
                const similarity = similarUsers.find(
                    (s) => s.userId.equals(activity.userId)
                )?.similarity || 0;

                const currentScore = nftScores.get(activity.nftId._id.toString()) || 0;
                nftScores.set(
                    activity.nftId._id.toString(),
                    currentScore + similarity * activity.rating
                );
            }

            // Convert to array and sort
            const recommendations = Array.from(nftScores.entries())
                .map(([nftId, score]) => ({ nftId, score }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            // Fetch full NFT data
            const nftIds = recommendations.map((r) => r.nftId);
            const nfts = await NFT.find({ _id: { $in: nftIds } })
                .populate('creator', 'username avatar')
                .populate('collectionId', 'name')
                .lean();

            // Cache for 6 hours
            await client.setex(cacheKey, 21600, JSON.stringify(nfts));

            return nfts;
        } catch (err) {
            console.error('Error getting collaborative recommendations:', err);
            return [];
        }
    }

    /**
     * Get content-based recommendations
     */
    static async getContentBasedRecommendations(userId, limit = 10) {
        try {
            // Get user's liked NFTs
            const userActivities = await UserActivity.find({
                userId,
                rating: { $gte: 4 },
            })
                .populate('nftId')
                .sort({ createdAt: -1 })
                .limit(5);

            if (userActivities.length === 0) {
                return [];
            }

            // Get all NFTs (not in user's library)
            const userLibraryNFTs = userActivities.map((a) => a.nftId._id);
            const allNFTs = await NFT.find({
                _id: { $nin: userLibraryNFTs },
                status: 'listed',
            })
                .populate('creator', 'username avatar')
                .populate('collectionId', 'name')
                .limit(limit * 3);

            // Calculate similarity scores
            const nftScores = allNFTs.map((nft) => {
                let totalSimilarity = 0;
                const likedNFTs = userActivities.map((a) => a.nftId);

                for (const likedNFT of likedNFTs) {
                    totalSimilarity += this.calculateItemSimilarity(nft, likedNFT);
                }

                return {
                    nft,
                    score: totalSimilarity / likedNFTs.length,
                };
            });

            // Sort and limit
            const recommendations = nftScores
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map((r) => r.nft);

            return recommendations;
        } catch (err) {
            console.error('Error getting content-based recommendations:', err);
            return [];
        }
    }

    /**
     * Get trending recommendations
     */
    static async getTrendingRecommendations(limit = 10, days = 7) {
        try {
            const cacheKey = `trending_recs:${days}`;

            // Check cache
            const cached = await client.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }

            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - days);

            // Get trending NFTs
            const trending = await NFT.find({
                status: 'listed',
                updatedAt: { $gte: daysAgo },
            })
                .sort({ views: -1, favorites: -1, offerCount: -1 })
                .populate('creator', 'username avatar')
                .populate('collectionId', 'name')
                .limit(limit)
                .lean();

            // Cache for 1 hour
            await client.setex(cacheKey, 3600, JSON.stringify(trending));

            return trending;
        } catch (err) {
            console.error('Error getting trending recommendations:', err);
            return [];
        }
    }

    /**
     * Get hybrid recommendations (combine multiple algorithms)
     */
    static async getHybridRecommendations(userId, limit = 12) {
        try {
            const cacheKey = `hybrid_recs:${userId}`;

            // Check cache
            const cached = await client.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }

            // Get recommendations from all algorithms
            const [collaborative, contentBased, trending] = await Promise.all([
                this.getCollaborativeRecommendations(userId, limit),
                this.getContentBasedRecommendations(userId, limit),
                this.getTrendingRecommendations(limit),
            ]);

            // Merge with weighted scoring
            const nftScores = new Map();

            // Collaborative (40% weight)
            for (let i = 0; i < collaborative.length; i++) {
                const id = collaborative[i]._id.toString();
                const score = (1 - i / collaborative.length) * 0.4;
                nftScores.set(id, (nftScores.get(id) || 0) + score);
            }

            // Content-based (40% weight)
            for (let i = 0; i < contentBased.length; i++) {
                const id = contentBased[i]._id.toString();
                const score = (1 - i / contentBased.length) * 0.4;
                nftScores.set(id, (nftScores.get(id) || 0) + score);
            }

            // Trending (20% weight)
            for (let i = 0; i < trending.length; i++) {
                const id = trending[i]._id.toString();
                const score = (1 - i / trending.length) * 0.2;
                nftScores.set(id, (nftScores.get(id) || 0) + score);
            }

            // Get top recommendations
            const allNFTs = new Map(
                [
                    ...collaborative,
                    ...contentBased,
                    ...trending,
                ].map((nft) => [nft._id.toString(), nft])
            );

            const recommendations = Array.from(nftScores.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([id]) => allNFTs.get(id))
                .filter((nft) => nft);

            // Cache for 6 hours
            await client.setex(cacheKey, 21600, JSON.stringify(recommendations));

            return recommendations;
        } catch (err) {
            console.error('Error getting hybrid recommendations:', err);
            return [];
        }
    }

    /**
     * Record user interaction for training
     */
    static async recordInteraction(userId, nftId, type, metadata = {}) {
        try {
            const rating =
                {
                    view: 1,
                    wishlist: 3,
                    bid: 4,
                    purchase: 5,
                    favorite: 4,
                }[type] || 1;

            await UserActivity.updateOne(
                { userId, nftId },
                {
                    $set: { rating, type, metadata, updatedAt: new Date() },
                    $inc: { count: 1 },
                },
                { upsert: true }
            );

            // Invalidate recommendation cache
            await client.del(`collab_recs:${userId}`);
            await client.del(`hybrid_recs:${userId}`);
        } catch (err) {
            console.error('Error recording interaction:', err);
        }
    }

    /**
     * Get personalized recommendations for feed
     */
    static async getFeedRecommendations(userId, limit = 20, offset = 0) {
        try {
            const recommendations = await this.getHybridRecommendations(
                userId,
                limit + offset
            );

            return recommendations.slice(offset, offset + limit);
        } catch (err) {
            console.error('Error getting feed recommendations:', err);
            return [];
        }
    }

    /**
     * Get "Users who liked X also liked" recommendations
     */
    static async getAssociatedRecommendations(nftId, limit = 10) {
        try {
            // Get users who liked this NFT
            const users = await UserActivity.find({
                nftId,
                rating: { $gte: 4 },
            }).select('userId');

            if (users.length === 0) {
                return [];
            }

            const userIds = users.map((u) => u.userId);

            // Get NFTs these users liked (excluding the current NFT)
            const associated = await UserActivity.find({
                userId: { $in: userIds },
                nftId: { $ne: nftId },
                rating: { $gte: 4 },
            })
                .populate('nftId')
                .sort({ createdAt: -1 });

            // Score by frequency
            const nftScores = new Map();
            for (const activity of associated) {
                const id = activity.nftId._id.toString();
                nftScores.set(id, (nftScores.get(id) || 0) + 1);
            }

            // Get top recommendations
            const recommendations = Array.from(nftScores.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([id]) =>
                    associated.find((a) => a.nftId._id.toString() === id)?.nftId
                )
                .filter((nft) => nft);

            return recommendations;
        } catch (err) {
            console.error('Error getting associated recommendations:', err);
            return [];
        }
    }
}

module.exports = RecommendationService;
