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
    nftContract: {
      type: String,
      required: true,
    },
    tokenId: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    seller: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
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
    adminNotes: {
      type: String,
      default: null
    },
  },
  { timestamps: true }
);

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
