import express from 'express';
import {
  getGasFeeRegulation,
  getAllGasFeeRegulations,
  updateGasFeeRegulation,
  calculateRegulatedGasPrice,
  toggleGasFeeRegulation,
} from '../controllers/gasFeeController.js';

const router = express.Router();

// Public routes
router.get('/network/:network', getGasFeeRegulation);
router.get('/all', getAllGasFeeRegulations);
router.post('/calculate', calculateRegulatedGasPrice);

// Admin routes
router.put('/admin/:network', updateGasFeeRegulation);
router.patch('/admin/:network/toggle', toggleGasFeeRegulation);

export default router;
