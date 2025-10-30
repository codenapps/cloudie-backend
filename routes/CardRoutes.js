// routes/cardRoutes.js
import express from 'express';
import { addCard, getUserCards, updateCard } from '../controllers/CardController.js';

const router = express.Router();

router.post('/add', addCard);
router.get('/:userId', getUserCards);
router.patch('/update/:cardId', updateCard);

export default router;
