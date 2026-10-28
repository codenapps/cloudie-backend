// routes/cardRoutes.js
import express from 'express';
import { addCard, getUserCards, updateCard } from '../controllers/CardController.js';
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All card routes require authentication
router.use(authenticateToken);

router.post('/add', addCard);
router.get('/:userId', getUserCards);
router.patch('/update/:cardId', updateCard);

export default router;
