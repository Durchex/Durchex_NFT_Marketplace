import mongoose from "mongoose";

const Schema = mongoose.Schema;

/**
 * Tracks how many pieces of an NFT each wallet holds.
 * The NFT token has one canonical owner (creator); collectors own "pieces" (editions).
 */
const pieceHoldingSchema = new Schema(
  {
    network: { type: String, required: true, lowercase: true },
    itemId: { type: String, required: true },
    wallet: { type: String, required: true, lowercase: true },
    pieces: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

pieceHoldingSchema.index({ network: 1, itemId: 1, wallet: 1 }, { unique: true });
pieceHoldingSchema.index({ wallet: 1, network: 1 });

export const pieceHoldingModel = mongoose.model("PieceHolding", pieceHoldingSchema);
