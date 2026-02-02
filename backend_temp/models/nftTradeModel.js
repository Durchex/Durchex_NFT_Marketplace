import mongoose from "mongoose";
const Schema = mongoose.Schema;

/**
 * Records each buy/sell of NFT pieces (liquidity in/out).
 * Drives: transaction history, price movement, volume, market cap.
 */
const nftTradeSchema = new Schema(
  {
    network: { type: String, required: true, lowercase: true, index: true },
    itemId: { type: String, required: true, index: true },
    transactionType: {
      type: String,
      enum: ["primary_buy", "secondary_buy"],
      required: true,
      index: true,
    },
    seller: { type: String, required: true, lowercase: true, index: true },
    buyer: { type: String, required: true, lowercase: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerPiece: { type: String, required: true },
    totalAmount: { type: String, required: true },
    transactionHash: { type: String, default: null, index: true },
    blockTimestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

nftTradeSchema.index({ network: 1, itemId: 1, createdAt: -1 });
nftTradeSchema.index({ buyer: 1, createdAt: -1 });
nftTradeSchema.index({ seller: 1, createdAt: -1 });

export const nftTradeModel = mongoose.model("NftTrade", nftTradeSchema);
