// Admin service for platform management
const User = require('../models/User');
const NFT = require('../models/NFT');
const Dispute = require('../models/Dispute');
const Transaction = require('../models/Transaction');
const { logger } = require('../monitoring');

class AdminService {
  // User Management
  async getAllUsers(filters = {}) {
    try {
      const query = {};

      if (filters.status) query.status = filters.status;
      if (filters.isVerified !== undefined) query.isVerified = filters.isVerified;
      if (filters.role) query.role = filters.role;
      if (filters.search) {
        query.$or = [
          { username: new RegExp(filters.search, 'i') },
          { email: new RegExp(filters.search, 'i') },
          { walletAddress: new RegExp(filters.search, 'i') },
        ];
      }

      const skip = (filters.page - 1) * filters.limit || 0;
      const limit = filters.limit || 20;

      const users = await User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      return {
        users,
        pagination: {
          page: filters.page || 1,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get users:', error);
      throw error;
    }
  }

  async suspendUser(userId, reason) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          status: 'suspended',
          suspensionReason: reason,
          suspendedAt: new Date(),
        },
        { new: true }
      );

      logger.info(`User suspended: ${userId}`, { reason });
      return user;
    } catch (error) {
      logger.error('Failed to suspend user:', error);
      throw error;
    }
  }

  async banUser(userId, reason) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          status: 'banned',
          banReason: reason,
          bannedAt: new Date(),
        },
        { new: true }
      );

      logger.info(`User banned: ${userId}`, { reason });
      return user;
    } catch (error) {
      logger.error('Failed to ban user:', error);
      throw error;
    }
  }

  async verifyUser(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isVerified: true, verifiedAt: new Date() },
        { new: true }
      );

      logger.info(`User verified: ${userId}`);
      return user;
    } catch (error) {
      logger.error('Failed to verify user:', error);
      throw error;
    }
  }

  async resetUserPassword(userId) {
    try {
      const tempPassword = Math.random().toString(36).slice(-12);
      const hashedPassword = await require('bcryptjs').hash(tempPassword, 10);

      await User.findByIdAndUpdate(userId, {
        password: hashedPassword,
        mustChangePassword: true,
      });

      logger.info(`Password reset for user: ${userId}`);
      return { tempPassword };
    } catch (error) {
      logger.error('Failed to reset password:', error);
      throw error;
    }
  }

  // Dispute Resolution
  async getDisputes(filters = {}) {
    try {
      const query = {};

      if (filters.status) query.status = filters.status;
      if (filters.type) query.type = filters.type;
      if (filters.priority) query.priority = filters.priority;

      const skip = (filters.page - 1) * filters.limit || 0;
      const limit = filters.limit || 20;

      const disputes = await Dispute.find(query)
        .populate('reporterId', 'username email walletAddress')
        .populate('respondentId', 'username email walletAddress')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Dispute.countDocuments(query);

      return {
        disputes,
        pagination: {
          page: filters.page || 1,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get disputes:', error);
      throw error;
    }
  }

  async resolveDispute(disputeId, decision, reason) {
    try {
      const dispute = await Dispute.findByIdAndUpdate(
        disputeId,
        {
          status: 'resolved',
          decision,
          resolutionReason: reason,
          resolvedAt: new Date(),
          resolvedBy: 'admin', // Would be admin user ID in real system
        },
        { new: true }
      );

      // Award compensation if needed
      if (decision === 'compensation') {
        await this.awardCompensation(dispute.reporterId, dispute.amount);
      }

      logger.info(`Dispute resolved: ${disputeId}`, { decision });
      return dispute;
    } catch (error) {
      logger.error('Failed to resolve dispute:', error);
      throw error;
    }
  }

  async awardCompensation(userId, amount) {
    try {
      await User.findByIdAndUpdate(userId, {
        $inc: { compensationBalance: amount },
      });

      logger.info(`Compensation awarded: ${userId}`, { amount });
    } catch (error) {
      logger.error('Failed to award compensation:', error);
      throw error;
    }
  }

  // NFT Moderation
  async flagNFT(nftId, reason) {
    try {
      const nft = await NFT.findByIdAndUpdate(
        nftId,
        {
          flagged: true,
          flagReason: reason,
          flaggedAt: new Date(),
        },
        { new: true }
      );

      logger.info(`NFT flagged: ${nftId}`, { reason });
      return nft;
    } catch (error) {
      logger.error('Failed to flag NFT:', error);
      throw error;
    }
  }

  async removeNFT(nftId, reason) {
    try {
      const nft = await NFT.findByIdAndUpdate(
        nftId,
        {
          status: 'removed',
          removalReason: reason,
          removedAt: new Date(),
        },
        { new: true }
      );

      logger.info(`NFT removed: ${nftId}`, { reason });
      return nft;
    } catch (error) {
      logger.error('Failed to remove NFT:', error);
      throw error;
    }
  }

  // Platform Statistics
  async getPlatformStats() {
    try {
      const stats = {
        users: {
          total: await User.countDocuments(),
          active: await User.countDocuments({ status: 'active' }),
          verified: await User.countDocuments({ isVerified: true }),
          suspended: await User.countDocuments({ status: 'suspended' }),
          banned: await User.countDocuments({ status: 'banned' }),
        },
        nfts: {
          total: await NFT.countDocuments(),
          listed: await NFT.countDocuments({ status: 'listed' }),
          sold: await NFT.countDocuments({ status: 'sold' }),
          flagged: await NFT.countDocuments({ flagged: true }),
        },
        disputes: {
          total: await Dispute.countDocuments(),
          open: await Dispute.countDocuments({ status: 'open' }),
          resolved: await Dispute.countDocuments({ status: 'resolved' }),
        },
        transactions: {
          total: await Transaction.countDocuments(),
          volume: await this.getTotalTransactionVolume(),
          pendingApprovals: await Transaction.countDocuments({ status: 'pending_approval' }),
        },
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get platform stats:', error);
      throw error;
    }
  }

  async getTotalTransactionVolume() {
    try {
      const result = await Transaction.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalVolume: { $sum: '$amount' },
          },
        },
      ]);

      return result[0]?.totalVolume || 0;
    } catch (error) {
      logger.error('Failed to get transaction volume:', error);
      throw error;
    }
  }

  async getRecentActivity() {
    try {
      const transactions = await Transaction.find()
        .populate('userId', 'username')
        .sort({ createdAt: -1 })
        .limit(20);

      const flaggedNFTs = await NFT.find({ flagged: true })
        .sort({ flaggedAt: -1 })
        .limit(10);

      const openDisputes = await Dispute.find({ status: 'open' })
        .populate('reporterId', 'username')
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        transactions,
        flaggedNFTs,
        openDisputes,
      };
    } catch (error) {
      logger.error('Failed to get recent activity:', error);
      throw error;
    }
  }

  // Platform Settings
  async updatePlatformSettings(settings) {
    try {
      const PlatformSettings = require('../models/PlatformSettings');

      const updated = await PlatformSettings.findOneAndUpdate(
        {},
        settings,
        { upsert: true, new: true }
      );

      logger.info('Platform settings updated', { settings });
      return updated;
    } catch (error) {
      logger.error('Failed to update platform settings:', error);
      throw error;
    }
  }

  async getPlatformSettings() {
    try {
      const PlatformSettings = require('../models/PlatformSettings');
      return await PlatformSettings.findOne({});
    } catch (error) {
      logger.error('Failed to get platform settings:', error);
      throw error;
    }
  }
}

module.exports = new AdminService();
