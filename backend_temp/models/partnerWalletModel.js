import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Partner Wallet schema for tracking partner earnings and profit sharing
const partnerWalletSchema = new Schema(
  {
    // Partner details
    partnerWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      description: 'Wallet address of the partner',
    },

    // Owner details (who owns the collection/NFT)
    ownerWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      description: 'Wallet address of the owner',
    },

    ownerName: {
      type: String,
      required: false,
      description: 'Name of the owner',
    },

    // Profit sharing configuration
    profitShare: {
      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        description: 'Percentage of profits shared with partner',
      },
      type: {
        type: String,
        enum: ['royalty', 'commission', 'revenue_share'],
        default: 'royalty',
        description: 'Type of profit sharing arrangement',
      },
    },

    // Financial tracking
    pendingBalance: {
      type: String,
      default: '0',
      description: 'Pending balance available for withdrawal (in wei)',
    },

    totalEarned: {
      type: String,
      default: '0',
      description: 'Total earnings accumulated (in wei)',
    },

    totalWithdrawn: {
      type: String,
      default: '0',
      description: 'Total amount withdrawn (in wei)',
    },

    // Status and metadata
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },

    // Network information
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'mumbai', 'base', 'tezos', 'arbitrum', 'bsc'],
      required: true,
      index: true,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
partnerWalletSchema.index({ partnerWallet: 1, status: 1 });
partnerWalletSchema.index({ ownerWallet: 1, status: 1 });
partnerWalletSchema.index({ network: 1 });

// Pre-save middleware to update the updatedAt field
partnerWalletSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static methods for common queries
partnerWalletSchema.statics.getPartnerWalletsByPartner = function (partnerWallet) {
  return this.find({
    partnerWallet: partnerWallet.toLowerCase(),
    status: 'active',
  });
};

partnerWalletSchema.statics.getPartnerWalletsByOwner = function (ownerWallet) {
  return this.find({
    ownerWallet: ownerWallet.toLowerCase(),
    status: 'active',
  });
};

partnerWalletSchema.statics.updatePartnerWallet = async function (partnerWallet, ownerWallet, updates) {
  return this.findOneAndUpdate(
    {
      partnerWallet: partnerWallet.toLowerCase(),
      ownerWallet: ownerWallet.toLowerCase(),
    },
    { ...updates, updatedAt: Date.now() },
    { new: true, upsert: false }
  );
};

// Instance methods
partnerWalletSchema.methods.addEarnings = function (amount) {
  const currentPending = BigInt(this.pendingBalance || '0');
  const earnings = BigInt(amount);
  this.pendingBalance = (currentPending + earnings).toString();

  const currentTotal = BigInt(this.totalEarned || '0');
  this.totalEarned = (currentTotal + earnings).toString();

  return this.save();
};

partnerWalletSchema.methods.withdrawEarnings = function (amount) {
  const currentPending = BigInt(this.pendingBalance || '0');
  const withdrawal = BigInt(amount);

  if (currentPending < withdrawal) {
    throw new Error('Insufficient pending balance');
  }

  this.pendingBalance = (currentPending - withdrawal).toString();

  const currentWithdrawn = BigInt(this.totalWithdrawn || '0');
  this.totalWithdrawn = (currentWithdrawn + withdrawal).toString();

  return this.save();
};

// Create and export the model
const partnerWalletModel = mongoose.model('PartnerWallet', partnerWalletSchema);

// Export default
export default partnerWalletModel;

// Export named exports
export {
  partnerWalletModel,
  partnerWalletSchema,
};