/**
 * User Profile Routes
 * REST API endpoints for user profile management
 */

const express = require('express');
const router = express.Router();
const userProfileService = require('../services/userProfileService');
const authMiddleware = require('../middleware/authMiddleware');
const { validateInput } = require('../utils/validation');

/**
 * GET /profile/:userIdOrAddress
 * Get user profile by ID or wallet address
 */
router.get('/:userIdOrAddress', async (req, res) => {
    try {
        const { userIdOrAddress } = req.params;

        if (!userIdOrAddress) {
            return res.status(400).json({ error: 'User ID or address required' });
        }

        const profile = await userProfileService.getUserProfile(userIdOrAddress);

        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * PUT /profile/:userId
 * Update user profile (authenticated)
 */
router.put('/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, bio, avatar, bannerImage, website, twitter, discord, instagram, telegram } = req.body;

        // Ensure user can only update their own profile
        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Validate input
        if (username && username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (bio && bio.length > 500) {
            return res.status(400).json({ error: 'Bio must be 500 characters or less' });
        }

        const updatedProfile = await userProfileService.updateUserProfile(userId, {
            username,
            bio,
            avatar,
            bannerImage,
            website,
            twitter,
            discord,
            instagram,
            telegram
        });

        res.json(updatedProfile);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
});

/**
 * GET /profile/:userId/stats
 * Get user statistics
 */
router.get('/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await userProfileService.getUserStats(userId);

        if (!stats) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(stats);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
});

/**
 * POST /profile/:userId/verify
 * Verify user with badge (admin only)
 */
router.post('/:userId/verify', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { documentType, documentHash, verificationLevel } = req.body;

        // Check admin permissions
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        if (!documentHash || !verificationLevel) {
            return res.status(400).json({ error: 'Missing verification data' });
        }

        const verified = await userProfileService.verifyUser(userId, {
            documentType,
            documentHash,
            verificationLevel
        });

        res.json({ message: 'User verified', user: verified });
    } catch (error) {
        console.error('Error verifying user:', error);
        res.status(500).json({ error: error.message || 'Verification failed' });
    }
});

/**
 * POST /profile/:userId/social-proof
 * Add verified social proof
 */
router.post('/:userId/social-proof', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { platform, username, verificationToken } = req.body;

        // User can only add social proof to their own account
        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (!platform || !username) {
            return res.status(400).json({ error: 'Platform and username required' });
        }

        const user = await userProfileService.addSocialProof(userId, platform, username, verificationToken);

        res.json({ message: 'Social proof added', user });
    } catch (error) {
        console.error('Error adding social proof:', error);
        res.status(500).json({ error: error.message || 'Failed to add social proof' });
    }
});

/**
 * PUT /profile/:userId/settings
 * Update profile settings
 */
router.put('/:userId/settings', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const settings = req.body;

        // User can only update their own settings
        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updated = await userProfileService.updateProfileSettings(userId, settings);

        res.json({ message: 'Settings updated', user: updated });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

/**
 * GET /profile/:userId/activity
 * Get user activity feed
 */
router.get('/:userId/activity', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, skip = 0, timeframe = '30d' } = req.query;

        const activity = await userProfileService.getUserActivityFeed(userId, {
            limit: Math.min(parseInt(limit) || 20, 100),
            skip: parseInt(skip) || 0,
            timeframe
        });

        res.json(activity);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

/**
 * GET /search
 * Search users
 */
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 10, skip = 0 } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const results = await userProfileService.searchUsers(q, {
            limit: Math.min(parseInt(limit) || 10, 50),
            skip: parseInt(skip) || 0
        });

        res.json(results);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

/**
 * GET /trending-creators
 * Get trending creators
 */
router.get('/trending-creators', async (req, res) => {
    try {
        const { limit = 20, timeframe = '7d' } = req.query;

        const creators = await userProfileService.getTrendingCreators({
            limit: Math.min(parseInt(limit) || 20, 100),
            timeframe
        });

        res.json(creators);
    } catch (error) {
        console.error('Error fetching trending creators:', error);
        res.status(500).json({ error: 'Failed to fetch trending creators' });
    }
});

/**
 * POST /profile/:userId/verify-email
 * Verify email address
 */
router.post('/:userId/verify-email', async (req, res) => {
    try {
        const { userId } = req.params;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Verification token required' });
        }

        const verified = await userProfileService.validateEmail(userId, token);

        if (!verified) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ error: 'Email verification failed' });
    }
});

/**
 * GET /profile/:userId/export
 * Export user data (GDPR)
 */
router.get('/:userId/export', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        // User can only export their own data
        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const data = await userProfileService.exportUserData(userId);

        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error exporting user data:', error);
        res.status(500).json({ error: 'Data export failed' });
    }
});

module.exports = router;
