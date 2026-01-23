const db = require('../config/database');

const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// All admin routes require authentication + admin role
router.get('/stats', authMiddleware, adminMiddleware, getStats);

// You can add more admin routes here
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        COALESCE(wallet_balance, 0) as wallet_balance, 
        COALESCE(role, 'USER') as role, 
        COALESCE(is_verified, 0) as is_verified,
        COALESCE(is_active, 1) as is_active,
        CASE 
          WHEN is_active = 0 THEN 'Inactive' 
          ELSE 'Active' 
        END as status,
        created_at 
      FROM users 
      ORDER BY created_at DESC`
    );
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/transactions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [transactions] = await db.query(
      `SELECT 
        t.*, 
        u.email as user_email,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

router.get('/support-tickets', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [tickets] = await db.query(
      `SELECT 
        t.*, 
        u.email as user_email,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
       FROM support_tickets t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    res.json({ success: true, data: tickets });
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
});

router.patch('/support-tickets/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_response } = req.body;
    
    await db.query(
      `UPDATE support_tickets 
       SET status = ?, admin_response = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, admin_response, id]
    );
    
    res.json({ success: true, message: 'Ticket updated' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
});

module.exports = router;