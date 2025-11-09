import mongoose from 'mongoose';
import AdminModel from '../models/adminModel.js';
import connectDB from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const createInitialAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin account already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create initial admin account
    // Default credentials - CHANGE THESE IN PRODUCTION!
    const adminData = {
      email: process.env.ADMIN_EMAIL || 'admin@durchex.com',
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      isActive: true
    };

    const admin = new AdminModel(adminData);
    await admin.save();

    console.log('✅ Initial admin account created successfully!');
    console.log('Email:', adminData.email);
    console.log('Username:', adminData.username);
    console.log('Password:', adminData.password);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating initial admin:', error);
    process.exit(1);
  }
};

createInitialAdmin();

