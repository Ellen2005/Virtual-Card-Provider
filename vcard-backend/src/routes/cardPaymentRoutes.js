const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { simulatePayment } = require('../controllers/cardPaymentController');

router.post('/pay', authMiddleware, paymentLimiter, simulatePayment);

module.exports = router;
