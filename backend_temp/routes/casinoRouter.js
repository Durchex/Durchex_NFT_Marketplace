import express from 'express';
import { placeBet, minesCashout, getRound, getConfig, getAnalytics } from '../controllers/casinoController.js';

const router = express.Router();

router.post('/place-bet', placeBet);
router.post('/mines-cashout', minesCashout);
router.get('/round/:id', getRound);
router.get('/config', getConfig);
router.get('/analytics', getAnalytics);

export default router;
