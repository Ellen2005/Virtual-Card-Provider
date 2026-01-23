// controllers/transactionController.js - UPDATED
const db = require('../config/database');

exports.getUserTransactions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         t.id,
         t.amount,
         t.transaction_type,
         t.merchant_name,
         t.status,
         t.reference,
         t.description,
         t.created_at,
         c.card_number
       FROM transactions t
       LEFT JOIN cards c ON t.card_id = c.id
       WHERE t.user_id = ?
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    
    // Format the data
    const formattedRows = rows.map(row => ({
      id: row.id,
      amount: parseFloat(row.amount),
      transaction_type: row.transaction_type,
      merchant_name: row.merchant_name,
      status: row.status,
      reference: row.reference,
      description: row.description || `Payment via card ending in ${row.card_number?.slice(-4) || 'N/A'}`,
      created_at: row.created_at,
      card_last_four: row.card_number?.slice(-4)
    }));
    
    res.json({
      success: true,
      data: formattedRows
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
};
