import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.DATABASE || 'mongodb://localhost:27017/durchex-nft-marketplace';
    
    // Enhanced connection options for MongoDB Atlas
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      dbName: 'durchex_db', // Specify database name if not in connection string
    };

    await mongoose.connect(mongoUri, options);
    
    console.log("✅ MongoDB connected successfully!");
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Authentication failed. Check your MongoDB Atlas credentials.');
    } else if (error.message.includes('network')) {
      console.log('💡 Network error. Check your IP whitelist in MongoDB Atlas.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 DNS error. Check your cluster connection string.');
    }
    
    console.log("⚠️ Continuing without database connection...");
  }
};

export default connectDB;
