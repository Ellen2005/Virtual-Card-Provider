const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { fundWallet, getBalance, getOverview } = require('../controllers/walletController');
const { paymentLimiter, mediumLimiter } = require('../middleware/rateLimiter');

router.get('/balance', authMiddleware, getBalance);
router.post('/fund', paymentLimiter, authMiddleware, fundWallet);
router.get('/overview', authMiddleware, getOverview);

module.exports = router;
