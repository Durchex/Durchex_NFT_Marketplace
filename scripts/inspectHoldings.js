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

  const pieceHoldingModel = (await import('../backend_temp/models/pieceHoldingModel.js')).pieceHoldingModel;

  const holdingCount = await pieceHoldingModel.countDocuments();
  console.log(`Piece Holdings: ${holdingCount}\n`);

  if (holdingCount > 0) {
    const all = await pieceHoldingModel.find().lean();
    console.log('All piece holdings:');
    all.forEach(h => {
      console.log(`  ${h.wallet} | ${h.network} | itemId=${h.itemId} | pieces=${h.pieces}`);
    });
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
