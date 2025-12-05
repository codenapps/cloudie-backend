import express from "express";
import { HandleAddToCart, HandleGetCart, HandleUpdateCart, HandleDeleteCartItem } from '../controllers/CartController.js';

const router = express.Router();


router.post('/add', HandleAddToCart);

router.get('/:userId', HandleGetCart);

router.put('/:userId', HandleUpdateCart);

router.delete('/:userId/:productId', HandleDeleteCartItem);


export default router;
