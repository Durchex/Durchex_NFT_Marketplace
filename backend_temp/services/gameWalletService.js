import { nftUserModel } from '../models/userModel.js';

/**
 * Atomic deduct: only succeeds if balance >= amount. Returns updated user or null.
 */
export async function atomicDeduct(walletAddress, amount) {
  const w = (walletAddress || '').toLowerCase();
  const amt = Math.max(0, Number(amount) || 0);
  if (amt <= 0) return null;
  const user = await nftUserModel.findOneAndUpdate(
    { walletAddress: w, gameBalance: { $gte: amt } },
    { $inc: { gameBalance: -amt } },
    { new: true }
  ).lean();
  return user;
}

/**
 * Credit payout to wallet.
 */
export async function creditPayout(walletAddress, payout) {
  const w = (walletAddress || '').toLowerCase();
  const amount = Math.max(0, Number(payout) || 0);
  if (amount <= 0) return null;
  const user = await nftUserModel.findOneAndUpdate(
    { walletAddress: w },
    { $inc: { gameBalance: amount } },
    { new: true, upsert: true }
  ).lean();
  return user;
}
