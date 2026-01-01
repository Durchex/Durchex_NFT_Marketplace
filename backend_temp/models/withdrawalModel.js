import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Withdrawal schema for tracking user withdrawals and earnings
const withdrawalSchema = new Schema(
  {
    // Withdrawal identification
    withdrawalId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    // User details
    userWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    // Withdrawal target
    targetWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      description: 'Wallet address where funds will be withdrawn to',
    },

    // Amount details
    amount: {
      type: String,
      required: true,
      description: 'Amount in wei or smallest unit',
    },
    amountUSD: {
      type: Number,
      required: false,
      description: 'USD value at time of withdrawal request',
    },

    // Network details
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'mumbai', 'base', 'tezos'],
      required: true,
      index: true,
    },

    // Transaction details
    transactionHash: {
      type: String,
      unique: true,
      sparse: true,
      description: 'Blockchain transaction hash once processed',
    },
    blockNumber: {
      type: Number,
      required: false,
    },

    // Withdrawal types
    withdrawalType: {
      type: String,
      enum: ['sales_earnings', 'partner_share', 'giveaway_rewards', 'referral_bonus', 'subsidy_refund'],
      required: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'processing', 'confirmed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    // Fee information
    platformFee: {
      amount: String,
      percentage: Number,
    },
    networkFee: {
      gasPrice: String,
      gasUsed: String,
      totalGasCost: String,
    },

    // Reason for failure (if applicable)
    failureReason: {
      type: String,
      required: false,
      enum: [
        'insufficient_balance',
        'wallet_verification_failed',
        'invalid_wallet_address',
        'network_error',
        'contract_error',
        'user_cancelled',
      ],
    },

    // Metadata
    metadata: {
      sourceTransactions: [String], // Transaction hashes that contributed to this withdrawal
      isPartnerWithdrawal: Boolean,
      partnerWalletId: String,
      batchWithdrawalId: String, // If part of batch withdrawal
    },

    // Bank account (for future fiat withdrawals)
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      routingNumber: String,
      bankName: String,
      country: String,
    },

    // Timestamps
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      required: false,
    },
    confirmedAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

// Indexes for performance
withdrawalSchema.index({ 'userWallet': 1, 'createdAt': -1 });
withdrawalSchema.index({ 'status': 1, 'createdAt': -1 });
withdrawalSchema.index({ 'network': 1, 'status': 1 });

// Model
export const withdrawalModel = mongoose.model("Withdrawal", withdrawalSchema);

// Utility functions
export const getWithdrawals = () => withdrawalModel.find();

export const getWithdrawalById = (withdrawalId) =>
  withdrawalModel.findOne({ withdrawalId });

export const getWithdrawalByHash = (hash) =>
  withdrawalModel.findOne({ transactionHash: hash });

export const getUserWithdrawals = (userWallet) =>
  withdrawalModel.find({ userWallet: userWallet.toLowerCase() }).sort({ createdAt: -1 });

export const getPendingWithdrawals = () =>
  withdrawalModel.find({
    status: { $in: ['pending', 'processing'] },
  });

export const getWithdrawalsByStatus = (status, limit = 100) =>
  withdrawalModel.find({ status }).sort({ createdAt: -1 }).limit(limit);

export const createWithdrawal = async (values) => {
  values.userWallet = values.userWallet.toLowerCase();
  values.targetWallet = values.targetWallet.toLowerCase();

  const withdrawal = new withdrawalModel(values);
  await withdrawal.save();
  return withdrawal.toObject();
};

export const updateWithdrawal = (withdrawalId, values) =>
  withdrawalModel.findOneAndUpdate({ withdrawalId }, values, { new: true });

export const updateWithdrawalByHash = (transactionHash, values) =>
  withdrawalModel.findOneAndUpdate({ transactionHash }, values, { new: true });

export const getUserWithdrawalStats = (userWallet) =>
  withdrawalModel.aggregate([
    {
      $match: {
        userWallet: userWallet.toLowerCase(),
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: { $toDecimal: '$amount' } },
      },
    },
  ]);

export const deleteWithdrawal = (withdrawalId) =>
  withdrawalModel.findOneAndDelete({ withdrawalId });
