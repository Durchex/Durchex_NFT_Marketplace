import express from 'express';
import { getReviews, createReview, getReviewStats } from '../controllers/reviewController.js';

const router = express.Router();

router.get('/', getReviews);
router.get('/stats', getReviewStats);
router.post('/', createReview);

export default router;
