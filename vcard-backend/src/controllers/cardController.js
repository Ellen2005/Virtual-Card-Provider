const db = require('../config/database');
const crypto = require('crypto');

const generateCardNumber = async () => {
  let cardNumber;
  let exists = true;

  while (exists) {
    cardNumber = Math.floor(
      1000000000000000 + Math.random() * 9000000000000000
    ).toString();

    const [rows] = await db.query(
      'SELECT id FROM cards WHERE card_number = ?',
      [cardNumber]
    );

    exists = rows.length > 0;
  }

  return cardNumber;
};

const generateCVV = () =>
  Math.floor(100 + Math.random() * 900).toString();

exports.createCard = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const cardNumber = await generateCardNumber();
    const cvv = generateCVV();
    const expiry = '12/28';

    const [result] = await conn.query(
      `INSERT INTO cards (user_id, card_number, cvv, expiry_date)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, cardNumber, cvv, expiry]
    );

    await conn.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Card Created', 'Your virtual card was created successfully', 'SUCCESS')`,
      [req.user.id]
    );

    await conn.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'CREATE_CARD', 'CARD', ?)`,
      [req.user.id, result.insertId]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Virtual card created'
    });
  } catch (error) {
    await conn.rollback();
    console.error('CREATE CARD ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Card creation failed'
    });
  } finally {
    conn.release();
  }
};

exports.getUserCards = async (req, res) => {
  const [cards] = await db.query(
    `SELECT id, card_number, expiry_date, is_active, is_frozen, daily_limit
     FROM cards WHERE user_id = ?`,
    [req.user.id]
  );

  res.json({ success: true, data: cards });
};

exports.toggleFreezeCard = async (req, res) => {
  const cardId = req.params.id;
  const userId = req.user.id;

  await db.query(
    `UPDATE cards SET is_frozen = !is_frozen WHERE id = ? AND user_id = ?`,
    [cardId, userId]
  );

await db.query(
  `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
   VALUES (?, 'TOGGLE_FREEZE_CARD', 'CARD', ?)`,
  [userId, cardId]
);

  res.json({ success: true, message: 'Card status updated' });
};

exports.deleteCard = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const [result] = await db.query(
    'DELETE FROM cards WHERE id = ? AND user_id = ?',
    [id, userId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Card not found' });
  }

  res.json({ success: true, message: 'Card deleted' });
};
