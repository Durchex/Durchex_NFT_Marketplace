import mongoose from "mongoose";
const Schema = mongoose.Schema;

// NFT schema definition
const nftSchema = new Schema(

  {
     collection: {
      type: String, // The name or ID of the NFT collection
      required: false,
    },
    network: {
      type: String, // Blockchain network (e.g., Ethereum, Polygon, Solana)
      required: true,
    },
    itemId: {
      type: String,
      required: true,
      unique: true,
    },
    // Smart Contract Integration (NEW)
    contractAddress: {
      type: String,
      required: false, // The ERC-721 contract address for this NFT's collection
      description: "Deployed ERC-721 contract address"
    },
    nftContract: {
      type: String,
      required: false, // Optional for unminted NFTs, set during minting
    },
    tokenId: {
      type: String,
      required: false, // Optional for unminted NFTs, set during minting
    },
    // Per-chain contract data (NEW)
    chainSpecificData: {
      type: Map,
      of: {
        contractAddress: String,
        tokenId: String,
        deploymentTx: String,
        deploymentBlock: Number,
        status: { type: String, enum: ['pending', 'deployed', 'failed'], default: 'pending' }
      },
      default: new Map(),
      description: "Contract and token data for each blockchain network"
    },
    // Deployment tracking (NEW)
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
    deploymentStatus: {
      type: String,
      enum: ['pending', 'deployed', 'failed'],
      default: 'pending',
      description: "Status of smart contract deployment"
    },
    owner: {
      type: String,
      required: true,
      description: "Canonical owner of the token (creator). Never overwritten by piece sales.",
    },
    creator: {
      type: String,
      required: false,
      description: "Creator wallet; used for royalty. If unset, owner is treated as creator.",
    },
    seller: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },

    // Optional floor price (starting / lowest listing price)
    floorPrice: {
      type: String,
      required: false,
      default: null,
      description: "Floor price for this NFT (if different from current listing price)",
    },
    // Market data (updated by buy/sell — liquidity in/out)
    lastPrice: {
      type: String,
      required: false,
      default: null,
      description: "Last trade price per piece (drives price movement)",
    },
    marketCap: {
      type: String,
      required: false,
      default: null,
      description: "lastPrice × pieces (or circulating); updated on trade",
    },
    volume24h: {
      type: String,
      required: false,
      default: "0",
      description: "Total volume (ETH) in last 24h from trades",
    },
    volume7d: {
      type: String,
      required: false,
      default: "0",
      description: "Total volume (ETH) in last 7 days from trades",
    },
    currentlyListed: {
      type: Boolean,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    properties: {
      type: Object,
      required: true,
    },
    metadataURI: {
      type: String,
      required: false, // Optional, set when NFT is created with IPFS metadata
      description: "IPFS URI containing the NFT metadata"
    },
    royalties: {
      type: Object,
    },
    // Minting status
    isMinted: {
      type: Boolean,
      default: false,
      description: "Whether the NFT has been minted on blockchain"
    },
    mintedAt: {
      type: Date,
      default: null
    },
    mintTxHash: {
      type: String,
      default: null
    },
    // Fee subsidy for users
    feeSubsidyEnabled: {
      type: Boolean,
      default: false,
      description: "Whether admin is subsidizing minting fees for this NFT"
    },
    feeSubsidyPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: "Percentage of network fee admin will cover (0-100)"
    },
    feeSubsidyRecipients: [{
      walletAddress: String,
      subsidy: String, // Amount in wei or native token
      claimed: Boolean,
      claimedAt: Date
    }],
    // Giveaway tracking
    isGiveaway: {
      type: Boolean,
      default: false
    },
    giveawayStatus: {
      type: String,
      enum: ['pending', 'offered', 'claimed', 'minted'],
      default: 'pending'
    },
    offeredTo: {
      type: String,
      default: null,
      description: "Wallet address the NFT is offered to"
    },
    giveawayClaimedAt: {
      type: Date,
      default: null,
      description: "When the user claimed the giveaway NFT"
    },
    adminNotes: {
      type: String,
      default: null
    },
    // Event launch timing
    eventStartTime: {
      type: Date,
      default: null,
      description: "When users can start minting and buying this NFT"
    },
    eventStatus: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
      description: "Current status of the event (before/during/after start time)"
    },
    // Admin moderation status
    adminStatus: {
      type: String,
      enum: ['active', 'delisted', 'flagged', 'pending_review'],
      default: 'active',
      description: "Admin moderation status of the NFT"
    },
    adminDelistedAt: {
      type: Date,
      default: null,
      description: "When admin delisted this NFT"
    },
    adminDelistedReason: {
      type: String,
      default: null,
      description: "Reason for admin delisting"
    },
    // Stock/Pieces feature for multiple copies of same NFT
    pieces: {
      type: Number,
      default: 1,
      min: 1,
      description: "Total number of pieces/copies of this NFT available"
    },
    remainingPieces: {
      type: Number,
      default: 1,
      min: 0,
      description: "Number of pieces still available (decremented with each sale)"
    },
    // Listing request tracking
    listingRequestStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
      description: "Status of listing request with admin"
    },
    listingRequestId: {
      type: String,
      default: null,
      description: "Reference to the listing request document"
    },
    lastListingRequestAt: {
      type: Date,
      default: null,
      description: "When the user last submitted a listing request"
    }
  },
  { timestamps: true }
);

// Performance-critical indexes
// These directly support the hottest queries used by the marketplace:
// - fetchAllNftsByNetwork:       { network, currentlyListed }
// - fetchAllNftsByNetworkExplore:{ network, adminStatus }
// - fetchCollectionNfts:         { network, collection }
// - user/owner lookups:          { owner, network }
nftSchema.index({ network: 1, currentlyListed: 1 });
nftSchema.index({ network: 1, adminStatus: 1 });
nftSchema.index({ network: 1, collection: 1 });
nftSchema.index({ owner: 1, network: 1 });

// Model
export const nftModel = mongoose.model("NFT", nftSchema);

// Utility functions
export const getNfts = () => nftModel.find();
export const getNftByItemId = (itemId) => nftModel.findOne({ itemId });
export const createNft = async (values) => {
  const nft = new nftModel(values);
  await nft.save();
  return nft.toObject();
};
export const deleteNftByItemId = (itemId) =>
  nftModel.findOneAndDelete({ itemId });

export const updateNftByItemId = (itemId, values, newOption = true) =>
  nftModel.findOneAndUpdate({ itemId }, values, { new: newOption });
