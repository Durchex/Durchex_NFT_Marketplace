#!/usr/bin/env node
import mongoose from 'mongoose';
import { ethers } from 'ethers';
import { PendingTransfer } from '../models/pendingTransferModel.js';
import { pieceHoldingModel } from '../models/pieceHoldingModel.js';
import { nftTradeModel } from '../models/nftTradeModel.js';
import { nftModel } from '../models/nftModel.js';
import LazyNFT from '../models/lazyNFTModel.js';

const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE;
if (!MONGO) {
  console.error('MONGODB_URI / DATABASE env required');
  process.exit(2);
}

async function processEntry(key, entry) {
  try {
    const net = String(entry.network || 'base').toLowerCase();
    const rpcUrl = process.env[`${String(net).toUpperCase()}_RPC_URL`] || process.env.RPC_URL || process.env.VITE_APP_WEB3_PROVIDER || process.env.BASE_RPC_URL || null;
    if (!rpcUrl) return false;
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const txHash = entry.transactionHash;
    if (!txHash) return false;
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) return false;

    const iface = new ethers.utils.Interface(['event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)']);

    if (entry.type === 'pool_purchase') {
      const itemId = String(entry.itemId);
      const buyer = String(entry.buyer).toLowerCase();
      // find liquidityPieceId from nft or lazy
      const nft = await nftModel.findOne({ network: net, itemId }).lean();
      let liquidityPieceId = nft?.liquidityPieceId != null ? String(nft.liquidityPieceId) : null;
      if (!liquidityPieceId && /^[a-fA-F0-9]{24}$/.test(itemId)) {
        const lazy = await LazyNFT.findById(itemId).lean();
        if (lazy) liquidityPieceId = lazy.liquidityPieceId != null ? String(lazy.liquidityPieceId) : null;
      }
      if (!liquidityPieceId) return false;

      let seen = false;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === 'TransferSingle') {
            const to = String(parsed.args.to).toLowerCase();
            const id = parsed.args.id.toString();
            if (to === buyer && id === liquidityPieceId) {
              seen = true; break;
            }
          }
        } catch (e) {}
      }
      if (!seen) return false;
      // update holdings by reading on-chain balance
      // find pieces contract address
      const piecesAddr = nft?.liquidityContract || null;
      if (!piecesAddr) {
        const lazy = await LazyNFT.findById(itemId).lean();
        if (lazy) piecesAddr = lazy.liquidityContract || null;
      }
      if (!piecesAddr) return false;
      const contract = new ethers.Contract(piecesAddr, ['function balanceOf(address,uint256) view returns (uint256)'], provider);
      const bn = await contract.balanceOf(buyer, liquidityPieceId);
      const pieces = bn.toNumber();
      await pieceHoldingModel.findOneAndUpdate({ network: net, itemId, wallet: buyer }, { $set: { pieces } }, { upsert: true });

      // create trade if not present
      await nftTradeModel.create({ network: net, itemId, transactionType: 'primary_buy', seller: entry.seller || null, buyer, quantity: entry.quantity || 1, pricePerPiece: String(entry.pricePerPiece || 0), totalAmount: String((entry.pricePerPiece || 0) * (entry.quantity || 1)), transactionHash: txHash });

      return true;
    }

    if (entry.type === 'lazy_purchase') {
      const itemId = String(entry.itemId);
      const buyer = String(entry.buyer).toLowerCase();
      const lazy = await LazyNFT.findById(itemId).lean();
      const liquidityPieceId = lazy?.liquidityPieceId != null ? String(lazy.liquidityPieceId) : null;
      const piecesAddr = lazy?.liquidityContract || null;
      if (!liquidityPieceId || !piecesAddr) return false;
      let seen = false;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === 'TransferSingle') {
            const to = String(parsed.args.to).toLowerCase();
            const id = parsed.args.id.toString();
            if (to === buyer && id === liquidityPieceId) { seen = true; break; }
          }
        } catch (e) {}
      }
      if (!seen) return false;
      const contract = new ethers.Contract(piecesAddr, ['function balanceOf(address,uint256) view returns (uint256)'], provider);
      const bn = await contract.balanceOf(buyer, liquidityPieceId);
      const pieces = bn.toNumber();
      await pieceHoldingModel.findOneAndUpdate({ network: net, itemId, wallet: buyer }, { $set: { pieces } }, { upsert: true });
      await nftTradeModel.create({ network: net, itemId, transactionType: 'primary_buy', seller: entry.seller || null, buyer, quantity: entry.quantity || 1, pricePerPiece: String(entry.pricePerPiece || 0), totalAmount: String((entry.pricePerPiece || 0) * (entry.quantity || 1)), transactionHash: txHash });
      return true;
    }

    return false;
  } catch (e) {
    console.error('Error processing pending entry', key, e.message || e);
    return false;
  }
}

async function main() {
  await mongoose.connect(MONGO);
  console.log('Connected to Mongo, processing pending transfers...');
  setInterval(async () => {
    try {
      const list = await PendingTransfer.find({ status: 'pending' }).limit(50).lean();
      for (const rec of list) {
        try {
          // lock the record for processing
          const locked = await PendingTransfer.findByIdAndUpdate(rec._id, { $set: { status: 'processing', lastAttemptAt: new Date() }, $inc: { attempts: 1 } }, { new: true });
          if (!locked) continue;
          const ok = await processEntry(String(locked._id), locked);
          if (ok) {
            await PendingTransfer.findByIdAndUpdate(locked._id, { $set: { status: 'done' } });
            console.log('Processed pending', locked._id.toString());
          } else {
            // mark back to pending for retry, unless attempts exceeded
            if ((locked.attempts || 0) >= 5) {
              await PendingTransfer.findByIdAndUpdate(locked._id, { $set: { status: 'failed' } });
              console.log('Pending marked failed', locked._id.toString());
            } else {
              await PendingTransfer.findByIdAndUpdate(locked._id, { $set: { status: 'pending' } });
            }
          }
        } catch (e) {
          console.error('Error processing pending record', rec._id, e.message || e);
        }
      }
    } catch (e) {
      console.error('Error in pending processor loop', e.message || e);
    }
  }, 15 * 1000);
}

main().catch((e) => { console.error(e); process.exit(1); });
