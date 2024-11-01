import express from "express";
import { HandleAddToCart, HandleGetCart, HandleUpdateCart, HandleDeleteCartItem } from '../controllers/CartController.js';

const router = express.Router();

router.post('/add', HandleAddToCart);
router.get('/:userId', HandleGetCart);
router.delete('/:userId/:productId', HandleDeleteCartItem);
router.put('/:userId', HandleUpdateCart);

export default router;
