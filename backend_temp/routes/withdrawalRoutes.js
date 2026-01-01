import express from 'express';
import withdrawalController from '../controllers/withdrawalController.js';

const router = express.Router();

// Withdrawal routes
// Request a new withdrawal
router.post('/request', withdrawalController.requestWithdrawal);

// Get withdrawal history for a user
router.get('/history/:userWallet', withdrawalController.getWithdrawalHistory);

// Get earnings dashboard
router.get('/earnings/:userWallet', withdrawalController.getEarningsDashboard);

// Admin: Process pending withdrawals
router.post('/admin/process-pending', withdrawalController.processPendingWithdrawals);

export default router;
