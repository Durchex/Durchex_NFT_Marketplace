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
  getReports,
  createUnmintedNFT,
  getUnmintedNFTs,
  offerNFTToUser,
  setFeeSubsidy,
  getFeeSubsidyInfo,
  markNFTAsMinted,
  getGiveawayNFTs,
  revokeNFTOffer
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

// Unminted NFT Management
router.post('/nfts/unminted/create', createUnmintedNFT);
router.get('/nfts/unminted/list', getUnmintedNFTs);
router.get('/nfts/giveaways/list', getGiveawayNFTs);
router.post('/nfts/offer', offerNFTToUser);
router.post('/nfts/offer/revoke', revokeNFTOffer);
router.post('/nfts/minted/mark', markNFTAsMinted);

// Fee Subsidy Management
router.post('/nfts/subsidy/set', setFeeSubsidy);
router.get('/nfts/subsidy/:itemId', getFeeSubsidyInfo);

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

