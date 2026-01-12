import express from 'express';
import {
  createListingRequest,
  getCreatorListingRequests,
  getUserSentRequests,
  getRequestById,
  approveListingRequest,
  rejectListingRequest,
  cancelListingRequest,
  getAllListingRequests
} from '../controllers/nftListingRequestController.js';

const router = express.Router();

// User routes
router.post('/requests', createListingRequest);
router.get('/requests/sent', getUserSentRequests);
router.get('/requests/:requestId', getRequestById);
router.post('/requests/:requestId/cancel', cancelListingRequest);

// Creator routes
router.get('/creator/requests', getCreatorListingRequests);

// Admin routes
router.post('/admin/requests/:requestId/approve', approveListingRequest);
router.post('/admin/requests/:requestId/reject', rejectListingRequest);
router.get('/admin/requests', getAllListingRequests);

export default router;
