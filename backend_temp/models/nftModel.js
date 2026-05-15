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
    // Creator royalty in basis points (e.g. 1000 = 10%). Used by executeSale to
    // split secondary-sale proceeds: creator gets royaltyBps, platform gets
    // platformFeeBps, seller gets the rest.
    royaltyBps: {
      type: Number,
      default: 0,
      min: 0,
      max: 5000, // 50% cap
      description: "Creator royalty in basis points on secondary sales"
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
    },
    // Upcoming/whitelist mint phase (creator schedules a launch ahead of time).
    isUpcoming: {
      type: Boolean,
      default: false,
      index: true,
      description: "True if this NFT is in pre-public/whitelist phase"
    },
    whitelistMode: {
      type: String,
      enum: ['open', 'allowlist'],
      default: 'open',
      description: "'open' = any wallet can mint at whitelistPrice. 'allowlist' = only whitelistAddresses can mint."
    },
    whitelistPrice: {
      type: String,
      default: '0',
      description: "Pre-public mint price in wei. '0' means free."
    },
    whitelistAddresses: {
      type: [String],
      default: [],
      description: "Lowercase wallet addresses allowed to mint during whitelist phase (allowlist mode only)"
    },
    maxPerWalletWhitelist: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
      description: "Max pieces a single wallet can mint during whitelist phase. 0 = unlimited."
    },
    maxPerWalletPublic: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
      description: "Max pieces a single wallet can mint during public phase. 0 = unlimited."
    },
    // Wallet → cumulative pieces minted by that wallet on this listing.
    mintedByWallet: {
      type: Map,
      of: Number,
      default: {},
      description: "Per-wallet mint counter, keyed by lowercase wallet address"
    },
    mintingFee: {
      type: String,
      default: '0',
      description: "Additive fee paid by buyer on every mint, goes to creator (on top of price)"
    },
    publicLaunchAt: {
      type: Date,
      default: null,
      index: true,
      description: "When the NFT transitions from whitelist phase to public sale"
    },
    publicPrice: {
      type: String,
      default: null,
      description: "Mint price after publicLaunchAt. If null, NFT stays in whitelist phase until creator sets it."
    },
    isPublic: {
      type: Boolean,
      default: false,
      description: "Derived: true once publicLaunchAt has passed AND publicPrice is set"
    },
    // Creator-signed vouchers for each phase. Required so MultiPieceLazyMintNFT.redeemListing
    // can verify the creator authorized this specific price+supply combination.
    // pricePerPieceWei in each voucher = (phase price + mintingFee), denominated in wei.
    whitelistVoucher: {
      pricePerPieceWei: { type: String, default: null },
      royaltyBps: { type: Number, default: 0 },
      uri: { type: String, default: null },
      maxSupply: { type: Number, default: 1 },
      messageHash: { type: String, default: null },
      signature: { type: String, default: null },
      signedAt: { type: Date, default: null },
    },
    publicVoucher: {
      pricePerPieceWei: { type: String, default: null },
      royaltyBps: { type: Number, default: 0 },
      uri: { type: String, default: null },
      maxSupply: { type: Number, default: 1 },
      messageHash: { type: String, default: null },
      signature: { type: String, default: null },
      signedAt: { type: Date, default: null },
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

export default nftModel;
