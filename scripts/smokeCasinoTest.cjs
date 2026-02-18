// scripts/smokeCasinoTest.cjs
// Simple smoke test for chip operations (no on-chain required).
// Usage: node scripts/smokeCasinoTest.cjs <wallet> [initialChips]

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), 'backend_temp/.env') });
const mongoUri = process.env.DATABASE || process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('No DATABASE found in backend_temp/.env');
  process.exit(1);
}

const wallet = (process.argv[2] || 'test_wallet').toLowerCase();
const initialChips = Number(process.argv[3] || 1000);

async function run() {
  await mongoose.connect(mongoUri, { dbName: 'durchex_db', serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB for smoke test');

  const userModel = require(path.resolve(process.cwd(), 'backend_temp/models/userModel.js'));
  const { atomicDeduct, creditPayout } = require(path.resolve(process.cwd(), 'backend_temp/services/gameWalletService.js'));

  // Ensure user exists
  await userModel.nftUserModel.findOneAndUpdate({ walletAddress: wallet }, { $setOnInsert: { walletAddress: wallet, username: 'smoketest', email: 'smoketest@example.com', gameBalance: 0 } }, { upsert: true });
  console.log('Ensured test user exists:', wallet);

  // Credit initial chips
  await creditPayout(wallet, initialChips);
  const afterCredit = await userModel.nftUserModel.findOne({ walletAddress: wallet }).lean();
  console.log('After credit:', afterCredit.gameBalance);

  // Attempt atomic deduct for bet
  const bet = Math.min(50, afterCredit.gameBalance);
  const before = await atomicDeduct(wallet, bet);
  if (!before) {
    console.error('atomicDeduct failed (insufficient funds)');
  } else {
    console.log('atomicDeduct succeeded, balance before deduct:', before.gameBalance);
    // simulate payout
    const payout = bet * 1.5;
    await creditPayout(wallet, payout);
    const final = await userModel.nftUserModel.findOne({ walletAddress: wallet }).lean();
    console.log(`Bet ${bet} paid out ${payout}. Final balance:`, final.gameBalance);
  }

  await mongoose.disconnect();
  console.log('Smoke test completed');
  process.exit(0);
}

run().catch((e) => { console.error('Smoke test error', e); process.exit(2); });
