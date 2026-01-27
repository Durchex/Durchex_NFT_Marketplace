// backend_temp/scripts/backfill_lazy_nft_imageURI.js
// One-time migration script to backfill imageURI for existing lazy NFTs
// Usage:
//   cd backend_temp
//   node scripts/backfill_lazy_nft_imageURI.js
//
// Requires DATABASE (Mongo URI) env var or uses the same default as connectDB.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LazyNFT from '../models/lazyNFTModel.js';
import connectDB from '../config/db.js';

dotenv.config();

// Simple helper: convert ipfs://... to https://ipfs.io/ipfs/<cid>
function ipfsToHttp(ipfsUri) {
  if (!ipfsUri) return '';
  if (ipfsUri.startsWith('ipfs://')) {
    const cid = ipfsUri.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${cid}`;
  }
  return ipfsUri;
}

async function fetchMetadata(ipfsUri) {
  try {
    const httpUri = ipfsToHttp(ipfsUri);
    if (!httpUri) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(httpUri, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[backfill] HTTP ${res.status} fetching metadata for ${httpUri}`);
      return null;
    }

    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[backfill] Error fetching metadata:', err.message);
    return null;
  }
}

async function deriveImageURI(lazyNft) {
  // Prefer existing imageURI if present
  if (lazyNft.imageURI) return lazyNft.imageURI;

  // Try to get from metadata.image
  const metadata = await fetchMetadata(lazyNft.ipfsURI);
  if (metadata && metadata.image) {
    return ipfsToHttp(metadata.image);
  }

  // Fallback: use metadata URI itself as image (not ideal, but better than empty)
  return ipfsToHttp(lazyNft.ipfsURI);
}

async function run() {
  try {
    console.log('=== LazyNFT imageURI backfill migration starting ===');

    // Ensure DB is connected
    await connectDB();

    // Find lazy NFTs missing imageURI or with empty string
    const query = {
      $or: [
        { imageURI: { $exists: false } },
        { imageURI: '' },
        { imageURI: null },
      ],
    };

    const total = await LazyNFT.countDocuments(query);
    console.log(`Found ${total} lazy NFTs without imageURI to backfill.`);

    const batchSize = 50;
    let processed = 0;

    while (true) {
      const batch = await LazyNFT.find(query).limit(batchSize);
      if (!batch.length) break;

      for (const doc of batch) {
        try {
          const newImageURI = await deriveImageURI(doc);
          if (!newImageURI) {
            console.warn(`[backfill] Could not derive imageURI for lazyNFT ${doc._id}`);
            continue;
          }

          doc.imageURI = newImageURI;
          await doc.save();
          processed += 1;

          console.log(
            `[backfill] Updated lazyNFT ${doc._id} imageURI -> ${newImageURI}`
          );
        } catch (err) {
          console.warn(
            `[backfill] Error updating lazyNFT ${doc._id}:`,
            err.message
          );
        }
      }
    }

    console.log(
      `=== Backfill complete. Updated ${processed} lazy NFTs with imageURI. ===`
    );
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
}

// Ensure global fetch exists (Node 18+ has it; if not, require node-fetch)
if (typeof fetch === 'undefined') {
  // eslint-disable-next-line global-require
  global.fetch = (await import('node-fetch')).default;
}

run();

