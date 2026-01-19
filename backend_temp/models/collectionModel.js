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
    // Smart Contract Deployment (NEW)
    contractDeploymentStatus: {
      type: String,
      enum: ['pending', 'deployed', 'failed'],
      default: 'pending',
      description: "Status of the contract deployment"
    },
    contractDeploymentTx: {
      type: String,
      default: null,
      description: "Transaction hash of contract deployment"
    },
    contractDeploymentBlock: {
      type: Number,
      default: null,
      description: "Block number where contract was deployed"
    },
    contractAddress: {
      type: String,
      lowercase: true,
      index: true
    },
    // Per-chain contract tracking (NEW)
    chainContracts: {
      type: Map,
      of: {
        contractAddress: String,
        deploymentTx: String,
        deploymentBlock: Number,
        status: { type: String, enum: ['pending', 'deployed', 'failed'], default: 'pending' },
        deployedAt: Date
      },
      default: new Map(),
      description: "Contract deployments for each blockchain"
    },
    contractABI: {
      type: Object,
      default: null,
      description: "ABI of the deployed contract"
    },
    isContractVerified: {
      type: Boolean,
      default: false,
      description: "Whether the contract is verified on block explorer"
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
