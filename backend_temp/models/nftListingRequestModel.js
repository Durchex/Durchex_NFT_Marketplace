import mongoose from 'mongoose';

const nftListingRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    requesterWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    requesterName: {
      type: String,
      required: true
    },
    requesterProfilePicture: {
      type: String,
      default: null
    },
    targetCreatorWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    targetCreatorName: {
      type: String,
      required: true
    },
    nftDetails: {
      name: {
        type: String,
        required: true
      },
      description: {
        type: String,
        default: ''
      },
      image: {
        type: String,
        default: null
      },
      collectionName: {
        type: String,
        default: 'Uncategorized'
      },
      royalty: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      attributes: [
        {
          trait: String,
          value: String
        }
      ]
    },
    requestMessage: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvalNotes: {
      type: String,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from creation
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
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

// TTL index to auto-delete expired requests after 30 days
nftListingRequestSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Compound index for efficient queries
nftListingRequestSchema.index({ targetCreatorWallet: 1, status: 1 });
nftListingRequestSchema.index({ requesterWallet: 1, status: 1 });

const NFTListingRequest = mongoose.model('NFTListingRequest', nftListingRequestSchema);

export default NFTListingRequest;
