// test-mongo.js (ES module compatible)
import mongoose from 'mongoose';

// Use env var if set; replace the placeholder with your real URI when testing.
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'PASTE_YOUR_MONGO_URI_HERE';

async function testConnect() {
  try {
    await mongoose.connect(uri, {
      // Mongoose 7+ no longer requires these options, but provide serverSelectionTimeout
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Mongo connected');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Mongo connect error:', err && (err.message || err));
    process.exit(1);
  }
}

testConnect();