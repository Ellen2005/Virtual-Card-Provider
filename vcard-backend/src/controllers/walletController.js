// controllers/walletController.js - UPDATED
const db = require('../config/database');
const crypto = require('crypto');

exports.getBalance = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT wallet_balance FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const balance = parseFloat(rows[0].wallet_balance) || 0;

    return res.json({
      success: true,
      balance,
      message: 'Balance retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Balance fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch balance'
    });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const [[{ total: active_cards }]] = await db.query(
      `SELECT COUNT(*) as total FROM cards WHERE user_id = ? AND is_frozen = 0`,
      [req.user.id]
    );

    const [[{ total: transactions }]] = await db.query(
      `SELECT COUNT(*) as total FROM transactions WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        wallet_balance: req.user.wallet_balance || 0,
        active_cards: parseInt(active_cards) || 0,
        transactions: parseInt(transactions) || 0 
      }
    });
  } catch (err) {
    console.error('Get overview error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get overview'
    });
  }
};

exports.fundWallet = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    await conn.beginTransaction();

    // Get current balance BEFORE update
    const [[{ current_balance }]] = await conn.query(
      'SELECT wallet_balance as current_balance FROM users WHERE id = ?',
      [req.user.id]
    );

    // Update wallet balance
    await conn.query(
      'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
      [amount, req.user.id]
    );

    // Get updated balance AFTER update
    const [[{ new_balance }]] = await conn.query(
      'SELECT wallet_balance as new_balance FROM users WHERE id = ?',
      [req.user.id]
    );

    const reference = crypto.randomUUID();
    
    // Record transaction
    await conn.query(
      `INSERT INTO transactions
       (user_id, amount, transaction_type, status, reference, description)
       VALUES (?, ?, 'FUNDING', 'SUCCESS', ?, 'Wallet funding')`,
      [req.user.id, amount, reference]
    );

    // ✅ Use the NEW balance in the notification message
    const notificationMessage = `Your wallet was funded with $${amount.toFixed(2)}. New balance: $${parseFloat(new_balance).toFixed(2)}`;
    
    // Send notification with updated balance
    await conn.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Wallet Funded', ?, 'SUCCESS')`,
      [req.user.id, notificationMessage]
    );

    await conn.commit();

    // Update the req.user object with new balance for this request
    req.user.wallet_balance = new_balance;

    res.json({
      success: true,
      message: 'Wallet funded successfully',
      data: {
        new_balance: parseFloat(new_balance),
        amount_funded: amount,
        previous_balance: parseFloat(current_balance)
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error('Fund wallet error:', err);
    res.status(500).json({
      success: false,
      message: 'Wallet funding failed'
    });
  } finally {
    conn.release();
  }
};
