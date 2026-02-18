#!/usr/bin/env node
import mongoose from 'mongoose';

const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE;

if (!MONGO) {
  console.error('MONGODB_URI / DATABASE env required');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO);
  console.log('Connected to MongoDB\n');

  const nftModel = (await import('../backend_temp/models/nftModel.js')).nftModel;
  const lazyNFTModel = (await import('../backend_temp/models/lazyNFTModel.js')).default;

  // Get NFT sample
  const regularCount = await nftModel.countDocuments();
  const lazyCount = await lazyNFTModel.countDocuments();

  console.log(`Regular NFTs: ${regularCount}`);
  console.log(`Lazy NFTs: ${lazyCount}\n`);

  if (regularCount > 0) {
    const sample = await nftModel.findOne().lean();
    console.log('Regular NFT sample:');
    console.log(JSON.stringify(sample, null, 2).slice(0, 500));
    console.log('\n...\n');
  }

  if (lazyCount > 0) {
    const sample = await lazyNFTModel.findOne().lean();
    console.log('Lazy NFT sample:');
    console.log(JSON.stringify(sample, null, 2).slice(0, 500));
    console.log('\n...\n');
  }

  // Check for any liquidity-related fields
  const withLiquidity = await nftModel.countDocuments({ $or: [
    { liquidityContract: { $exists: true, $ne: null } },
    { liquidityPieceId: { $exists: true, $ne: null } }
  ] });

  const lazyWithLiquidity = await lazyNFTModel.countDocuments({ $or: [
    { liquidityContract: { $exists: true, $ne: null } },
    { liquidityPieceId: { $exists: true, $ne: null } }
  ] });

  console.log(`\nRegular NFTs with liquidity info: ${withLiquidity}`);
  console.log(`Lazy NFTs with liquidity info: ${lazyWithLiquidity}`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
