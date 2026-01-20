import { v4 as uuidv4 } from 'uuid';
import NFTListingRequest from '../models/nftListingRequestModel.js';
import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';

// Create a new listing request
export const createListingRequest = async (req, res) => {
  try {
    const {
      requesterWallet,
      requesterName,
      requesterProfilePicture,
      targetCreatorWallet,
      targetCreatorName,
      nftDetails,
      requestMessage
    } = req.body;

    // Validate required fields
    if (
      !requesterWallet ||
      !requesterName ||
      !targetCreatorWallet ||
      !targetCreatorName ||
      !nftDetails ||
      !nftDetails.name
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if request already pending from same requester to same creator
    const existingRequest = await NFTListingRequest.findOne({
      requesterWallet: requesterWallet.toLowerCase(),
      targetCreatorWallet: targetCreatorWallet.toLowerCase(),
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending request for this creator'
      });
    }

    const requestId = `LISTING_${uuidv4()}`;

    const newRequest = new NFTListingRequest({
      requestId,
      requesterWallet: requesterWallet.toLowerCase(),
      requesterName,
      requesterProfilePicture: requesterProfilePicture || null,
      targetCreatorWallet: targetCreatorWallet.toLowerCase(),
      targetCreatorName,
      nftDetails,
      requestMessage: requestMessage || '',
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await newRequest.save();

    // Send admin notification email
    try {
      await emailService.notifyAdminListingRequest(newRequest);
    } catch (emailError) {
      logger.error('Failed to send admin notification for listing request', { 
        error: emailError.message,
        requestId: newRequest._id 
      });
      // Don't fail the request creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Listing request created successfully',
      request: newRequest
    });
  } catch (error) {
    console.error('Error creating listing request:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating listing request',
      error: error.message
    });
  }
};

// Get all pending requests for a creator
export const getCreatorListingRequests = async (req, res) => {
  try {
    const { walletAddress, status = 'pending' } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address required'
      });
    }

    const query = {
      targetCreatorWallet: walletAddress.toLowerCase()
    };

    if (status) {
      query.status = status;
    }

    const requests = await NFTListingRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Error fetching creator listing requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};

// Get requests sent by a user
export const getUserSentRequests = async (req, res) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address required'
      });
    }

    const requests = await NFTListingRequest.find({
      requesterWallet: walletAddress.toLowerCase()
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Error fetching user sent requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sent requests',
      error: error.message
    });
  }
};

// Get specific request by ID
export const getRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await NFTListingRequest.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.status(200).json({
      success: true,
      request
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching request',
      error: error.message
    });
  }
};

// Approve a listing request (Admin/Creator action)
export const approveListingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approvedBy, approvalNotes } = req.body;

    const request = await NFTListingRequest.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    request.status = 'approved';
    request.approvedBy = approvedBy || 'admin';
    request.approvalNotes = approvalNotes || '';
    request.approvedAt = new Date();

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Listing request approved successfully',
      request
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving request',
      error: error.message
    });
  }
};

// Reject a listing request
export const rejectListingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason required'
      });
    }

    const request = await NFTListingRequest.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    request.status = 'rejected';
    request.rejectionReason = rejectionReason;
    request.rejectedAt = new Date();

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Listing request rejected',
      request
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting request',
      error: error.message
    });
  }
};

// Cancel a listing request (User action)
export const cancelListingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { requesterWallet } = req.body;

    const request = await NFTListingRequest.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Verify ownership
    if (request.requesterWallet !== requesterWallet.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: only requester can cancel'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${request.status} request`
      });
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Listing request cancelled',
      request
    });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling request',
      error: error.message
    });
  }
};

// Get all requests (Admin dashboard)
export const getAllListingRequests = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const requests = await NFTListingRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await NFTListingRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      requests
    });
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};
