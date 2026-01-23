const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createCard,
  getUserCards,
  toggleFreezeCard,
  deleteCard
} = require('../controllers/cardController');
const { mediumLimiter } = require('../middleware/rateLimiter');

router.post('/', authMiddleware, mediumLimiter, createCard);
router.get('/', authMiddleware, getUserCards);
router.patch('/:id/freeze', authMiddleware, mediumLimiter, toggleFreezeCard);
router.delete('/:id', authMiddleware, mediumLimiter, deleteCard);

module.exports = router;
