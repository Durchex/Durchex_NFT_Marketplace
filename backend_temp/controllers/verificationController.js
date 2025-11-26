import mongoose from 'mongoose';
import { nftUserModel } from '../models/userModel.js';
import { nftModel } from '../models/nftModel.js';
import nodemailer from 'nodemailer';

// Email transporter configuration (you'll need to configure this with your email service)
const createEmailTransporter = () => {
  // Check if email is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email not configured. SMTP_USER and SMTP_PASS environment variables are required.');
    return null;
  }
  
  // For development, you can use a service like Gmail, SendGrid, or AWS SES
  // This is a basic example - you should configure with your actual email service
  try {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    return null;
  }
};

// Send verification email
const sendVerificationEmail = async (email, status, tier) => {
  try {
    const transporter = createEmailTransporter();
    
    // If email is not configured, skip sending but don't throw error
    if (!transporter) {
      console.warn(`Email not configured. Skipping verification email to ${email}`);
      return;
    }
    
    let subject, html;
    if (status === 'premium' || status === 'super_premium') {
      subject = `Your ${tier === 'premium' ? 'Premium' : 'Super Premium'} Verification is Approved!`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Verification Approved!</h2>
          <p>Congratulations! Your ${tier === 'premium' ? 'Premium' : 'Super Premium'} verification has been approved.</p>
          <p>You now have access to all ${tier === 'premium' ? 'Premium' : 'Super Premium'} features on Durchex NFT Marketplace.</p>
          <p>Thank you for being part of our community!</p>
        </div>
      `;
    } else if (status === 'rejected') {
      subject = 'Verification Request Status Update';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">Verification Request Update</h2>
          <p>We regret to inform you that your verification request has been rejected.</p>
          <p>Please review your submission and try again. If you have questions, please contact our support team.</p>
        </div>
      `;
    } else {
      return; // Don't send email for pending status
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@durchex.com',
      to: email,
      subject,
      html,
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    // Don't throw error - email failure shouldn't break the verification process
  }
};

// Submit verification request
export const submitVerification = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { tier, email, location, address, country, houseAddress, idVerification } = req.body;

    // Validate tier
    if (!['premium', 'super_premium'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid verification tier' });
    }

    // Get user
    const user = await nftUserModel.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified at this tier or higher
    if (user.verificationStatus === 'premium' && tier === 'premium') {
      return res.status(400).json({ error: 'User already has premium verification' });
    }
    if (user.verificationStatus === 'super_premium') {
      return res.status(400).json({ error: 'User already has super premium verification' });
    }

    // Count user's NFTs
    const nftCount = await nftModel.countDocuments({ owner: walletAddress.toLowerCase() });

    // Validate NFT count requirements
    if (tier === 'premium' && nftCount < 20) {
      return res.status(400).json({ 
        error: 'Premium verification requires at least 20 NFTs in your collection',
        currentCount: nftCount,
        requiredCount: 20
      });
    }

    if (tier === 'super_premium' && nftCount < 100) {
      return res.status(400).json({ 
        error: 'Super Premium verification requires at least 100 NFTs in your collection',
        currentCount: nftCount,
        requiredCount: 100
      });
    }

    // Validate required fields
    if (tier === 'premium') {
      if (!email || !location || !address) {
        return res.status(400).json({ error: 'Premium verification requires email, location, and address' });
      }
    }

    if (tier === 'super_premium') {
      if (!email || !country || !houseAddress) {
        return res.status(400).json({ error: 'Super Premium verification requires email, country, and house address' });
      }
      if (!idVerification || !idVerification.documentType || !idVerification.documentNumber || !idVerification.documentImage) {
        return res.status(400).json({ error: 'Super Premium verification requires ID verification documents' });
      }
    }

    // Update user with verification data
    const verificationData = {
      email,
      location: location || undefined,
      address: address || undefined,
      country: country || undefined,
      houseAddress: houseAddress || undefined,
      idVerification: tier === 'super_premium' ? idVerification : undefined,
      submittedAt: new Date(),
    };

    await nftUserModel.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      {
        verificationStatus: 'pending',
        verificationData,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Verification request submitted successfully. Admin will review your request.',
      status: 'pending',
      tier,
    });
  } catch (error) {
    console.error('Error submitting verification:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user verification status
export const getVerificationStatus = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const user = await nftUserModel.findOne({ walletAddress: walletAddress.toLowerCase() })
      .select('verificationStatus verificationData walletAddress');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count user's NFTs
    const nftCount = await nftModel.countDocuments({ owner: walletAddress.toLowerCase() });

    res.json({
      verificationStatus: user.verificationStatus,
      verificationData: user.verificationData,
      nftCount,
      canApplyPremium: nftCount >= 20,
      canApplySuperPremium: nftCount >= 100,
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Get all pending verifications
export const getPendingVerifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const users = await nftUserModel.find({ verificationStatus: 'pending' })
      .select('walletAddress username email verificationData verificationStatus createdAt')
      .sort({ 'verificationData.submittedAt': -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get NFT counts for each user
    const verificationsWithStats = await Promise.all(
      users.map(async (user) => {
        const nftCount = await nftModel.countDocuments({ owner: user.walletAddress });
        return {
          ...user,
          nftCount,
        };
      })
    );

    const total = await nftUserModel.countDocuments({ verificationStatus: 'pending' });

    res.json({
      verifications: verificationsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Approve verification
export const approveVerification = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { verifiedBy } = req.body;

    const user = await nftUserModel.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.verificationStatus !== 'pending') {
      return res.status(400).json({ error: 'User verification is not pending' });
    }

    // Determine tier based on verification data
    const tier = user.verificationData?.idVerification ? 'super_premium' : 'premium';

    // Update user
    await nftUserModel.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      {
        verificationStatus: tier,
        isVerified: true,
        'verificationData.verifiedAt': new Date(),
        'verificationData.verifiedBy': verifiedBy,
      },
      { new: true }
    );

    // Send verification email
    if (user.verificationData?.email) {
      await sendVerificationEmail(user.verificationData.email, tier, tier);
    }

    res.json({
      success: true,
      message: `Verification approved. User is now ${tier === 'super_premium' ? 'Super Premium' : 'Premium'} verified.`,
      tier,
    });
  } catch (error) {
    console.error('Error approving verification:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Reject verification
export const rejectVerification = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { verifiedBy, rejectionReason } = req.body;

    const user = await nftUserModel.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.verificationStatus !== 'pending') {
      return res.status(400).json({ error: 'User verification is not pending' });
    }

    // Update user
    await nftUserModel.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      {
        verificationStatus: 'rejected',
        'verificationData.verifiedAt': new Date(),
        'verificationData.verifiedBy': verifiedBy,
        'verificationData.rejectionReason': rejectionReason,
      },
      { new: true }
    );

    // Send rejection email
    if (user.verificationData?.email) {
      await sendVerificationEmail(user.verificationData.email, 'rejected', null);
    }

    res.json({
      success: true,
      message: 'Verification rejected.',
    });
  } catch (error) {
    console.error('Error rejecting verification:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Get all verifications (with filters)
export const getAllVerifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    let query = {};
    if (status && status !== 'all') {
      query.verificationStatus = status;
    }
    if (search) {
      query.$or = [
        { walletAddress: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'verificationData.email': { $regex: search, $options: 'i' } },
      ];
    }

    // If DB not connected, return empty result to avoid 500 errors
    if (mongoose.connection.readyState !== 1) {
      return res.json({ verifications: [], pagination: { page, limit, total: 0, pages: 0 } });
    }

    const users = await nftUserModel.find(query)
      .select('walletAddress username email verificationStatus verificationData createdAt')
      .sort({ 'verificationData.submittedAt': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get NFT counts for each user
    const verificationsWithStats = await Promise.all(
      users.map(async (user) => {
        const nftCount = await nftModel.countDocuments({ owner: user.walletAddress });
        return {
          ...user,
          nftCount,
        };
      })
    );

    const total = await nftUserModel.countDocuments(query);

    res.json({
      verifications: verificationsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting all verifications:', error);
    res.status(500).json({ error: error.message });
  }
};
