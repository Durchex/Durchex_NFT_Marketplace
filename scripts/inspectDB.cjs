// scripts/inspectDB.cjs
// Usage: node scripts/inspectDB.cjs <walletAddress> [itemId]
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), 'backend_temp/.env') });

const mongoUri = process.env.DATABASE || process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('No DATABASE/MONGO_URI found in backend_temp/.env');
  process.exit(1);
}

const wallet = (process.argv[2] || '').toLowerCase();
const itemId = process.argv[3] || null;

async function run() {
  try {
    await mongoose.connect(mongoUri, { dbName: 'durchex_db', serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');

    const pieceHolding = mongoose.model('PieceHolding', new mongoose.Schema({}, { strict: false }), 'pieceholdings');
    const nftModel = mongoose.model('NFT', new mongoose.Schema({}, { strict: false }), 'nfts');
    const nftTrade = mongoose.model('NFTTrade', new mongoose.Schema({}, { strict: false }), 'nfttrades');

    if (wallet) {
      console.log('\n-- Piece holdings for wallet:', wallet);
      const holdings = await pieceHolding.find({ wallet: wallet }).lean().limit(100);
      console.log(JSON.stringify(holdings, null, 2));
    }

    if (itemId) {
      console.log('\n-- NFT document for itemId:', itemId);
      const nft = await nftModel.findOne({ itemId: String(itemId) }).lean();
      console.log(JSON.stringify(nft, null, 2));

      console.log('\n-- Trades for itemId:', itemId);
      const trades = await nftTrade.find({ itemId: String(itemId) }).sort({ createdAt: -1 }).limit(50).lean();
      console.log(JSON.stringify(trades, null, 2));
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error inspecting DB:', err.message || err);
    process.exit(2);
  }
}

run();
