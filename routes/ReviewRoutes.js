import express from 'express';
import { createReview, getProductReviews, createRiderReview, getRiderReviews } from '../controllers/ReviewController.js';
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Public routes with optional auth
router.get('/products/:productId/reviews', optionalAuth, getProductReviews);
router.get('/rider/:userId/reviews', optionalAuth, getRiderReviews);

// Protected routes - require authentication
router.use(authenticateToken);

router.post('/products/:productId/reviews', createReview);
router.post('/rider/:userId/reviews', createRiderReview);

export default router;