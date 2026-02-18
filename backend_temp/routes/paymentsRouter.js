import express from 'express';
import { verifyDeposit } from '../controllers/paymentsController.js';

const router = express.Router();

router.post('/deposit', verifyDeposit);

export default router;
