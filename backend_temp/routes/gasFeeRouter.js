import express from 'express';
import {
  getGasFeeRegulation,
  getAllGasFeeRegulations,
  updateGasFeeRegulation,
  calculateRegulatedGasPrice,
  toggleGasFeeRegulation,
  getGlobalServiceCharge,
  updateGlobalServiceCharge,
  toggleGlobalServiceCharge,
} from '../controllers/gasFeeController.js';

const router = express.Router();

// Public routes
router.get('/network/:network', getGasFeeRegulation);
router.get('/all', getAllGasFeeRegulations);
router.post('/calculate', calculateRegulatedGasPrice);

// Admin routes - Global service charge (MUST come before parameterized routes)
router.get('/admin/global', getGlobalServiceCharge);
router.put('/admin/global', updateGlobalServiceCharge);
router.patch('/admin/global/toggle', toggleGlobalServiceCharge);

// Admin routes - Network specific (parameterized routes go last)
router.put('/admin/:network', updateGasFeeRegulation);
router.patch('/admin/:network/toggle', toggleGasFeeRegulation);

export default router;
