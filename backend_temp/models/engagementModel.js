import mongoose from 'mongoose';

// NFT Likes Schema
const nftLikeSchema = new mongoose.Schema(
  {
    nftId: {
      type: String,
      required: true,
      index: true
    },
    itemId: {
      type: String,
      required: true,
      index: true
    },
    contractAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'base', 'solana'],
      required: true,
      index: true
    },
    userWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7776000 // 90 days TTL
    }
  },
  { timestamps: false }
);

// Compound index for uniqueness - user can only like once per NFT
nftLikeSchema.index({ nftId: 1, userWallet: 1 }, { unique: true });
nftLikeSchema.index({ itemId: 1, network: 1 });

export const NFTLike = mongoose.model('NFTLike', nftLikeSchema);

// Collection Likes Schema
const collectionLikeSchema = new mongoose.Schema(
  {
    collectionId: {
      type: String,
      required: true,
      index: true
    },
    collectionName: {
      type: String,
      required: true
    },
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'base', 'solana'],
      required: true,
      index: true
    },
    userWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7776000 // 90 days TTL
    }
  },
  { timestamps: false }
);

collectionLikeSchema.index({ collectionId: 1, userWallet: 1 }, { unique: true });

export const CollectionLike = mongoose.model('CollectionLike', collectionLikeSchema);

// Creator Follows Schema
const creatorFollowSchema = new mongoose.Schema(
  {
    creatorWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    followerWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    followerName: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Compound index - follower can only follow once per creator
creatorFollowSchema.index({ creatorWallet: 1, followerWallet: 1 }, { unique: true });
creatorFollowSchema.index({ followerWallet: 1 });

export const CreatorFollow = mongoose.model('CreatorFollow', creatorFollowSchema);

// NFT Views Schema (tracks views for analytics)
const nftViewSchema = new mongoose.Schema(
  {
    nftId: {
      type: String,
      required: true,
      index: true
    },
    itemId: {
      type: String,
      required: true,
      index: true
    },
    contractAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'base', 'solana'],
      required: true,
      index: true
    },
    userWallet: {
      type: String,
      lowercase: true,
      default: null // null for anonymous views
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 5184000 // 60 days TTL for view records
    }
  },
  { timestamps: false }
);

nftViewSchema.index({ nftId: 1, createdAt: -1 });
nftViewSchema.index({ itemId: 1, network: 1, createdAt: -1 });

export const NFTView = mongoose.model('NFTView', nftViewSchema);

// Collection Views Schema
const collectionViewSchema = new mongoose.Schema(
  {
    collectionId: {
      type: String,
      required: true,
      index: true
    },
    collectionName: {
      type: String,
      required: true
    },
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'base', 'solana'],
      required: true,
      index: true
    },
    userWallet: {
      type: String,
      lowercase: true,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 5184000 // 60 days TTL
    }
  },
  { timestamps: false }
);

collectionViewSchema.index({ collectionId: 1, createdAt: -1 });

export const CollectionView = mongoose.model('CollectionView', collectionViewSchema);

// NFT Share Schema (tracks share activity)
const nftShareSchema = new mongoose.Schema(
  {
    nftId: {
      type: String,
      required: true,
      index: true
    },
    itemId: {
      type: String,
      required: true,
      index: true
    },
    contractAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'base', 'solana'],
      required: true,
      index: true
    },
    userWallet: {
      type: String,
      lowercase: true,
      default: null
    },
    shareMethod: {
      type: String,
      enum: ['twitter', 'facebook', 'linkedin', 'telegram', 'email', 'link_copy', 'other'],
      default: 'other'
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 5184000 // 60 days TTL
    }
  },
  { timestamps: false }
);

nftShareSchema.index({ nftId: 1, createdAt: -1 });

export const NFTShare = mongoose.model('NFTShare', nftShareSchema);

// Engagement Stats Summary Schema (aggregated stats)
const engagementStatsSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['nft', 'collection', 'creator'],
      required: true,
      index: true
    },
    entityId: {
      type: String,
      required: true,
      index: true
    },
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'base', 'solana'],
      default: null,
      index: true
    },
    likeCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    followCount: {
      type: Number,
      default: 0 // Only for creators
    },
    uniqueViewers: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

engagementStatsSchema.index({ entityType: 1, entityId: 1 });

export const EngagementStats = mongoose.model('EngagementStats', engagementStatsSchema);
