import express from 'express';
import {
  getAllWithdrawals,
  processPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getWithdrawalAnalytics,
  resyncWithdrawalStatus,
} from '../controllers/withdrawalAdminController.js';

const router = express.Router();

// All admin routes should be protected by the adminRouter middleware
// Get all withdrawals with filters
router.get('/withdrawals', getAllWithdrawals);

// Get withdrawal analytics
router.get('/withdrawals/analytics', getWithdrawalAnalytics);

// Process pending withdrawals
router.post('/withdrawals/process-pending', processPendingWithdrawals);

// Approve withdrawal
router.post('/withdrawals/approve', approveWithdrawal);

// Reject withdrawal
router.post('/withdrawals/reject', rejectWithdrawal);

// Resync withdrawal status
router.post('/withdrawals/resync', resyncWithdrawalStatus);

export default router;
