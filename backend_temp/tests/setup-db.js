#!/usr/bin/env node

/**
 * Database Setup Script
 * Initializes test database with sample data for automated testing
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';

dotenv.config();

// ==================== Database Configuration ====================

const MONGODB_URI = process.env.DATABASE || 'mongodb://localhost:27017/durchex-test';
const CLEAR_DB = process.env.CLEAR_DB === 'true';

// ==================== Sample Data Factory ====================

const generateSampleData = () => {
  const baseTime = Date.now();

  return {
    users: [
      {
        walletAddress: '0x' + 'a'.repeat(40),
        username: 'admin_user_test',
        bio: 'Admin test user for testing purposes',
        profileImage: 'https://via.placeholder.com/150?text=Admin',
        socialLinks: {
          twitter: 'https://twitter.com/testadmin',
          discord: 'https://discord.com/users/admin123'
        },
        isVerified: true,
        verificationStatus: 'approved',
        status: 'active',
        createdAt: new Date(baseTime),
        updatedAt: new Date(baseTime)
      },
      {
        walletAddress: '0x' + 'b'.repeat(40),
        username: 'creator_user_test',
        bio: 'NFT Creator for testing',
        profileImage: 'https://via.placeholder.com/150?text=Creator',
        socialLinks: {
          twitter: 'https://twitter.com/testcreator'
        },
        isVerified: true,
        verificationStatus: 'approved',
        status: 'active',
        createdAt: new Date(baseTime + 1000),
        updatedAt: new Date(baseTime + 1000)
      },
      {
        walletAddress: '0x' + 'c'.repeat(40),
        username: 'buyer_user_test',
        bio: 'NFT Buyer for testing',
        profileImage: 'https://via.placeholder.com/150?text=Buyer',
        socialLinks: {},
        isVerified: false,
        verificationStatus: 'pending',
        status: 'active',
        createdAt: new Date(baseTime + 2000),
        updatedAt: new Date(baseTime + 2000)
      },
      {
        walletAddress: '0x' + 'd'.repeat(40),
        username: 'giveaway_user_test',
        bio: 'Giveaway participant for testing',
        profileImage: 'https://via.placeholder.com/150?text=Giveaway',
        socialLinks: {},
        isVerified: false,
        verificationStatus: 'pending',
        status: 'active',
        createdAt: new Date(baseTime + 3000),
        updatedAt: new Date(baseTime + 3000)
      }
    ],

    collections: [
      {
        name: 'Summer Test Collection',
        description: 'Test collection for summer NFTs',
        symbol: 'SUM25',
        image: 'https://via.placeholder.com/300?text=Summer',
        network: 'Polygon',
        creator: '0x' + 'a'.repeat(40),
        createdAt: new Date(baseTime),
        updatedAt: new Date(baseTime)
      },
      {
        name: 'Digital Art Series',
        description: 'Test collection for digital art',
        symbol: 'DART',
        image: 'https://via.placeholder.com/300?text=Art',
        network: 'Ethereum',
        creator: '0x' + 'a'.repeat(40),
        createdAt: new Date(baseTime + 1000),
        updatedAt: new Date(baseTime + 1000)
      },
      {
        name: 'Gaming NFTs',
        description: 'Test collection for gaming items',
        symbol: 'GAME',
        image: 'https://via.placeholder.com/300?text=Gaming',
        network: 'BSC',
        creator: '0x' + 'a'.repeat(40),
        createdAt: new Date(baseTime + 2000),
        updatedAt: new Date(baseTime + 2000)
      }
    ],

    nfts: [
      {
        name: 'Sunset #001',
        description: 'Beautiful sunset artwork',
        collection: 'Summer Test Collection',
        category: 'art',
        network: 'Polygon',
        itemId: 'SUM25_001',
        tokenId: '1001',
        image: 'https://via.placeholder.com/400?text=Sunset',
        price: '0.5',
        creator: '0x' + 'b'.repeat(40),
        owner: '0x' + 'b'.repeat(40),
        status: 'minted',
        isGiveaway: false,
        eventStartTime: new Date(baseTime - 7200000), // 2 hours ago
        eventStatus: 'completed',
        royaltyPercentage: 10,
        royaltyAddress: '0x' + 'b'.repeat(40),
        createdAt: new Date(baseTime),
        updatedAt: new Date(baseTime),
        transactionHash: '0x' + crypto.randomBytes(32).toString('hex')
      },
      {
        name: 'Sunrise #001',
        description: 'Golden sunrise artwork',
        collection: 'Summer Test Collection',
        category: 'art',
        network: 'Polygon',
        itemId: 'SUM25_002',
        tokenId: '1002',
        image: 'https://via.placeholder.com/400?text=Sunrise',
        price: '1.0',
        creator: '0x' + 'b'.repeat(40),
        owner: '0x' + 'b'.repeat(40),
        status: 'pending',
        isGiveaway: false,
        eventStartTime: new Date(baseTime + 3600000), // 1 hour from now
        eventStatus: 'pending',
        royaltyPercentage: 10,
        royaltyAddress: '0x' + 'b'.repeat(40),
        createdAt: new Date(baseTime + 1000),
        updatedAt: new Date(baseTime + 1000)
      },
      {
        name: 'Giveaway Masterpiece',
        description: 'Limited edition giveaway NFT',
        collection: 'Digital Art Series',
        category: 'collectibles',
        network: 'Ethereum',
        itemId: 'DART_001',
        image: 'https://via.placeholder.com/400?text=Giveaway',
        price: '0.0',
        creator: '0x' + 'a'.repeat(40),
        owner: '0x' + 'a'.repeat(40),
        status: 'pending',
        isGiveaway: true,
        giveawayStatus: 'offered',
        offeredTo: '0x' + 'd'.repeat(40),
        eventStartTime: new Date(baseTime - 300000), // 5 minutes ago
        eventStatus: 'live',
        feeSubsidyPercentage: 50,
        createdAt: new Date(baseTime + 2000),
        updatedAt: new Date(baseTime + 2000)
      },
      {
        name: 'Gaming Weapon',
        description: 'Rare gaming weapon NFT',
        collection: 'Gaming NFTs',
        category: 'gaming',
        network: 'BSC',
        itemId: 'GAME_001',
        image: 'https://via.placeholder.com/400?text=Weapon',
        price: '0.2',
        creator: '0x' + 'b'.repeat(40),
        owner: null,
        status: 'listed',
        isGiveaway: false,
        eventStartTime: new Date(baseTime),
        eventStatus: 'live',
        royaltyPercentage: 5,
        royaltyAddress: '0x' + 'b'.repeat(40),
        createdAt: new Date(baseTime + 3000),
        updatedAt: new Date(baseTime + 3000)
      }
    ],

    cartItems: [
      {
        walletAddress: '0x' + 'c'.repeat(40),
        nftId: 'SUM25_001',
        contractAddress: '0x' + '1'.repeat(40),
        price: '0.5',
        addedAt: new Date(baseTime)
      },
      {
        walletAddress: '0x' + 'c'.repeat(40),
        nftId: 'GAME_001',
        contractAddress: '0x' + '2'.repeat(40),
        price: '0.2',
        addedAt: new Date(baseTime + 1000)
      }
    ],

    transactions: [
      {
        transactionHash: '0x' + crypto.randomBytes(32).toString('hex'),
        fromAddress: '0x' + 'b'.repeat(40),
        toAddress: '0xplatform_wallet',
        amount: '0.5',
        network: 'Polygon',
        nftId: 'SUM25_001',
        type: 'listing',
        status: 'completed',
        timestamp: new Date(baseTime - 3600000),
        gasUsed: '150000',
        gasPrice: '50'
      },
      {
        transactionHash: '0x' + crypto.randomBytes(32).toString('hex'),
        fromAddress: '0x' + 'c'.repeat(40),
        toAddress: '0x' + 'b'.repeat(40),
        amount: '1.0',
        network: 'Polygon',
        nftId: 'SUM25_002',
        type: 'purchase',
        status: 'pending',
        timestamp: new Date(baseTime),
        gasUsed: '200000',
        gasPrice: '60'
      }
    ],

    feeSubsidies: [
      {
        walletAddress: '0x' + 'c'.repeat(40),
        subsidyPercentage: 50,
        appliedFrom: new Date(baseTime - 86400000), // 1 day ago
        appliedUntil: new Date(baseTime + 86400000 * 30), // 30 days from now
        reason: 'Early supporter',
        appliedBy: '0x' + 'a'.repeat(40),
        createdAt: new Date(baseTime - 86400000),
        updatedAt: new Date(baseTime - 86400000)
      },
      {
        walletAddress: '0x' + 'd'.repeat(40),
        subsidyPercentage: 25,
        appliedFrom: new Date(baseTime),
        appliedUntil: new Date(baseTime + 86400000 * 7), // 7 days from now
        reason: 'Giveaway participant',
        appliedBy: '0x' + 'a'.repeat(40),
        createdAt: new Date(baseTime),
        updatedAt: new Date(baseTime)
      }
    ]
  };
};

// ==================== Database Connection ====================

async function connectDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${MONGODB_URI}`);

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log('✅ Connected to MongoDB\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure MongoDB is running');
    console.error('2. Check DATABASE environment variable');
    console.error('3. Verify connection string format\n');
    return false;
  }
}

// ==================== Database Setup ====================

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing test data...');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();

    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      console.log(`   ✅ Cleared: ${collection.name}`);
    }

    console.log('✅ Database cleared\n');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 Seeding test data...\n');

    const data = generateSampleData();

    // Insert Users
    console.log('👥 Adding users...');
    const userCollection = mongoose.connection.db.collection('users');
    if (data.users.length > 0) {
      await userCollection.insertMany(data.users);
      console.log(`   ✅ Added ${data.users.length} users`);
    }

    // Insert Collections
    console.log('📚 Adding collections...');
    const collectionCollection = mongoose.connection.db.collection('collections');
    if (data.collections.length > 0) {
      await collectionCollection.insertMany(data.collections);
      console.log(`   ✅ Added ${data.collections.length} collections`);
    }

    // Insert NFTs
    console.log('🎨 Adding NFTs...');
    const nftCollection = mongoose.connection.db.collection('nfts');
    if (data.nfts.length > 0) {
      await nftCollection.insertMany(data.nfts);
      console.log(`   ✅ Added ${data.nfts.length} NFTs`);
    }

    // Insert Cart Items
    console.log('🛒 Adding cart items...');
    const cartCollection = mongoose.connection.db.collection('carts');
    if (data.cartItems.length > 0) {
      await cartCollection.insertMany(data.cartItems);
      console.log(`   ✅ Added ${data.cartItems.length} cart items`);
    }

    // Insert Transactions
    console.log('💳 Adding transactions...');
    const transactionCollection = mongoose.connection.db.collection('transactions');
    if (data.transactions.length > 0) {
      await transactionCollection.insertMany(data.transactions);
      console.log(`   ✅ Added ${data.transactions.length} transactions`);
    }

    // Insert Fee Subsidies
    console.log('💰 Adding fee subsidies...');
    const subsidyCollection = mongoose.connection.db.collection('fee_subsidies');
    if (data.feeSubsidies.length > 0) {
      await subsidyCollection.insertMany(data.feeSubsidies);
      console.log(`   ✅ Added ${data.feeSubsidies.length} fee subsidies`);
    }

    console.log('\n✅ Database seeding completed\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    throw error;
  }
}

// ==================== Main Execution ====================

async function main() {
  console.log('='.repeat(60));
  console.log('🗄️  DATABASE SETUP FOR AUTOMATED TESTING');
  console.log('='.repeat(60) + '\n');

  try {
    // Connect to database
    const connected = await connectDatabase();
    if (!connected) {
      process.exit(1);
    }

    // Clear if requested
    if (CLEAR_DB) {
      await clearDatabase();
    }

    // Seed database
    await seedDatabase();

    // Display test data summary
    const data = generateSampleData();
    console.log('📊 TEST DATA SUMMARY\n');
    console.log(`Users: ${data.users.length}`);
    data.users.forEach(user => {
      console.log(`  - ${user.username} (${user.walletAddress})`);
    });

    console.log(`\nCollections: ${data.collections.length}`);
    data.collections.forEach(collection => {
      console.log(`  - ${collection.name} (${collection.network})`);
    });

    console.log(`\nNFTs: ${data.nfts.length}`);
    data.nfts.forEach(nft => {
      console.log(`  - ${nft.name} (${nft.status}) - ${nft.network}`);
    });

    console.log(`\nCart Items: ${data.cartItems.length}`);
    console.log(`Transactions: ${data.transactions.length}`);
    console.log(`Fee Subsidies: ${data.feeSubsidies.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE READY FOR TESTING');
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
