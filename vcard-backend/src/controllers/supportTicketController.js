const db = require('../config/database');

// USER: Create ticket
exports.createTicket = async (req, res) => {
  const { subject, description, priority } = req.body;

  if (!subject || !description) {
    return res.status(400).json({
      success: false,
      message: 'Subject and description are required'
    });
  }

  await db.query(
    `INSERT INTO support_tickets 
     (user_id, subject, description, priority)
     VALUES (?, ?, ?, ?)`,
    [req.user.id, subject, description, priority || 'MEDIUM']
  );

  res.status(201).json({
    success: true,
    message: 'Support ticket created'
  });
};

// USER: Get own tickets
// USER: Get own tickets
exports.getMyTickets = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, subject, description, status, priority, admin_response, created_at, updated_at
       FROM support_tickets
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    console.log('Backend response:', {
      success: true,
      dataLength: rows?.length || 0,
      data: rows
    });

    res.json({ 
      success: true, 
      data: rows || [],
      count: rows?.length || 0
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tickets',
      data: [],
      error: error.message
    });
  }
};

// ADMIN: Get all tickets
exports.getAllTickets = async (req, res) => {
  const [rows] = await db.query(
    `SELECT t.*, u.email
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     ORDER BY created_at DESC`
  );

  res.json({ success: true, data: rows });
};

// ADMIN: Update ticket
exports.updateTicketStatus = async (req, res) => {
  const { status, admin_response } = req.body;

  await db.query(
    `UPDATE support_tickets
     SET status = ?, admin_response = ?
     WHERE id = ?`,
    [status, admin_response || null, req.params.id]
  );

  res.json({ success: true, message: 'Ticket updated' });
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status, admin_response } = req.body;
    const ticketId = req.params.id;
    
    // First get the ticket to know the user
    const [[ticket]] = await db.query(
      'SELECT user_id FROM support_tickets WHERE id = ?',
      [ticketId]
    );
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    // Update the ticket
    await db.query(
      `UPDATE support_tickets
       SET status = ?, admin_response = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, admin_response || null, ticketId]
    );
    
    // Create notification for the user
    if (admin_response) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Support Ticket Update', ?, 'INFO')`,
        [ticket.user_id, `Your support ticket has been updated. Admin response: ${admin_response}`]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Ticket updated successfully' 
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update ticket' 
    });
  }
};
