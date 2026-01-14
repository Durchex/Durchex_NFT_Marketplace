import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Transaction schema for tracking NFT sales and marketplace transactions
const transactionSchema = new Schema(
  {
    // Transaction identification
    transactionHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: 'Blockchain transaction hash',
    },

    // NFT details
    nftId: {
      type: String,
      required: true,
      index: true,
      description: 'ID of the NFT being transacted',
    },

    tokenId: {
      type: String,
      required: true,
      description: 'Token ID of the NFT',
    },

    // Parties involved
    seller: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      description: 'Wallet address of the seller',
    },

    buyer: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      description: 'Wallet address of the buyer',
    },

    // Financial details
    salePrice: {
      type: String,
      required: true,
      description: 'Sale price in wei or smallest unit',
    },

    salePriceUSD: {
      type: Number,
      required: false,
      description: 'USD value at time of sale',
    },

    // Platform fees
    platformFee: {
      amount: {
        type: String,
        required: false,
        description: 'Platform fee amount in wei',
      },
      percentage: {
        type: Number,
        required: false,
        description: 'Platform fee percentage',
      },
    },

    // Creator royalties
    creatorRoyalty: {
      amount: {
        type: String,
        required: false,
        description: 'Creator royalty amount in wei',
      },
      percentage: {
        type: Number,
        required: false,
        description: 'Creator royalty percentage',
      },
      recipient: {
        type: String,
        required: false,
        lowercase: true,
        description: 'Creator wallet address',
      },
    },

    // Network details
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'mumbai', 'base', 'tezos', 'arbitrum', 'bsc'],
      required: true,
      index: true,
    },

    // Transaction type
    transactionType: {
      type: String,
      enum: ['sale', 'auction', 'offer', 'transfer'],
      default: 'sale',
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed',
      index: true,
    },

    // Marketplace details
    marketplaceAddress: {
      type: String,
      required: true,
      lowercase: true,
      description: 'Address of the marketplace contract',
    },

    // Additional metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
      description: 'Additional transaction metadata',
    },

    // Timestamps
    blockTimestamp: {
      type: Date,
      required: false,
      description: 'Timestamp from blockchain',
    },

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
transactionSchema.index({ seller: 1, network: 1, status: 1 });
transactionSchema.index({ buyer: 1, network: 1, status: 1 });
transactionSchema.index({ nftId: 1, status: 1 });
transactionSchema.index({ transactionHash: 1 });
transactionSchema.index({ network: 1, createdAt: -1 });

// Pre-save middleware to update the updatedAt field
transactionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static methods for common queries
transactionSchema.statics.getSellerEarnings = async function (sellerWallet, network = null, startDate = null, endDate = null) {
  const query = {
    seller: sellerWallet.toLowerCase(),
    status: 'completed',
  };

  if (network) {
    query.network = network;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.find(query).sort({ createdAt: -1 });
};

transactionSchema.statics.getBuyerTransactions = async function (buyerWallet, network = null, startDate = null, endDate = null) {
  const query = {
    buyer: buyerWallet.toLowerCase(),
    status: 'completed',
  };

  if (network) {
    query.network = network;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.find(query).sort({ createdAt: -1 });
};

transactionSchema.statics.getNetworkStats = async function (network, startDate = null, endDate = null) {
  const query = {
    network: network,
    status: 'completed',
  };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalVolume: { $sum: { $toDecimal: '$salePrice' } },
        totalTransactions: { $sum: 1 },
        totalPlatformFees: { $sum: { $toDecimal: '$platformFee.amount' } },
        uniqueSellers: { $addToSet: '$seller' },
        uniqueBuyers: { $addToSet: '$buyer' },
      },
    },
  ]);

  return stats[0] || {
    totalVolume: 0,
    totalTransactions: 0,
    totalPlatformFees: 0,
    uniqueSellers: [],
    uniqueBuyers: [],
  };
};

// Instance methods
transactionSchema.methods.getNetSellerEarnings = function () {
  const salePrice = BigInt(this.salePrice);
  const platformFee = this.platformFee?.amount ? BigInt(this.platformFee.amount) : BigInt(0);
  const creatorRoyalty = this.creatorRoyalty?.amount ? BigInt(this.creatorRoyalty.amount) : BigInt(0);

  return (salePrice - platformFee - creatorRoyalty).toString();
};

transactionSchema.methods.getTotalFees = function () {
  const platformFee = this.platformFee?.amount ? BigInt(this.platformFee.amount) : BigInt(0);
  const creatorRoyalty = this.creatorRoyalty?.amount ? BigInt(this.creatorRoyalty.amount) : BigInt(0);

  return (platformFee + creatorRoyalty).toString();
};

// Create and export the model
const transactionModel = mongoose.model('Transaction', transactionSchema);

// Export static methods
export const getSellerEarnings = transactionModel.getSellerEarnings.bind(transactionModel);

export default transactionModel;
export {
  transactionModel,
  transactionSchema,
};