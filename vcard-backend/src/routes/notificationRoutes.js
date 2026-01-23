const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead
} = require('../controllers/notificationController');
const { mediumLimiter } = require('../middleware/rateLimiter');

router.get('/', authMiddleware, mediumLimiter, getNotifications);
router.patch('/:id/read', authMiddleware, mediumLimiter, markAsRead);

module.exports = router;
