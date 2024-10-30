import express from "express";
import { HandleAddToCart, HandleGetCart, HandleUpdateCart } from '../controllers/CartController.js';

const router = express.Router();

router.post('/add', HandleAddToCart);
router.get('/:userId', HandleGetCart);
router.put('/:userId', HandleGetCart);

export default router;
