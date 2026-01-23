const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const transactionController = require('../controllers/transactionController');
const { mediumLimiter } = require('../middleware/rateLimiter');

router.get('/', authMiddleware, mediumLimiter,  transactionController.getUserTransactions);

module.exports = router;
