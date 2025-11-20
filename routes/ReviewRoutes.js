import express from 'express';
import { createReview, getProductReviews, createRiderReview, getRiderReviews } from '../controllers/ReviewController.js';

const router = express.Router();

router.post('/products/:productId/reviews', createReview);

router.get('/products/:productId/reviews', getProductReviews);

router.post('/rider/:userId/reviews', createRiderReview);

router.get('/rider/:userId/reviews', getRiderReviews);

export default router;