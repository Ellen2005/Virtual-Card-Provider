const db = require('../config/database');

const getStats = async (req, res) => {
  try {
    console.log('📊 Admin stats requested by:', {
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role
    });

    const [[{ totalUsers }]] = await db.query(
      'SELECT COUNT(*) as totalUsers FROM users'
    );

    const [[{ totalCards }]] = await db.query(
      'SELECT COUNT(*) as totalCards FROM cards'
    );

    const today = new Date().toISOString().split('T')[0];
    const [[{ transactionsToday }]] = await db.query(
      `SELECT COUNT(*) as transactionsToday FROM transactions 
       WHERE DATE(created_at) = ?`,
      [today]
    );

    console.log('📊 Admin stats:', {
      totalUsers,
      totalCards,
      transactionsToday
    });

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(totalUsers),
        totalCards: parseInt(totalCards),
        transactionsToday: parseInt(transactionsToday)
      }
    });
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics'
    });
  }
};

module.exports = { getStats };