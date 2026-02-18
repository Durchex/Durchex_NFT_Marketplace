#!/usr/bin/env node
import mongoose from 'mongoose';
import { ethers } from 'ethers';

const argv = process.argv.slice(2);
if (argv.length < 1) {
  console.error('Usage: node scripts/reconcileWalletHoldings.js <wallet> [rpc] [mongo]');
  process.exit(2);
}
const wallet = String(argv[0]).toLowerCase();
const rpc = argv[1] || process.env.RPC_URL || 'https://mainnet.base.org';
const mongo = argv[2] || process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE;
if (!mongo) {
  console.error('Missing MongoDB URI. Set env MONGODB_URI or pass as 3rd arg.');
  process.exit(2);
}

const provider = new ethers.providers.JsonRpcProvider(rpc);

async function main() {
  console.log('Connecting to Mongo...');
  await mongoose.connect(mongo);
  const db = mongoose.connection.db;
  console.log('Connected. Fetching pieceHoldings for', wallet);

  const pieceColl = db.collection('pieceholdings');
  const nftsColl = db.collection('nfts');
  const lazyColl = db.collection('lazy_nfts');

  const holdings = await pieceColl.find({ wallet: wallet }).toArray();
  if (!holdings || holdings.length === 0) {
    console.log('No pieceHoldings found for wallet', wallet);
    process.exit(0);
  }

  console.log('Found', holdings.length, 'holding rows. Reconciling each...');
  const summary = [];
  for (const h of holdings) {
    const network = (h.network || 'base').toLowerCase();
    const itemId = String(h.itemId);
    let liquidityContract = null;
    let liquidityPieceId = null;

    const nftDoc = await nftsColl.findOne({ network, itemId });
    if (nftDoc) {
      liquidityContract = nftDoc.liquidityContract || nftDoc.liquidity_pool || nftDoc.liquidityContract;
      liquidityPieceId = nftDoc.liquidityPieceId || nftDoc.liquidity_piece_id || nftDoc.liquidityPieceId;
    }
    if ((!liquidityContract || liquidityPieceId == null) && /^[a-fA-F0-9]{24}$/.test(itemId)) {
      // try lazy
      try {
        const lazy = await lazyColl.findOne({ _id: new mongoose.Types.ObjectId(itemId) });
        if (lazy) {
          liquidityContract = liquidityContract || lazy.liquidityContract;
          liquidityPieceId = liquidityPieceId || lazy.liquidityPieceId;
        }
      } catch (e) {
        // ignore
      }
    }

    if (!liquidityContract || liquidityPieceId == null) {
      console.log('Skipping', itemId, '— no liquidityContract/liquidityPieceId found in DB');
      summary.push({ itemId, skipped: true });
      continue;
    }

    try {
      const piecesAddress = ethers.utils.getAddress(liquidityContract);
      const pid = ethers.BigNumber.from(liquidityPieceId);
      const abi = ['function balanceOf(address account, uint256 id) view returns (uint256)'];
      const contract = new ethers.Contract(piecesAddress, abi, provider);
      const bn = await contract.balanceOf(wallet, pid);
      const pieces = bn.toNumber();

      await pieceColl.updateOne(
        { network, itemId, wallet },
        { $set: { pieces } },
        { upsert: true }
      );
      console.log(`Updated ${itemId} -> pieces=${pieces}`);
      summary.push({ itemId, pieces });
    } catch (err) {
      console.warn('Error reconciling', itemId, err.message || err);
      summary.push({ itemId, error: String(err.message || err) });
    }
  }

  console.log('Summary:', summary);
  await mongoose.disconnect();
  console.log('Done');
}

main().catch((e) => {
  console.error('Fatal:', e.message || e);
  process.exit(1);
});
