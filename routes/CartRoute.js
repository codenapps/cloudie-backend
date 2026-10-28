import express from "express";
import { HandleAddToCart, HandleGetCart, HandleUpdateCart, HandleDeleteCartItem } from '../controllers/CartController.js';
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All cart routes require authentication
router.use(authenticateToken);

router.post('/add', HandleAddToCart);
router.get('/:userId', HandleGetCart);
router.put('/:userId', HandleUpdateCart);
router.delete('/:userId/:productId', HandleDeleteCartItem);

export default router;
