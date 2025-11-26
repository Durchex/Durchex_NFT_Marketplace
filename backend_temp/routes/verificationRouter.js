import express from 'express';
import {
  submitVerification,
  getVerificationStatus,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getAllVerifications,
} from '../controllers/verificationController.js';

const router = express.Router();

// User routes
router.post('/submit/:walletAddress', submitVerification);
router.get('/status/:walletAddress', getVerificationStatus);

// Admin routes
router.get('/admin/pending', getPendingVerifications);
router.get('/admin/all', getAllVerifications);
router.post('/admin/approve/:walletAddress', approveVerification);
router.post('/admin/reject/:walletAddress', rejectVerification);

export default router;
