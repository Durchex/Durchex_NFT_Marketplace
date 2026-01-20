import NFTListingRequest from '../models/nftListingRequestModel.js';
import AdminModel from '../models/adminModel.js';
import { nftUserModel } from '../models/userModel.js';
import { sendEmailNotification } from '../services/emailService.js';
import logger from '../utils/logger.js';

/**
 * Get all listing requests (Admin view)
 */
export const getListingRequestsAdmin = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20, search } = req.query;

    const query = {};
    if (status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { requesterName: { $regex: search, $options: 'i' } },
        { targetCreatorName: { $regex: search, $options: 'i' } },
        { 'nftDetails.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const requests = await NFTListingRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await NFTListingRequest.countDocuments(query);

    res.json({
      success: true,
      requests,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching listing requests', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get listing request details
 */
export const getListingRequestDetailAdmin = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await NFTListingRequest.findOne({
      $or: [
        { _id: requestId },
        { requestId }
      ]
    });

    if (!request) {
      return res.status(404).json({ error: 'Listing request not found' });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    logger.error('Error fetching listing request', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Approve listing request (Admin)
 */
export const approveListingRequestAdmin = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    const request = await NFTListingRequest.findOne({
      $or: [
        { _id: requestId },
        { requestId }
      ]
    });

    if (!request) {
      return res.status(404).json({ error: 'Listing request not found' });
    }

    // Update request status
    request.status = 'approved';
    request.adminNotes = adminNotes || '';
    request.approvedAt = new Date();
    request.approvedBy = req.admin?._id || 'admin';
    await request.save();

    // Send notification email to requester
    try {
      const requesterEmail = request.requesterEmail || 
        (await nftUserModel.findOne({ walletAddress: request.requesterWallet })?.select('email')).email;
      
      if (requesterEmail) {
        await sendEmailNotification({
          to: requesterEmail,
          subject: `Your NFT Listing Request Has Been Approved! 🎉`,
          template: 'listing-request-approved',
          data: {
            requesterName: request.requesterName,
            targetCreatorName: request.targetCreatorName,
            nftName: request.nftDetails?.name,
            adminNotes
          }
        });
      }
    } catch (emailError) {
      logger.error('Failed to send approval email', { error: emailError.message });
    }

    // Send notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@durchex.com';
      await sendEmailNotification({
        to: adminEmail,
        subject: `Listing Request Approved: ${request.nftDetails?.name}`,
        template: 'admin-listing-approved',
        data: {
          requestId: request.requestId,
          requesterName: request.requesterName,
          targetCreatorName: request.targetCreatorName,
          nftName: request.nftDetails?.name
        }
      });
    } catch (emailError) {
      logger.error('Failed to send admin notification', { error: emailError.message });
    }

    logger.info('Listing request approved', { requestId: request._id });

    res.json({
      success: true,
      message: 'Listing request approved',
      request
    });
  } catch (error) {
    logger.error('Error approving listing request', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reject listing request (Admin)
 */
export const rejectListingRequestAdmin = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason, adminNotes } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const request = await NFTListingRequest.findOne({
      $or: [
        { _id: requestId },
        { requestId }
      ]
    });

    if (!request) {
      return res.status(404).json({ error: 'Listing request not found' });
    }

    // Update request status
    request.status = 'rejected';
    request.rejectionReason = reason;
    request.adminNotes = adminNotes || '';
    request.rejectedAt = new Date();
    request.rejectedBy = req.admin?._id || 'admin';
    await request.save();

    // Send rejection email to requester
    try {
      const requesterEmail = request.requesterEmail || 
        (await nftUserModel.findOne({ walletAddress: request.requesterWallet })?.select('email')).email;
      
      if (requesterEmail) {
        await sendEmailNotification({
          to: requesterEmail,
          subject: `Your NFT Listing Request Has Been Declined`,
          template: 'listing-request-rejected',
          data: {
            requesterName: request.requesterName,
            targetCreatorName: request.targetCreatorName,
            nftName: request.nftDetails?.name,
            reason,
            adminNotes
          }
        });
      }
    } catch (emailError) {
      logger.error('Failed to send rejection email', { error: emailError.message });
    }

    logger.info('Listing request rejected', { requestId: request._id });

    res.json({
      success: true,
      message: 'Listing request rejected',
      request
    });
  } catch (error) {
    logger.error('Error rejecting listing request', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get listing request statistics
 */
export const getListingRequestStatsAdmin = async (req, res) => {
  try {
    const totalRequests = await NFTListingRequest.countDocuments();
    const pendingRequests = await NFTListingRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await NFTListingRequest.countDocuments({ status: 'approved' });
    const rejectedRequests = await NFTListingRequest.countDocuments({ status: 'rejected' });

    res.json({
      success: true,
      stats: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests
      }
    });
  } catch (error) {
    logger.error('Error fetching stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};
