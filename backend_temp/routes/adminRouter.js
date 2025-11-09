import express from 'express';
import {
  getDashboardStats,
  getAllUsersAdmin,
  updateUserStatus,
  getAllNFTsAdmin,
  updateNFTStatus,
  getTransactions,
  getOrders,
  getAnalytics,
  getActivityLog,
  generateReport,
  getReports
} from '../controllers/adminController.js';

const router = express.Router();

// Dashboard
router.get('/stats', getDashboardStats);

// Users
router.get('/users', getAllUsersAdmin);
router.patch('/users/:walletAddress', updateUserStatus);

// NFTs
router.get('/nfts', getAllNFTsAdmin);
router.patch('/nfts/:network/:itemId', updateNFTStatus);

// Transactions
router.get('/transactions', getTransactions);

// Orders
router.get('/orders', getOrders);

// Analytics
router.get('/analytics', getAnalytics);

// Activity Log
router.get('/activity', getActivityLog);

// Reports
router.get('/reports', getReports);
router.post('/reports/:reportType', generateReport);

export default router;

