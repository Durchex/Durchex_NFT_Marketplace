import { ethers } from 'ethers';
import {
  withdrawalModel,
  createWithdrawal,
  getWithdrawalById,
  updateWithdrawal,
  getUserWithdrawals,
  getWithdrawalsByStatus,
} from '../models/withdrawalModel.js';
import {
  partnerWalletModel,
  getPartnerWalletsByPartner,
  getPartnerWalletsByOwner,
  updatePartnerWallet,
} from '../models/partnerWalletModel.js';
import {
  transactionModel,
  getSellerEarnings,
} from '../models/transactionModel.js';
import { nftUserModel } from '../models/userModel.js';

// Generate unique withdrawal ID
const generateWithdrawalId = () => {
  return `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Calculate user earnings from NFT sales
export const calculateUserEarnings = async (userWallet, network = null) => {
  try {
    const query = {
      from: userWallet.toLowerCase(),
      transactionType: 'sale',
      status: 'confirmed',
    };

    if (network) {
      query.network = network;
    }

    const sales = await transactionModel.find(query);

    const byNetwork = {};
    let totalEarnings = '0';

    for (const sale of sales) {
      const saleAmount = BigInt(sale.salePrice);
      const platformFeeAmount = sale.platformFee?.amount
        ? BigInt(sale.platformFee.amount)
        : BigInt(0);

      const netEarning = (saleAmount - platformFeeAmount).toString();

      if (!byNetwork[sale.network]) {
        byNetwork[sale.network] = {
          totalSales: '0',
          earnings: '0',
          platformFees: '0',
          transactionCount: 0,
        };
      }

      byNetwork[sale.network].earnings = (
        BigInt(byNetwork[sale.network].earnings) + BigInt(netEarning)
      ).toString();
      byNetwork[sale.network].platformFees = (
        BigInt(byNetwork[sale.network].platformFees) + platformFeeAmount
      ).toString();
      byNetwork[sale.network].transactionCount += 1;
      byNetwork[sale.network].totalSales = (
        BigInt(byNetwork[sale.network].totalSales) + saleAmount
      ).toString();
    }

    for (const net in byNetwork) {
      totalEarnings = (
        BigInt(totalEarnings) + BigInt(byNetwork[net].earnings)
      ).toString();
    }

    return {
      success: true,
      totalEarnings,
      byNetwork,
      totalTransactions: sales.length,
    };
  } catch (error) {
    console.error('Error calculating user earnings:', error);
    return {
      success: false,
      error: error.message,
      totalEarnings: '0',
      byNetwork: {},
    };
  }
};

// Get user's available balance considering pending withdrawals
export const getUserAvailableBalance = async (userWallet, network) => {
  try {
    // Get total earnings
    const earnings = await calculateUserEarnings(userWallet, network);

    if (!earnings.success) {
      return { success: false, error: earnings.error };
    }

    // Get pending withdrawals
    const pendingWithdrawals = await withdrawalModel
      .find({
        userWallet: userWallet.toLowerCase(),
        status: { $in: ['pending', 'processing'] },
        network: network,
      })
      .select('amount');

    let totalPending = '0';
    for (const withdrawal of pendingWithdrawals) {
      totalPending = (BigInt(totalPending) + BigInt(withdrawal.amount)).toString();
    }

    const available = (
      BigInt(earnings.byNetwork[network]?.earnings || '0') - BigInt(totalPending)
    ).toString();

    return {
      success: true,
      totalEarnings: earnings.byNetwork[network]?.earnings || '0',
      pendingWithdrawals: totalPending,
      availableBalance: available,
      network,
    };
  } catch (error) {
    console.error('Error getting available balance:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Initiate a withdrawal request
export const requestWithdrawal = async (req, res) => {
  try {
    const { userWallet, targetWallet, amount, network, withdrawalType } =
      req.body;

    if (
      !userWallet ||
      !targetWallet ||
      !amount ||
      !network ||
      !withdrawalType
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Validate withdrawal type
    const validTypes = [
      'sales_earnings',
      'partner_share',
      'giveaway_rewards',
      'referral_bonus',
      'subsidy_refund',
    ];
    if (!validTypes.includes(withdrawalType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal type',
      });
    }

    // Check available balance
    const balance = await getUserAvailableBalance(userWallet, network);

    if (!balance.success) {
      return res.status(400).json({
        success: false,
        error: balance.error,
      });
    }

    const requestedAmount = BigInt(amount);
    const availableAmount = BigInt(balance.availableBalance);

    if (requestedAmount > availableAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient available balance',
        availableBalance: balance.availableBalance,
        requestedAmount: amount,
      });
    }

    // Validate wallet addresses
    if (!ethers.utils.isAddress(targetWallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target wallet address',
      });
    }

    // Create withdrawal request
    const withdrawalId = generateWithdrawalId();
    const withdrawal = await createWithdrawal({
      withdrawalId,
      userWallet,
      targetWallet,
      amount,
      network,
      withdrawalType,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      withdrawal,
    });
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get user withdrawal history
export const getWithdrawalHistory = async (req, res) => {
  try {
    const { userWallet } = req.params;
    const { status, limit = 50, skip = 0 } = req.query;

    if (!userWallet) {
      return res.status(400).json({
        success: false,
        error: 'User wallet required',
      });
    }

    let query = { userWallet: userWallet.toLowerCase() };

    if (status) {
      query.status = status;
    }

    const withdrawals = await withdrawalModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await withdrawalModel.countDocuments(query);

    return res.status(200).json({
      success: true,
      withdrawals,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + withdrawals.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching withdrawal history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get earnings dashboard
export const getEarningsDashboard = async (req, res) => {
  try {
    const { userWallet } = req.params;

    if (!userWallet) {
      return res.status(400).json({
        success: false,
        error: 'User wallet required',
      });
    }

    // Get earnings
    const earnings = await calculateUserEarnings(userWallet);

    // Get withdrawal stats
    const withdrawalStats = await withdrawalModel.aggregate([
      {
        $match: {
          userWallet: userWallet.toLowerCase(),
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: '$network',
          totalWithdrawn: { $sum: { $toDecimal: '$amount' } },
          withdrawalCount: { $sum: 1 },
        },
      },
    ]);

    // Get partner earnings
    const partnerEarnings = await partnerWalletModel.find({
      partnerWallet: userWallet.toLowerCase(),
      status: 'active',
    });

    const partnerData = [];
    let totalPartnerEarnings = '0';

    for (const partner of partnerEarnings) {
      partnerData.push({
        ownerWallet: partner.ownerWallet,
        ownerName: partner.ownerName,
        sharePercentage: partner.profitShare.percentage,
        pendingBalance: partner.pendingBalance,
        totalEarned: partner.totalEarned,
      });
      totalPartnerEarnings = (
        BigInt(totalPartnerEarnings) + BigInt(partner.pendingBalance)
      ).toString();
    }

    return res.status(200).json({
      success: true,
      dashboard: {
        personalEarnings: earnings,
        withdrawals: withdrawalStats,
        partnerEarnings: {
          data: partnerData,
          totalPending: totalPartnerEarnings,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching earnings dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Admin: Process pending withdrawals
export const processPendingWithdrawals = async (req, res) => {
  try {
    const pendingWithdrawals = await getWithdrawalsByStatus('pending', 100);

    const results = [];

    for (const withdrawal of pendingWithdrawals) {
      // In a real implementation, you would interact with a smart contract
      // or payment processor here to actually execute the withdrawal

      const updated = await updateWithdrawal(withdrawal.withdrawalId, {
        status: 'processing',
        processedAt: new Date(),
      });

      results.push({
        withdrawalId: withdrawal.withdrawalId,
        status: 'updated to processing',
      });
    }

    return res.status(200).json({
      success: true,
      message: `${results.length} withdrawals updated to processing status`,
      results,
    });
  } catch (error) {
    console.error('Error processing withdrawals:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  calculateUserEarnings,
  getUserAvailableBalance,
  requestWithdrawal,
  getWithdrawalHistory,
  getEarningsDashboard,
  processPendingWithdrawals,
};
