import { withdrawalModel } from '../models/withdrawalModel.js';
import transactionModel from '../models/transactionModel.js';
import partnerWalletModel from '../models/partnerWalletModel.js';

// Get all withdrawals with filters
export const getAllWithdrawals = async (req, res) => {
  try {
    const {
      status = 'pending',
      limit = 50,
      skip = 0,
      network,
      startDate,
      endDate,
    } = req.query;

    const filter = { status };

    if (network) {
      filter.network = network;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const total = await withdrawalModel.countDocuments(filter);
    const withdrawals = await withdrawalModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const stats = {
      total,
      byStatus: await withdrawalModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
      byNetwork: await withdrawalModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$network',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    };

    res.json({
      success: true,
      withdrawals,
      stats,
      pagination: { total, skip: parseInt(skip), limit: parseInt(limit) },
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Process multiple pending withdrawals
export const processPendingWithdrawals = async (req, res) => {
  try {
    const { withdrawalIds = [] } = req.body;

    // Get all pending withdrawals
    const filter = { status: 'pending' };
    if (withdrawalIds.length > 0) {
      filter._id = { $in: withdrawalIds };
    }

    const pendingWithdrawals = await withdrawalModel.find(filter).limit(100);

    if (pendingWithdrawals.length === 0) {
      return res.json({
        success: true,
        message: 'No pending withdrawals to process',
        results: [],
      });
    }

    // Process each withdrawal
    const results = [];
    for (const withdrawal of pendingWithdrawals) {
      try {
        // Validate withdrawal
        const validation = validateWithdrawalForProcessing(withdrawal);
        if (!validation.valid) {
          results.push({
            withdrawalId: withdrawal._id,
            status: 'failed',
            reason: validation.reason,
          });
          continue;
        }

        // Update status to processing
        withdrawal.status = 'processing';
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        results.push({
          withdrawalId: withdrawal._id,
          status: 'processing',
          amount: withdrawal.amount,
          targetWallet: withdrawal.targetWallet,
        });
      } catch (error) {
        results.push({
          withdrawalId: withdrawal._id,
          status: 'error',
          reason: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} withdrawals`,
      results,
    });
  } catch (error) {
    console.error('Error processing withdrawals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve withdrawal with transaction hash
export const approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId, transactionHash } = req.body;

    if (!transactionHash) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Transaction hash required for approval',
        });
    }

    const withdrawal = await withdrawalModel.findById(withdrawalId);
    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, error: 'Withdrawal not found' });
    }

    // Update withdrawal status
    withdrawal.status = 'confirmed';
    withdrawal.transactionHash = transactionHash;
    withdrawal.processedAt = new Date();
    withdrawal.confirmedAt = new Date();
    await withdrawal.save();

    // Update partner wallet balance if applicable
    if (withdrawal.withdrawalType === 'partner_share') {
      const partnerWallet = await partnerWalletModel.findOne({
        ownerWallet: { $regex: new RegExp(withdrawal.userWallet, 'i') },
      });

      if (partnerWallet) {
        partnerWallet.totalWithdrawn =
          (partnerWallet.totalWithdrawn || 0) + withdrawal.amount;
        partnerWallet.pendingBalance = Math.max(
          0,
          partnerWallet.pendingBalance - withdrawal.amount
        );
        await partnerWallet.save();
      }
    }

    res.json({
      success: true,
      message: 'Withdrawal approved',
      withdrawal,
    });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reject withdrawal with reason
export const rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId, reason } = req.body;

    if (!reason) {
      return res
        .status(400)
        .json({ success: false, error: 'Rejection reason required' });
    }

    const withdrawal = await withdrawalModel.findById(withdrawalId);
    if (!withdrawal) {
      return res
        .status(404)
        .json({ success: false, error: 'Withdrawal not found' });
    }

    // Update withdrawal status
    withdrawal.status = 'failed';
    withdrawal.rejectionReason = reason;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    res.json({
      success: true,
      message: 'Withdrawal rejected',
      withdrawal,
    });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get withdrawal analytics
export const getWithdrawalAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    const matchStage =
      Object.keys(dateFilter).length > 0
        ? { $match: { createdAt: dateFilter } }
        : { $match: {} };

    const [statusDistribution, networkDistribution, typeDistribution, dailyVolume] =
      await Promise.all([
        // Status distribution
        withdrawalModel.aggregate([
          matchStage,
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
              avgAmount: { $avg: '$amount' },
            },
          },
          { $sort: { totalAmount: -1 } },
        ]),

        // Network distribution
        withdrawalModel.aggregate([
          matchStage,
          {
            $group: {
              _id: '$network',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
            },
          },
          { $sort: { totalAmount: -1 } },
        ]),

        // Withdrawal type distribution
        withdrawalModel.aggregate([
          matchStage,
          {
            $group: {
              _id: '$withdrawalType',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
            },
          },
          { $sort: { totalAmount: -1 } },
        ]),

        // Daily volume
        withdrawalModel.aggregate([
          matchStage,
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt',
                },
              },
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    res.json({
      success: true,
      analytics: {
        statusDistribution,
        networkDistribution,
        typeDistribution,
        dailyVolume,
        totalWithdrawals: statusDistribution.reduce(
          (sum, s) => sum + s.count,
          0
        ),
        totalAmount: statusDistribution.reduce(
          (sum, s) => sum + s.totalAmount,
          0
        ),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Resync withdrawal status (for blockchain verification)
export const resyncWithdrawalStatus = async (req, res) => {
  try {
    const { withdrawalIds = [] } = req.body;

    // Get withdrawals to resync
    const filter = { status: 'processing' };
    if (withdrawalIds.length > 0) {
      filter._id = { $in: withdrawalIds };
    }

    const withdrawalsToSync = await withdrawalModel.find(filter).limit(100);

    const results = [];
    for (const withdrawal of withdrawalsToSync) {
      // In a real implementation, you would check blockchain here
      // For now, we'll update the status based on age
      const ageHours = (Date.now() - withdrawal.processedAt) / (1000 * 60 * 60);

      if (ageHours > 24) {
        // Assume confirmed after 24 hours
        withdrawal.status = 'confirmed';
        withdrawal.confirmedAt = new Date();
      }

      await withdrawal.save();

      results.push({
        withdrawalId: withdrawal._id,
        newStatus: withdrawal.status,
      });
    }

    res.json({
      success: true,
      message: `Synced ${results.length} withdrawals`,
      results,
    });
  } catch (error) {
    console.error('Error resyncing withdrawals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to validate withdrawal for processing
function validateWithdrawalForProcessing(withdrawal) {
  // Check if wallet addresses are valid
  if (
    !withdrawal.userWallet ||
    !withdrawal.targetWallet ||
    !withdrawal.amount
  ) {
    return {
      valid: false,
      reason: 'Invalid withdrawal data (missing wallet or amount)',
    };
  }

  // Check if amount is positive
  if (withdrawal.amount <= 0) {
    return { valid: false, reason: 'Invalid amount (must be positive)' };
  }

  // Check if network is supported
  const supportedNetworks = ['ethereum', 'polygon', 'mumbai', 'base'];
  if (!supportedNetworks.includes(withdrawal.network)) {
    return { valid: false, reason: `Unsupported network: ${withdrawal.network}` };
  }

  return { valid: true };
}

export default {
  getAllWithdrawals,
  processPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getWithdrawalAnalytics,
  resyncWithdrawalStatus,
};
