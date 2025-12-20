#!/bin/bash

# Update backend_temp NFT model for unminted NFTs
echo "🔧 Updating backend_temp NFT model for unminted NFTs..."

# Path to the backend_temp directory on the server
BACKEND_PATH="/home/durchex/htdocs/durchex.com/backend_temp"

# Check if backend_temp exists
if [ ! -d "$BACKEND_PATH" ]; then
    echo "❌ backend_temp directory not found at $BACKEND_PATH"
    exit 1
fi

# Navigate to backend_temp
cd "$BACKEND_PATH"

# Backup the current model
cp models/nftModel.js models/nftModel.js.backup.$(date +%Y%m%d_%H%M%S)

# Update the NFT model to make nftContract and tokenId optional
cat > models/nftModel.js << 'EOF'
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
      required: false, // Optional for unminted NFTs, set during minting
    },
    tokenId: {
      type: String,
      required: false, // Optional for unminted NFTs, set during minting
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
EOF

echo "✅ NFT model updated successfully!"
echo "🔄 Restarting backend_temp server..."

# Restart the backend_temp server
pkill -f "node.*server.js" || true
sleep 2

# Start the backend_temp server
cd "$BACKEND_PATH"
npm start &

echo "✅ Backend_temp server restarted!"
echo "🎉 NFT creation should now work for unminted NFTs!"
echo ""
echo "Test by creating an NFT - it should save to database without requiring nftContract and tokenId."