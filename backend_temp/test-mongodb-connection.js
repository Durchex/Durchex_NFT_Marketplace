import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testMongoDBConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    
    const mongoUri = process.env.DATABASE || 'mongodb://localhost:27017/durchex-nft-marketplace';
    console.log('📡 Connection URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: 'durchex_db',
    });
    
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔒 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication failed. Check your username and password.');
    } else if (error.message.includes('network')) {
      console.log('\n💡 Network error. Check your IP whitelist in MongoDB Atlas.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DNS error. Check your cluster connection string.');
    }
    
    process.exit(1);
  }
};

// Run the test
testMongoDBConnection();
