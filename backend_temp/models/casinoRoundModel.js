import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const casinoRoundSchema = new Schema(
  {
    walletAddress: { type: String, required: true, lowercase: true, index: true },
    gameId: { type: String, required: true, index: true },
    bet: { type: Number, required: true, min: 0 },
    payout: { type: Number, required: true, min: 0 },
    serverSeedHash: { type: String, required: true },
    serverSeed: { type: String, default: null },
    clientSeed: { type: String, required: true },
    nonce: { type: Number, required: true },
    outcome: { type: Schema.Types.Mixed, required: true },
    verificationHash: { type: String },
    status: { type: String, enum: ['resolved', 'pending_cashout'], default: 'resolved' },
  },
  { timestamps: true }
);

casinoRoundSchema.index({ walletAddress: 1, createdAt: -1 });
casinoRoundSchema.index({ gameId: 1, createdAt: -1 });

export const casinoRoundModel = mongoose.model('CasinoRound', casinoRoundSchema);

export async function createRound(data) {
  const doc = new casinoRoundModel(data);
  await doc.save();
  return doc.toObject();
}

export async function findRoundById(id) {
  const doc = await casinoRoundModel.findById(id).lean();
  return doc;
}

export async function findRoundsByWallet(walletAddress, limit = 50) {
  const docs = await casinoRoundModel.find({ walletAddress: walletAddress?.toLowerCase?.() }).sort({ createdAt: -1 }).limit(limit).lean();
  return docs;
}

export async function updateRoundRevealSeed(roundId, serverSeed) {
  const doc = await casinoRoundModel.findByIdAndUpdate(roundId, { serverSeed }, { new: true }).lean();
  return doc;
}
