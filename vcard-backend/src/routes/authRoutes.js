const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
  updateProfile,
  verifyEmail,
  resendVerification,
  getVerificationStatus
} = require('../controllers/authController');

const {
  googleAuth,
  googleCallback
} = require('../controllers/oauthController');

const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} = require('../middleware/validation');

const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter, mediumLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/forgot-password', mediumLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', mediumLimiter, validateResetPassword, resetPassword);
router.get('/verify-email', verifyEmail);

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Private routes (require authentication)
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);
router.put('/update-profile', mediumLimiter, authMiddleware, updateProfile);
router.post('/resend-verification', authMiddleware, resendVerification);
router.get('/verification-status', authMiddleware, getVerificationStatus); 

module.exports = router;