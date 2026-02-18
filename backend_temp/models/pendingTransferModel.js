import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const pendingTransferSchema = new Schema({
  type: { type: String, required: true },
  network: { type: String, required: true, lowercase: true },
  itemId: { type: String, required: false },
  buyer: { type: String, required: false, lowercase: true },
  seller: { type: String, required: false, lowercase: true },
  quantity: { type: Number, default: 1 },
  pricePerPiece: { type: String, default: null },
  transactionHash: { type: String, default: null, index: true },
  status: { type: String, enum: ['pending','processing','done','failed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: { type: Date, default: null },
}, { timestamps: true });

pendingTransferSchema.index({ status: 1, createdAt: 1 });

export const PendingTransfer = mongoose.model('PendingTransfer', pendingTransferSchema);
