#!/usr/bin/env node
/*
 Reconcile pieceHoldings by scanning an NftPieces (ERC-1155) contract's
 TransferSingle events and rebuilding aggregated holdings per wallet/itemId.

 Usage:
   NODE_ENV=production MONGODB_URI="mongodb://..." RPC_URL="https://mainnet.base.org" \
     node scripts/reconcilePieceHoldings.js --pieces 0x40aE4EAd2a2031120c08C84f2da1d6BeA13e5afE \
     --from-block 0 --to-block latest --batch-size 5000

 The script requires network access to the RPC and MongoDB. It will upsert
 entries into the `pieceholdings` collection (same shape as backend model).
 It prints progress and a summary of changes.
*/

import { ethers } from 'ethers';
import mongoose from 'mongoose';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('pieces', { type: 'string', demandOption: true, describe: 'NftPieces contract address' })
  .option('rpc', { type: 'string', default: process.env.RPC_URL, describe: 'RPC URL' })
  .option('from-block', { type: 'number', default: 0 })
  .option('to-block', { type: 'string', default: 'latest' })
  .option('batch-size', { type: 'number', default: 5000 })
  .option('mongo', { type: 'string', default: process.env.MONGODB_URI, describe: 'MongoDB URI' })
  .help()
  .argv;

if (!argv.mongo) {
  console.error('Missing MongoDB URI. Set --mongo or MONGODB_URI env var');
  process.exit(2);
}
if (!argv.rpc) {
  console.error('Missing RPC URL. Set --rpc or RPC_URL env var');
  process.exit(2);
}

const provider = new ethers.providers.JsonRpcProvider(argv.rpc);

// Minimal ABI for TransferSingle and balanceOf
const NftPieces_ABI = [
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function liquidityContract() view returns (address)',
];

const piecesAddress = ethers.utils.getAddress(argv.pieces);
const contract = new ethers.Contract(piecesAddress, NftPieces_ABI, provider);

// Mongoose schema (minimal) matching backend `pieceHoldingModel`
const pieceHoldingSchema = new mongoose.Schema({
  network: { type: String, required: true, lowercase: true },
  itemId: { type: String, required: true },
  wallet: { type: String, required: true, lowercase: true },
  pieces: { type: Number, required: true, min: 0, default: 0 },
}, { timestamps: true });

let PieceHolding;

async function connectMongo() {
  await mongoose.connect(argv.mongo);
  PieceHolding = mongoose.models.PieceHolding || mongoose.model('PieceHolding', pieceHoldingSchema);
}

async function getBlockNumber(tag) {
  if (tag === 'latest') return await provider.getBlockNumber();
  return Number(tag);
}

async function aggregateFromEvents(fromBlock, toBlock) {
  console.log(`Scanning TransferSingle events ${fromBlock} -> ${toBlock} on ${piecesAddress}`);
  const filter = contract.filters.TransferSingle();
  const logs = await contract.queryFilter(filter, fromBlock, toBlock);
  console.log(`Found ${logs.length} TransferSingle logs in range`);

  // Map key = wallet|pieceId, value = net pieces (incoming - outgoing)
  const map = new Map();
  for (const l of logs) {
    try {
      const parsed = contract.interface.parseLog(l);
      const { from, to, id, value } = parsed.args;
      const idStr = id.toString();
      const val = Number(value.toString());

      // outgoing from (decrement)
      if (from && from !== ethers.constants.AddressZero) {
        const key = `${from.toLowerCase()}|${idStr}`;
        map.set(key, (map.get(key) || 0) - val);
      }
      // incoming to (increment)
      if (to && to !== ethers.constants.AddressZero) {
        const key = `${to.toLowerCase()}|${idStr}`;
        map.set(key, (map.get(key) || 0) + val);
      }
    } catch (e) {
      // ignore
    }
  }
  return map;
}

async function reconcileRange(fromBlock, toBlock) {
  const map = await aggregateFromEvents(fromBlock, toBlock);

  // For each wallet|id, compute on-chain balance via balanceOf and upsert into DB
  let updated = 0;
  for (const [key, _] of map) {
    const [wallet, pieceId] = key.split('|');
    // read on-chain balance
    let bn = ethers.BigNumber.from(0);
    try {
      bn = await contract.balanceOf(wallet, pieceId);
    } catch (err) {
      console.warn('balanceOf failed for', wallet, pieceId, err.message || err);
      continue;
    }
    const pieces = bn.toNumber();

    // Upsert into DB. Network unknown here; default to 'base' if RPC looks like base
    const network = argv.rpc.includes('base') ? 'base' : 'unknown';
    await PieceHolding.findOneAndUpdate(
      { network, itemId: pieceId, wallet },
      { $set: { pieces } },
      { upsert: true }
    );
    updated++;
  }

  console.log(`Reconciled ${updated} wallet/piece entries in DB`);
}

async function main() {
  try {
    console.log('Connecting to Mongo...');
    await connectMongo();
    console.log('Connected to Mongo');

    const fromBlock = Number(argv['from-block'] || 0);
    let toBlock = argv['to-block'];
    if (toBlock === 'latest') toBlock = await getBlockNumber('latest');
    else toBlock = Number(toBlock);

    const batch = Number(argv['batch-size'] || 5000);
    let current = fromBlock;
    while (current <= toBlock) {
      const end = Math.min(current + batch - 1, toBlock);
      console.log(`Processing blocks ${current}..${end}`);
      await reconcileRange(current, end);
      current = end + 1;
    }

    console.log('Reconciliation complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during reconcile:', err);
    process.exit(1);
  }
}

main();
