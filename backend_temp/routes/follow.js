/**
 * Follow Routes
 * REST API endpoints for follow relationships
 */

const express = require('express');
const router = express.Router();
const followService = require('../services/followService');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * POST /follow/:followeeId
 * Follow a user
 */
router.post('/:followeeId', authMiddleware, async (req, res) => {
    try {
        const { followeeId } = req.params;
        const followerId = req.user.id;

        if (!followeeId) {
            return res.status(400).json({ error: 'Followee ID required' });
        }

        if (followerId === followeeId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        const follow = await followService.followUser(followerId, followeeId);

        res.json({ message: 'Now following', follow });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ error: error.message || 'Failed to follow user' });
    }
});

/**
 * DELETE /follow/:followeeId
 * Unfollow a user
 */
router.delete('/:followeeId', authMiddleware, async (req, res) => {
    try {
        const { followeeId } = req.params;
        const followerId = req.user.id;

        if (!followeeId) {
            return res.status(400).json({ error: 'Followee ID required' });
        }

        const follow = await followService.unfollowUser(followerId, followeeId);

        res.json({ message: 'Unfollowed successfully', follow });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ error: error.message || 'Failed to unfollow user' });
    }
});

/**
 * GET /followers/:userId
 * Get followers of a user
 */
router.get('/followers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, skip = 0 } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const followers = await followService.getFollowers(userId, {
            limit: Math.min(parseInt(limit) || 20, 100),
            skip: parseInt(skip) || 0
        });

        const count = await followService.getFollowerCount(userId);

        res.json({
            followers,
            count,
            limit,
            skip
        });
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ error: 'Failed to fetch followers' });
    }
});

/**
 * GET /following/:userId
 * Get following list of a user
 */
router.get('/following/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, skip = 0 } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const following = await followService.getFollowing(userId, {
            limit: Math.min(parseInt(limit) || 20, 100),
            skip: parseInt(skip) || 0
        });

        const count = await followService.getFollowingCount(userId);

        res.json({
            following,
            count,
            limit,
            skip
        });
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ error: 'Failed to fetch following' });
    }
});

/**
 * GET /is-following/:userId/:targetId
 * Check if user is following another user
 */
router.get('/is-following/:userId/:targetId', async (req, res) => {
    try {
        const { userId, targetId } = req.params;

        if (!userId || !targetId) {
            return res.status(400).json({ error: 'User IDs required' });
        }

        const isFollowing = await followService.isFollowing(userId, targetId);

        res.json({ isFollowing });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ error: 'Failed to check follow status' });
    }
});

/**
 * GET /mutual/:userId1/:userId2
 * Get mutual followers between two users
 */
router.get('/mutual/:userId1/:userId2', async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;

        if (!userId1 || !userId2) {
            return res.status(400).json({ error: 'User IDs required' });
        }

        const mutual = await followService.getMutualFollowers(userId1, userId2);

        res.json({ mutual, count: mutual.length });
    } catch (error) {
        console.error('Error fetching mutual followers:', error);
        res.status(500).json({ error: 'Failed to fetch mutual followers' });
    }
});

/**
 * GET /suggestions
 * Get suggested users to follow (authenticated)
 */
router.get('/suggestions', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10 } = req.query;

        const suggestions = await followService.getSuggestedUsers(
            userId,
            Math.min(parseInt(limit) || 10, 50)
        );

        res.json(suggestions);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

/**
 * GET /stats/:userId
 * Get follow statistics for a user
 */
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const followerCount = await followService.getFollowerCount(userId);
        const followingCount = await followService.getFollowingCount(userId);

        res.json({
            followers: followerCount,
            following: followingCount,
            userId
        });
    } catch (error) {
        console.error('Error fetching follow stats:', error);
        res.status(500).json({ error: 'Failed to fetch follow statistics' });
    }
});

module.exports = router;
