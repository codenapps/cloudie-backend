import express from 'express';
import { createReview, getProductReviews } from '../controllers/ReviewController.js';

const router = express.Router();

router.post('/products/:productId/reviews', createReview);

router.get('/products/:productId/reviews', getProductReviews);

export default router;