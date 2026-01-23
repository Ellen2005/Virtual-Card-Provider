const rateLimit = require('express-rate-limit');

exports.paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // max 10 payment attempts
  message: {
    success: false,
    message: 'Too many payment attempts. Try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.mediumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

exports.globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

exports.supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 tickets per hour
  message: {
    success: false,
    message: 'Too many support requests. Please wait before submitting another ticket.'
  }
});

module.exports = exports;