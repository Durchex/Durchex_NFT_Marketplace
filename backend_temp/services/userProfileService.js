/**
 * User Profile Service
 * Handles user profile management, avatars, bios, social links, verification
 */

const Provider = require('../config/provider');
const User = require('../models/User');
const { uploadToIPFS } = require('./ipfsService');
const redis = require('redis');
const redisClient = redis.createClient();

class UserProfileService {
    /**
     * Get user profile by ID or wallet address
     */
    async getUserProfile(userIdOrAddress) {
        // Try cache first
        const cached = await redisClient.get(`profile:${userIdOrAddress}`);
        if (cached) {
            return JSON.parse(cached);
        }

        const user = await User.findOne({
            $or: [
                { _id: userIdOrAddress },
                { walletAddress: userIdOrAddress.toLowerCase() }
            ]
        }).select('-password').lean();

        if (!user) {
            return null;
        }

        // Cache for 1 hour
        await redisClient.setEx(`profile:${userIdOrAddress}`, 3600, JSON.stringify(user));

        return user;
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId, profileData) {
        const {
            username,
            bio,
            avatar,
            bannerImage,
            website,
            twitter,
            discord,
            instagram,
            telegram,
            isVerified,
            verificationStatus
        } = profileData;

        // Validate username uniqueness
        if (username) {
            const existing = await User.findOne({
                username: { $regex: new RegExp(`^${username}$`, 'i') },
                _id: { $ne: userId }
            });
            if (existing) {
                throw new Error('Username already taken');
            }
        }

        // Validate profile data
        if (bio && bio.length > 500) {
            throw new Error('Bio must be 500 characters or less');
        }

        const updateData = {};

        if (username) updateData.username = username;
        if (bio) updateData.bio = bio;
        if (website) updateData.website = website;
        if (twitter) updateData.twitter = twitter;
        if (discord) updateData.discord = discord;
        if (instagram) updateData.instagram = instagram;
        if (telegram) updateData.telegram = telegram;

        // Handle avatar upload
        if (avatar && typeof avatar === 'string' && avatar.startsWith('data:')) {
            const ipfsHash = await uploadToIPFS(Buffer.from(avatar));
            updateData.avatar = `ipfs://${ipfsHash}`;
        } else if (avatar) {
            updateData.avatar = avatar;
        }

        // Handle banner upload
        if (bannerImage && typeof bannerImage === 'string' && bannerImage.startsWith('data:')) {
            const ipfsHash = await uploadToIPFS(Buffer.from(bannerImage));
            updateData.bannerImage = `ipfs://${ipfsHash}`;
        } else if (bannerImage) {
            updateData.bannerImage = bannerImage;
        }

        updateData.updatedAt = new Date();

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true })
            .select('-password')
            .lean();

        // Clear cache
        await redisClient.del(`profile:${userId}`);

        return user;
    }

    /**
     * Get user statistics (followers, following, collections, items)
     */
    async getUserStats(userId) {
        const user = await User.findById(userId);
        if (!user) return null;

        const nftCollection = require('mongoose').model('NFT');
        const followerModel = require('mongoose').model('Follower');

        const stats = {
            followers: await followerModel.countDocuments({ followeeId: userId }),
            following: await followerModel.countDocuments({ followerId: userId }),
            collections: await nftCollection.distinct('collectionId', { creator: userId }).length,
            items: await nftCollection.countDocuments({ creator: userId }),
            sales: await nftCollection.countDocuments({ creator: userId, isSold: true }),
            totalVolume: 0,
            joinDate: user.createdAt
        };

        // Calculate total volume
        const sales = await nftCollection.find({
            creator: userId,
            isSold: true,
            lastSalePrice: { $exists: true }
        }).select('lastSalePrice');

        stats.totalVolume = sales.reduce((sum, sale) => sum + (sale.lastSalePrice || 0), 0);

        return stats;
    }

    /**
     * Verify user with badge/checkmark
     */
    async verifyUser(userId, verificationData) {
        const { documentType, documentHash, verificationLevel } = verificationData;

        if (!['basic', 'premium', 'enterprise'].includes(verificationLevel)) {
            throw new Error('Invalid verification level');
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                isVerified: true,
                verificationLevel,
                verificationDocuments: {
                    type: documentType,
                    hash: documentHash,
                    verifiedAt: new Date()
                }
            },
            { new: true }
        ).select('-password');

        // Clear cache
        await redisClient.del(`profile:${userId}`);

        return user;
    }

    /**
     * Add social proof (verified social accounts)
     */
    async addSocialProof(userId, platform, username, verificationToken) {
        const user = await User.findById(userId);
        if (!user) return null;

        const supportedPlatforms = ['twitter', 'discord', 'instagram', 'telegram'];
        if (!supportedPlatforms.includes(platform)) {
            throw new Error('Unsupported social platform');
        }

        if (!user.socialProof) {
            user.socialProof = [];
        }

        // Check if already verified
        const existing = user.socialProof.find(s => s.platform === platform);
        if (existing && existing.verified) {
            throw new Error(`${platform} already verified`);
        }

        const proofEntry = {
            platform,
            username,
            verificationToken,
            verified: false,
            verifiedAt: null,
            addedAt: new Date()
        };

        // Verify the social account (simplified - in production, call social API)
        if (verificationToken) {
            proofEntry.verified = true;
            proofEntry.verifiedAt = new Date();
        }

        user.socialProof.push(proofEntry);
        await user.save();

        // Clear cache
        await redisClient.del(`profile:${userId}`);

        return user;
    }

    /**
     * Update profile settings
     */
    async updateProfileSettings(userId, settings) {
        const {
            privateProfile,
            emailNotifications,
            pushNotifications,
            saleNotifications,
            bidNotifications,
            followNotifications,
            hideActivity,
            hidePortfolio
        } = settings;

        const updateData = {};

        if (privateProfile !== undefined) updateData.privateProfile = privateProfile;
        if (emailNotifications !== undefined) updateData['settings.emailNotifications'] = emailNotifications;
        if (pushNotifications !== undefined) updateData['settings.pushNotifications'] = pushNotifications;
        if (saleNotifications !== undefined) updateData['settings.saleNotifications'] = saleNotifications;
        if (bidNotifications !== undefined) updateData['settings.bidNotifications'] = bidNotifications;
        if (followNotifications !== undefined) updateData['settings.followNotifications'] = followNotifications;
        if (hideActivity !== undefined) updateData['settings.hideActivity'] = hideActivity;
        if (hidePortfolio !== undefined) updateData['settings.hidePortfolio'] = hidePortfolio;

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true })
            .select('-password');

        // Clear cache
        await redisClient.del(`profile:${userId}`);

        return user;
    }

    /**
     * Get user activity feed
     */
    async getUserActivityFeed(userId, options = {}) {
        const { limit = 20, skip = 0, timeframe = '30d' } = options;

        const nftCollection = require('mongoose').model('NFT');
        const auctionModel = require('mongoose').model('Auction');

        const timeframeMs = this._getTimeframeMs(timeframe);
        const since = new Date(Date.now() - timeframeMs);

        const activities = [];

        // Get user's NFT creations
        const createdNFTs = await nftCollection
            .find({ creator: userId, createdAt: { $gte: since } })
            .sort({ createdAt: -1 })
            .limit(limit);

        activities.push(...createdNFTs.map(nft => ({
            type: 'nft_created',
            nft,
            timestamp: nft.createdAt
        })));

        // Get user's auctions
        const auctions = await auctionModel
            .find({ creator: userId, createdAt: { $gte: since } })
            .sort({ createdAt: -1 })
            .limit(limit);

        activities.push(...auctions.map(auction => ({
            type: 'auction_created',
            auction,
            timestamp: auction.createdAt
        })));

        // Sort by timestamp and paginate
        activities.sort((a, b) => b.timestamp - a.timestamp);
        return activities.slice(skip, skip + limit);
    }

    /**
     * Search users by username or address
     */
    async searchUsers(query, options = {}) {
        const { limit = 10, skip = 0 } = options;

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { walletAddress: { $regex: query, $options: 'i' } },
                { bio: { $regex: query, $options: 'i' } }
            ]
        })
            .select('-password')
            .limit(limit)
            .skip(skip)
            .lean();

        return users;
    }

    /**
     * Get trending creators
     */
    async getTrendingCreators(options = {}) {
        const { limit = 20, timeframe = '7d' } = options;

        const nftCollection = require('mongoose').model('NFT');

        const timeframeMs = this._getTimeframeMs(timeframe);
        const since = new Date(Date.now() - timeframeMs);

        const creators = await nftCollection.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $group: {
                _id: '$creator',
                count: { $sum: 1 },
                volume: { $sum: '$lastSalePrice' }
            }},
            { $sort: { volume: -1 } },
            { $limit: limit }
        ]);

        // Fetch creator details
        const creatorDetails = await Promise.all(
            creators.map(async (creator) => {
                const user = await this.getUserProfile(creator._id);
                return {
                    user,
                    itemsCreated: creator.count,
                    volume: creator.volume
                };
            })
        );

        return creatorDetails;
    }

    /**
     * Helper: Convert timeframe to milliseconds
     */
    _getTimeframeMs(timeframe) {
        const frames = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000,
            '1y': 365 * 24 * 60 * 60 * 1000
        };
        return frames[timeframe] || frames['7d'];
    }

    /**
     * Validate email
     */
    async validateEmail(userId, token) {
        const user = await User.findById(userId);
        if (!user) return false;

        // Verify token
        if (user.emailVerificationToken === token) {
            user.emailVerified = true;
            user.emailVerificationToken = null;
            await user.save();
            
            // Clear cache
            await redisClient.del(`profile:${userId}`);
            
            return true;
        }

        return false;
    }

    /**
     * Export user data (GDPR)
     */
    async exportUserData(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) return null;

        const nftCollection = require('mongoose').model('NFT');
        const nfts = await nftCollection.find({ $or: [
            { creator: userId },
            { owner: userId }
        ] });

        return {
            profile: user,
            nfts,
            exportedAt: new Date()
        };
    }
}

module.exports = new UserProfileService();
