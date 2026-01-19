// Admin API routes
const express = require('express');
const adminService = require('../services/adminService');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Middleware: Admin authorization
const adminOnly = authorize(['admin']);

// User Management Routes
router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      isVerified: req.query.isVerified === 'true',
      role: req.query.role,
      search: req.query.search,
    };

    const result = await adminService.getAllUsers(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/:userId/suspend', authenticate, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await adminService.suspendUser(req.params.userId, reason);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/:userId/ban', authenticate, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await adminService.banUser(req.params.userId, reason);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/:userId/verify', authenticate, adminOnly, async (req, res) => {
  try {
    const user = await adminService.verifyUser(req.params.userId);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/:userId/reset-password', authenticate, adminOnly, async (req, res) => {
  try {
    const result = await adminService.resetUserPassword(req.params.userId);
    res.json({ success: true, tempPassword: result.tempPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dispute Resolution Routes
router.get('/disputes', authenticate, adminOnly, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      type: req.query.type,
      priority: req.query.priority,
    };

    const result = await adminService.getDisputes(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/disputes/:disputeId/resolve', authenticate, adminOnly, async (req, res) => {
  try {
    const { decision, reason } = req.body;
    const dispute = await adminService.resolveDispute(
      req.params.disputeId,
      decision,
      reason
    );
    res.json({ success: true, dispute });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NFT Moderation Routes
router.post('/nfts/:nftId/flag', authenticate, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const nft = await adminService.flagNFT(req.params.nftId, reason);
    res.json({ success: true, nft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/nfts/:nftId/remove', authenticate, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const nft = await adminService.removeNFT(req.params.nftId, reason);
    res.json({ success: true, nft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Platform Statistics Routes
router.get('/stats', authenticate, adminOnly, async (req, res) => {
  try {
    const stats = await adminService.getPlatformStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/activity', authenticate, adminOnly, async (req, res) => {
  try {
    const activity = await adminService.getRecentActivity();
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Platform Settings Routes
router.get('/settings', authenticate, adminOnly, async (req, res) => {
  try {
    const settings = await adminService.getPlatformSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', authenticate, adminOnly, async (req, res) => {
  try {
    const settings = await adminService.updatePlatformSettings(req.body);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
