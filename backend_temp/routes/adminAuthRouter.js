import express from 'express';
import {
  adminLogin,
  createAdmin,
  createPartner,
  getAllAdmins,
  getAllAdminsPublic,
  updateAdmin,
  deleteAdmin,
  authenticateAdmin
} from '../controllers/adminAuthController.js';

const router = express.Router();

// Public routes
router.post('/login', adminLogin);
router.get('/all-public', getAllAdminsPublic);

// Protected routes (require admin authentication)
router.post('/create-admin', authenticateAdmin, createAdmin);
router.post('/create-partner', authenticateAdmin, createPartner);
router.get('/all', authenticateAdmin, getAllAdmins);
router.patch('/:id', authenticateAdmin, updateAdmin);
router.delete('/:id', authenticateAdmin, deleteAdmin);

export default router;

