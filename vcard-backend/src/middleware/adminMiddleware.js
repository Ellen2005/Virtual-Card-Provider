// middleware/adminMiddleware.js
module.exports = (req, res, next) => {
  // Log for debugging
  console.log('🔐 Admin middleware check:', {
    userId: req.user?.id,
    userRole: req.user?.role,
    userEmail: req.user?.email
  });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // ✅ Check if role exists and is ADMIN (case insensitive)
  if (!req.user.role || req.user.role.toUpperCase() !== 'ADMIN') {
    console.log(`❌ Admin access denied. User role: ${req.user.role}`);
    return res.status(403).json({
      success: false,
      message: `Admin access only. Your role: ${req.user.role || 'not set'}`
    });
  }
  
  console.log('✅ Admin access granted');
  next();
};