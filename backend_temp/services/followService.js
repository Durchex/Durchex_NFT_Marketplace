/**
 * Follow Service
 * Handles user follow relationships, follower lists, recommendations
 */

const User = require('../models/User');
const Follower = require('../models/Follower');
const redis = require('redis');
const redisClient = redis.createClient();

class FollowService {
    /**
     * Follow a user
     */
    async followUser(followerId, followeeId) {
        if (followerId === followeeId) {
            throw new Error('Cannot follow yourself');
        }

        // Check if already following
        const existing = await Follower.findOne({
            followerId,
            followeeId
        });

        if (existing) {
            throw new Error('Already following this user');
        }

        // Create follow relationship
        const follow = new Follower({
            followerId,
            followeeId,
            followedAt: new Date()
        });

        await follow.save();

        // Update user follower/following counts
        await User.updateOne({ _id: followerId }, { $inc: { followingCount: 1 } });
        await User.updateOne({ _id: followeeId }, { $inc: { followerCount: 1 } });

        // Clear cache
        await this._clearFollowCache(followerId, followeeId);

        return follow;
    }

    /**
     * Unfollow a user
     */
    async unfollowUser(followerId, followeeId) {
        const follow = await Follower.findOneAndDelete({
            followerId,
            followeeId
        });

        if (!follow) {
            throw new Error('Not following this user');
        }

        // Update user counts
        await User.updateOne({ _id: followerId }, { $inc: { followingCount: -1 } });
        await User.updateOne({ _id: followeeId }, { $inc: { followerCount: -1 } });

        // Clear cache
        await this._clearFollowCache(followerId, followeeId);

        return follow;
    }

    /**
     * Get followers of a user
     */
    async getFollowers(userId, options = {}) {
        const { limit = 20, skip = 0 } = options;

        // Try cache first
        const cacheKey = `followers:${userId}:${limit}:${skip}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const followers = await Follower.find({ followeeId: userId })
            .populate('followerId', 'username avatar isVerified followerCount')
            .sort({ followedAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        // Cache for 1 hour
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(followers));

        return followers;
    }

    /**
     * Get following list
     */
    async getFollowing(userId, options = {}) {
        const { limit = 20, skip = 0 } = options;

        // Try cache first
        const cacheKey = `following:${userId}:${limit}:${skip}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const following = await Follower.find({ followerId: userId })
            .populate('followeeId', 'username avatar isVerified followerCount')
            .sort({ followedAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        // Cache for 1 hour
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(following));

        return following;
    }

    /**
     * Check if following a user
     */
    async isFollowing(followerId, followeeId) {
        const follow = await Follower.findOne({
            followerId,
            followeeId
        });

        return !!follow;
    }

    /**
     * Get mutual followers
     */
    async getMutualFollowers(userId1, userId2) {
        // Get followers of user1
        const followers1 = await Follower.find({ followeeId: userId1 }).select('followerId');
        const followerIds1 = followers1.map(f => f.followerId.toString());

        // Get followers of user2
        const followers2 = await Follower.find({ followeeId: userId2 }).select('followerId');
        const followerIds2 = followers2.map(f => f.followerId.toString());

        // Find intersection
        const mutual = followerIds1.filter(id => followerIds2.includes(id));

        // Fetch user details
        const mutualUsers = await User.find({
            _id: { $in: mutual }
        }).select('username avatar isVerified followerCount').lean();

        return mutualUsers;
    }

    /**
     * Get suggested users to follow
     */
    async getSuggestedUsers(userId, limit = 10) {
        // Get users that followers of my followers follow
        const myFollowers = await Follower.find({ followeeId: userId }).select('followerId');
        const myFollowerIds = myFollowers.map(f => f.followerId);

        // Get who my followers are following (but I'm not)
        const suggestions = await Follower.find({
            followerId: { $in: myFollowerIds },
            followeeId: { $ne: userId }
        })
            .populate('followeeId', 'username avatar isVerified followerCount')
            .limit(limit)
            .lean();

        // Filter out duplicates and already following
        const myFollowing = await Follower.find({ followerId: userId }).select('followeeId');
        const myFollowingIds = myFollowing.map(f => f.followeeId.toString());

        const uniqueSuggestions = [];
        const seen = new Set();

        for (const suggestion of suggestions) {
            const followeeId = suggestion.followeeId._id.toString();
            if (!seen.has(followeeId) && !myFollowingIds.includes(followeeId)) {
                uniqueSuggestions.push(suggestion.followeeId);
                seen.add(followeeId);
            }
            if (uniqueSuggestions.length >= limit) break;
        }

        return uniqueSuggestions;
    }

    /**
     * Get follower count
     */
    async getFollowerCount(userId) {
        return await Follower.countDocuments({ followeeId: userId });
    }

    /**
     * Get following count
     */
    async getFollowingCount(userId) {
        return await Follower.countDocuments({ followerId: userId });
    }

    /**
     * Clear follow cache
     */
    async _clearFollowCache(followerId, followeeId) {
        // Clear all follow-related cache entries
        const keys = await redisClient.keys(`followers:${followeeId}:*`);
        const followingKeys = await redisClient.keys(`following:${followerId}:*`);
        
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        if (followingKeys.length > 0) {
            await redisClient.del(followingKeys);
        }
    }
}

module.exports = new FollowService();
