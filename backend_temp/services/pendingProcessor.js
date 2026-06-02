#!/usr/bin/env node
/**
 * Background service that retries pending NFT purchase records.
 *
 * When a buyer's tx hash isn't available at purchase time (network lag, RPC timeout)
 * the controller stores a PendingTransfer and returns 202. This processor polls every
 * 15 s, re-checks each pending entry against the chain, and finalises the DB state once
 * the receipt is available and the Transfer event is confirmed.
 *
 * Start via PM2: ecosystem.config.cjs → durchex-pending-processor
 */
import mongoose from 'mongoose';
import { ethers } from 'ethers';
import { PendingTransfer } from '../models/pendingTransferModel.js';
import { pieceHoldingModel } from '../models/pieceHoldingModel.js';
import { nftTradeModel } from '../models/nftTradeModel.js';
import { nftModel } from '../models/nftModel.js';
import LazyNFT from '../models/lazyNFTModel.js';

const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE;
if (!MONGO) {
  console.error('[pendingProcessor] MONGODB_URI / DATABASE env required');
  process.exit(2);
}

const ERC1155_IFACE = new ethers.utils.Interface([
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
]);
const ERC721_IFACE = new ethers.utils.Interface([
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
]);

/** Returns true if the receipt contains a Transfer to `buyerAddr` (ERC721 or ERC1155). */
function transferToBuyerSeen(receipt, buyerAddr) {
  const buyer = buyerAddr.toLowerCase();
  for (const log of receipt.logs) {
    try { if (String(ERC1155_IFACE.parseLog(log).args.to).toLowerCase() === buyer) return true; } catch (_) {}
    try { if (String(ERC721_IFACE.parseLog(log).args.to).toLowerCase() === buyer) return true; } catch (_) {}
  }
  return false;
}

function getRpcUrl(network) {
  const net = String(network || 'base').toUpperCase();
  return process.env[`${net}_RPC_URL`]
    || process.env.RPC_URL
    || process.env.BASE_RPC_URL
    || null;
}

async function processEntry(entry) {
  const net = String(entry.network || 'base').toLowerCase();
  const rpcUrl = getRpcUrl(net);
  if (!rpcUrl) return false;

  const txHash = entry.transactionHash;
  if (!txHash) return false;

  let receipt;
  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    receipt = await provider.getTransactionReceipt(txHash);
  } catch (e) {
    console.warn(`[pendingProcessor] RPC error for ${txHash}:`, e.message);
    return false;
  }
  if (!receipt || receipt.status !== 1) return false;

  if (entry.type === 'lazy_purchase') {
    const itemId  = String(entry.itemId);
    const buyer   = String(entry.buyer).toLowerCase();
    const qty     = Number(entry.quantity) || 1;

    if (!transferToBuyerSeen(receipt, buyer)) return false;

    const lazy = await LazyNFT.findById(itemId).lean();
    if (!lazy) return false;

    // Upsert piece holding
    await pieceHoldingModel.findOneAndUpdate(
      { network: net, itemId, wallet: buyer },
      { $inc: { pieces: qty } },
      { upsert: true, new: true }
    );

    // Create trade record (idempotent — skip if txHash already recorded)
    const alreadyRecorded = await nftTradeModel.findOne({ transactionHash: txHash }).lean();
    if (!alreadyRecorded) {
      const pricePerPiece = String(entry.pricePerPiece || lazy.price || '0');
      const totalAmount   = (parseFloat(pricePerPiece) * qty).toFixed(18);
      const royaltyPct    = Number(lazy.royaltyPercentage || 0);
      const royaltyAmt    = royaltyPct ? ((parseFloat(totalAmount) * royaltyPct) / 100).toFixed(18) : '0';
      await nftTradeModel.create({
        network: net,
        itemId,
        transactionType: 'primary_buy',
        seller: (lazy.creator || '').toLowerCase(),
        buyer,
        quantity: qty,
        pricePerPiece,
        totalAmount,
        royaltyPercentage: String(royaltyPct),
        royaltyAmount: royaltyAmt,
        transactionHash: txHash,
      });
      // Update last traded price on the lazy NFT
      await LazyNFT.updateOne({ _id: itemId }, { $set: { lastPrice: pricePerPiece } });
    }

    return true;
  }

  return false;
}

async function runCycle() {
  const pending = await PendingTransfer.find({ status: 'pending' }).limit(50).lean();
  for (const rec of pending) {
    try {
      // Atomic lock to prevent duplicate processing
      const locked = await PendingTransfer.findOneAndUpdate(
        { _id: rec._id, status: 'pending' },
        { $set: { status: 'processing', lastAttemptAt: new Date() }, $inc: { attempts: 1 } },
        { new: true }
      );
      if (!locked) continue; // another instance grabbed it

      const ok = await processEntry(locked);
      if (ok) {
        await PendingTransfer.findByIdAndUpdate(locked._id, { $set: { status: 'done' } });
        console.log(`[pendingProcessor] ✅ Processed ${locked._id} (${locked.type})`);
      } else if ((locked.attempts || 0) >= 5) {
        await PendingTransfer.findByIdAndUpdate(locked._id, { $set: { status: 'failed' } });
        console.warn(`[pendingProcessor] ❌ Giving up on ${locked._id} after 5 attempts`);
      } else {
        await PendingTransfer.findByIdAndUpdate(locked._id, { $set: { status: 'pending' } });
      }
    } catch (e) {
      console.error(`[pendingProcessor] Error on record ${rec._id}:`, e.message || e);
      try { await PendingTransfer.findByIdAndUpdate(rec._id, { $set: { status: 'pending' } }); } catch (_) {}
    }
  }
}

async function main() {
  await mongoose.connect(MONGO);
  console.log('[pendingProcessor] Connected to MongoDB — polling every 15s');
  await runCycle(); // run once immediately on start
  setInterval(runCycle, 15_000);
}

main().catch((e) => { console.error('[pendingProcessor] Fatal:', e); process.exit(1); });
