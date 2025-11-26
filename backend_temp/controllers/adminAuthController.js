import AdminModel from '../models/adminModel.js';
import mongoose from 'mongoose';

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find admin by email or username
    const admin = await AdminModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() }
      ],
      isActive: true
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await admin.updateLastLogin();

    // Return admin data (password excluded by toJSON)
    res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create Admin Account (only by existing admin)
export const createAdmin = async (req, res) => {
  try {
    const { email, username, password, role } = req.body;
    const currentAdmin = req.admin; // Set by auth middleware

    // Only admins can create other admins
    if (currentAdmin.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create admin accounts' });
    }

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with this email or username already exists' });
    }

    // Create admin
    const newAdmin = new AdminModel({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      role: role || 'admin',
      createdBy: currentAdmin.id
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        username: newAdmin.username,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create Partner Account (only by admin)
export const createPartner = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const currentAdmin = req.admin; // Set by auth middleware

    // Only admins can create partners
    if (currentAdmin.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create partner accounts' });
    }

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if partner already exists
    const existingPartner = await AdminModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingPartner) {
      return res.status(400).json({ error: 'Partner with this email or username already exists' });
    }

    // Create partner
    const newPartner = new AdminModel({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      role: 'partner',
      createdBy: currentAdmin.id
    });

    await newPartner.save();

    res.status(201).json({
      success: true,
      message: 'Partner account created successfully',
      partner: {
        id: newPartner._id,
        email: newPartner.email,
        username: newPartner.username,
        role: newPartner.role
      }
    });
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all admins and partners (only by admin)
export const getAllAdmins = async (req, res) => {
  try {
    const currentAdmin = req.admin;

    // Only admins can view all accounts
    if (currentAdmin.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all accounts' });
    }

    const admins = await AdminModel.find()
      .select('-password')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      admins
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Public: get limited admin info (no auth required)
export const getAllAdminsPublic = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, admins: [], count: 0, warning: 'Database not connected' });
    }

    const admins = await AdminModel.find()
      .select('username role createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      admins,
      count: admins.length
    });
  } catch (error) {
    console.error('Get all admins public error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update admin/partner account (only by admin)
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const currentAdmin = req.admin;

    // Only admins can update accounts
    if (currentAdmin.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update accounts' });
    }

    // Don't allow changing own role
    if (id === currentAdmin.id && updates.role) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    // If updating password, validate it
    if (updates.password) {
      if (updates.password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
    }

    const admin = await AdminModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({
      success: true,
      message: 'Account updated successfully',
      admin
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete admin/partner account (only by admin)
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const currentAdmin = req.admin;

    // Only admins can delete accounts
    if (currentAdmin.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete accounts' });
    }

    // Don't allow deleting own account
    if (id === currentAdmin.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const admin = await AdminModel.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Middleware to authenticate admin from session/token
export const authenticateAdmin = async (req, res, next) => {
  try {
    // Get admin ID from session or token (you can implement JWT later)
    const adminId = req.headers['x-admin-id'] || req.body.adminId;
    
    if (!adminId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const admin = await AdminModel.findById(adminId).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive admin account' });
    }

    req.admin = {
      id: admin._id.toString(),
      email: admin.email,
      username: admin.username,
      role: admin.role
    };

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

