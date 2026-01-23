// controllers/paymentController.js
const db = require('../config/database');
const crypto = require('crypto');

exports.simulatePayment = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { card_id, amount, merchant_name } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (!card_id) {
      return res.status(400).json({
        success: false,
        message: 'Card ID is required'
      });
    }

    if (!merchant_name) {
      return res.status(400).json({
        success: false,
        message: 'Merchant name is required'
      });
    }

    await conn.beginTransaction();

    // 1️⃣ Get card
    const [[card]] = await conn.query(
      `SELECT * FROM cards WHERE id = ? AND user_id = ?`,
      [card_id, userId]
    );

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    if (card.is_frozen) {
      return res.status(400).json({
        success: false,
        message: 'Card is frozen'
      });
    }

    // 2️⃣ Check wallet balance
    const [[userBalance]] = await conn.query(
      `SELECT wallet_balance FROM users WHERE id = ?`,
      [userId]
    );

    if (parseFloat(userBalance.wallet_balance) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // 3️⃣ Simulate random failure (30%)
    const failed = Math.random() < 0.3;
    const reference = crypto.randomUUID();

    if (failed) {
      // ❌ FAILED PAYMENT
      await conn.query(
        `INSERT INTO transactions
         (user_id, card_id, amount, transaction_type, status, reference, description, merchant_name)
         VALUES (?, ?, ?, 'PAYMENT', 'FAILED', ?, ?, ?)`,
        [userId, card_id, amount, reference, `Payment failed for ${merchant_name}`, merchant_name]
      );

      // 🔍 FRAUD CHECK: failures in last 5 mins
      const [[count]] = await conn.query(
        `SELECT COUNT(*) as total FROM transactions
         WHERE card_id = ?
         AND status = 'FAILED'
         AND created_at >= NOW() - INTERVAL 5 MINUTE`,
        [card_id]
      );

      if (count.total >= 3) {
        // 🚨 AUTO-FREEZE CARD
        await conn.query(
          `UPDATE cards SET is_frozen = 1 WHERE id = ?`,
          [card_id]
        );

        await conn.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES (?, 'Card Frozen', 'Card automatically frozen due to suspicious activity', 'WARNING')`,
          [userId]
        );
      }

      await conn.commit();

      return res.status(400).json({  // CHANGED: Return 400 status for failure
        success: false,
        message: 'Payment failed - Please try again'
      });
    }

    // ✅ SUCCESS PAYMENT
    // Update wallet balance
    await conn.query(
      `UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?`,
      [amount, userId]
    );

    // Insert transaction
    await conn.query(
      `INSERT INTO transactions
       (user_id, card_id, amount, transaction_type, status, reference, merchant_name, description)
       VALUES (?, ?, ?, 'PAYMENT', 'SUCCESS', ?, ?, ?)`,
      [userId, card_id, amount, reference, merchant_name, `Payment to ${merchant_name}`]
    );

    // Get updated balance
    const [[updatedBalance]] = await conn.query(
      `SELECT wallet_balance FROM users WHERE id = ?`,
      [userId]
    );

    await conn.commit();

    return res.json({
      success: true,
      message: 'Payment successful',
      data: {
        reference: reference,
        amount: parseFloat(amount),
        merchant: merchant_name,
        new_balance: parseFloat(updatedBalance.wallet_balance),
        transaction_type: 'PAYMENT',
        status: 'SUCCESS'
      }
    });

  } catch (err) {
    await conn.rollback();
    console.error('Payment error:', err);
    
    return res.status(500).json({
      success: false,
      message: err.message || 'Payment processing error'
    });
  } finally {
    conn.release();
  }
};