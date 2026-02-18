#!/usr/bin/env node
import mongoose from 'mongoose';
import { ethers } from 'ethers';
import { pieceHoldingModel } from '../models/pieceHoldingModel.js';

const RPC = process.argv[2] || process.env.RPC_URL || process.env.BASE_RPC_URL || process.env.VITE_APP_WEB3_PROVIDER || 'https://mainnet.base.org';
const PIECES = process.argv[3] || process.env.PIECES_CONTRACT || process.env.NFT_PIECES_ADDRESS;
const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE;
const BATCH = parseInt(process.argv[4] || process.env.BATCH_SIZE || '5000', 10);
const START = process.argv[5] || process.env.START_BLOCK || '0';

if (!PIECES) {
  console.error('Usage: node transferIndexer.js <rpc> <piecesAddress> [batchSize] [startBlock]');
  process.exit(2);
}
if (!MONGO) {
  console.error('MONGODB_URI / DATABASE env required');
  process.exit(2);
}

const provider = new ethers.providers.JsonRpcProvider(RPC);
const iface = new ethers.utils.Interface(['event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)','function balanceOf(address,uint256) view returns (uint256)']);
const piecesAddr = ethers.utils.getAddress(PIECES);

async function upsertFromLogs(fromBlock, toBlock) {
  console.log(`Scanning ${fromBlock}..${toBlock}`);
  const filter = { address: piecesAddr, fromBlock, toBlock, topics: [ethers.utils.id('TransferSingle(address,address,address,uint256,uint256)')] };
  const logs = await provider.getLogs(filter);
  console.log('Found', logs.length, 'logs');
  const checks = new Map();
  for (const l of logs) {
    try {
      const parsed = iface.parseLog(l);
      const from = String(parsed.args.from).toLowerCase();
      const to = String(parsed.args.to).toLowerCase();
      const id = parsed.args.id.toString();
      if (from && from !== ethers.constants.AddressZero) checks.set(`${from}|${id}`, { wallet: from, id });
      if (to && to !== ethers.constants.AddressZero) checks.set(`${to}|${id}`, { wallet: to, id });
    } catch (e) {}
  }
  for (const [k, v] of checks) {
    try {
      const bn = await provider.call({ to: piecesAddr, data: iface.encodeFunctionData('balanceOf', [v.wallet, v.id]) });
      const pieces = ethers.BigNumber.from(bn).toNumber();
      await pieceHoldingModel.findOneAndUpdate({ network: 'base', itemId: String(v.id), wallet: v.wallet }, { $set: { pieces } }, { upsert: true });
      console.log('Upserted', v.wallet, v.id, pieces);
    } catch (e) {
      console.warn('balanceOf failed for', v.wallet, v.id, e.message || e);
    }
  }
}

async function main() {
  await mongoose.connect(MONGO);
  const latest = await provider.getBlockNumber();
  let current = Number(START) || 0;
  while (current <= latest) {
    const end = Math.min(current + BATCH - 1, latest);
    await upsertFromLogs(current, end);
    current = end + 1;
  }
  console.log('Indexing complete');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
