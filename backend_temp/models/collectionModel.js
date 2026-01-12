import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    collectionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    creatorWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    creatorName: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: null
    },
    coverPhoto: {
      type: String,
      default: null
    },
    banner: {
      type: String,
      default: null
    },
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'base', 'solana'],
      required: true,
      index: true
    },
    contractAddress: {
      type: String,
      lowercase: true,
      index: true
    },
    totalItems: {
      type: Number,
      default: 0
    },
    floorPrice: {
      type: String,
      default: '0'
    },
    currency: {
      type: String,
      default: 'ETH'
    },
    royalty: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    socialLinks: {
      website: String,
      twitter: String,
      discord: String,
      instagram: String
    },
    attributes: [
      {
        trait: String,
        value: String,
        count: Number
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
collectionSchema.index({ creatorWallet: 1, network: 1 });
collectionSchema.index({ network: 1, name: 1 });

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;
