import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const depositSchema = new Schema({
  network: { type: String, required: true, lowercase: true },
  wallet: { type: String, required: true, lowercase: true, index: true },
  tokenAddress: { type: String, required: true, lowercase: true },
  amount: { type: String, required: true }, // raw token amount as string (human readable)
  amountRaw: { type: String, required: false }, // smallest unit
  tokenDecimals: { type: Number, default: 6 },
  chipsAwarded: { type: Number, required: true },
  transactionHash: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending','verified','failed'], default: 'pending' },
}, { timestamps: true });

depositSchema.index({ wallet: 1, status: 1, createdAt: -1 });

export const depositModel = mongoose.model('Deposit', depositSchema);
