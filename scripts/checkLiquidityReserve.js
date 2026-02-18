#!/usr/bin/env node
import { ethers } from 'ethers';
import mongoose from 'mongoose';

const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE;
const RPC_URL = process.env.BASE_RPC_URL || process.env.RPC_URL || 'https://mainnet.base.org';

if (!MONGO) {
  console.error('MONGODB_URI / DATABASE env required');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO);
  console.log('Connected to MongoDB\n');

  const nftModel = (await import('../backend_temp/models/nftModel.js')).nftModel;
  const lazyNFTModel = (await import('../backend_temp/models/lazyNFTModel.js')).default;

  // Get all NFTs with liquidity info
  const regularNfts = await nftModel.find(
    { liquidityContract: { $exists: true, $ne: null }, liquidityPieceId: { $exists: true, $ne: null } },
    { itemId: 1, network: 1, liquidityContract: 1, liquidityPieceId: 1, price: 1, lastPrice: 1 }
  ).lean();

  const lazyNfts = await lazyNFTModel.find(
    { liquidityContract: { $exists: true, $ne: null }, liquidityPieceId: { $exists: true, $ne: null } },
    { _id: 1, network: 1, liquidityContract: 1, liquidityPieceId: 1, price: 1, lastPrice: 1 }
  ).lean();

  console.log(`Found ${regularNfts.length} regular NFTs and ${lazyNfts.length} lazy NFTs with liquidity info\n`);

  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

  // ABI for balanceOf and common liquidity methods
  const erc1155Abi = ['function balanceOf(address,uint256) view returns (uint256)'];
  const nftPiecesAbi = [
    'function balanceOf(address,uint256) view returns (uint256)',
    'function totalSupply(uint256) view returns (uint256)'
  ];

  // Check each unique (liquidityContract, pieceId) pair
  const checked = new Set();

  for (const nft of [...regularNfts, ...lazyNfts]) {
    const key = `${nft.liquidityContract?.toLowerCase()}:${nft.liquidityPieceId}`;
    if (checked.has(key)) continue;
    checked.add(key);

    const itemLabel = nft._id ? String(nft._id) : nft.itemId;
    const piecesContract = nft.liquidityContract;
    const pieceId = nft.liquidityPieceId;
    const price = nft.lastPrice || nft.price || '0';

    console.log(`\n📊 NFT ${itemLabel}`);
    console.log(`   Liquidity Contract: ${piecesContract}`);
    console.log(`   Piece ID: ${pieceId}`);
    console.log(`   Price: ${price}`);

    try {
      // Check if liquidity contract is actually an ERC1155
      const code = await provider.getCode(piecesContract);
      if (code === '0x') {
        console.log(`   ⚠️  No contract at ${piecesContract}`);
        continue;
      }

      const contract = new ethers.Contract(piecesContract, erc1155Abi, provider);
      
      // Check reserve: how many pieces does the **liquidity contract** hold?
      let reserve = 0;
      try {
        const bn = await contract.balanceOf(piecesContract, pieceId);
        reserve = bn.toNumber();
      } catch (e) {
        console.log(`   ❌ Cannot query reserve balance: ${e.message}`);
        continue;
      }

      console.log(`   Reserve (pieces in liquidity): ${reserve}`);
      if (reserve === 0) {
        console.log(`   ⚠️  INSUFFICIENT RESERVE — liquidity pool is empty!`);
      }
    } catch (e) {
      console.error(`   Error: ${e.message}`);
    }
  }

  await mongoose.disconnect();
  console.log('\n✅ Done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
