import mongoose from "mongoose";

const Schema = mongoose.Schema;

/**
 * Collector sell order: "I am selling N pieces of this NFT at price X."
 * This is selling back liquidity to the NFT — the pieces re-enter the pool for others to buy.
 */
const pieceSellOrderSchema = new Schema(
  {
    network: { type: String, required: true, lowercase: true },
    itemId: { type: String, required: true },
    seller: { type: String, required: true, lowercase: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerPiece: { type: String, required: true }, // wei or decimal string
    status: {
      type: String,
      enum: ["active", "filled", "partially_filled", "cancelled"],
      default: "active",
    },
    filledQuantity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pieceSellOrderSchema.index({ network: 1, itemId: 1, status: 1 });
pieceSellOrderSchema.index({ seller: 1, status: 1 });

export const pieceSellOrderModel = mongoose.model("PieceSellOrder", pieceSellOrderSchema);
