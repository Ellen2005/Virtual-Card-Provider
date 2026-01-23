// middleware/authMiddleware.js - FINAL CORRECTED VERSION
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ CORRECT: No JavaScript comments in SQL string!
    const [users] = await db.query(
      `SELECT id, email, first_name, last_name, phone, country_code, wallet_balance, 
              is_verified, role, created_at
       FROM users 
       WHERE id = ?`,
      [decoded.id]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    req.user = users[0];
    req.token = token;

    console.log('✅ Authenticated user:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role || 'USER'  // Default to USER if not set
    });

    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err.message);
    
    // More specific error messages
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = authMiddleware;