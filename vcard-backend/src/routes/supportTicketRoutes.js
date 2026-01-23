const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicketStatus
} = require('../controllers/supportTicketController');
const adminMiddleware = require('../middleware/adminMiddleware');
const { supportLimiter } = require('../middleware/rateLimiter');

// User
router.post('/', auth, supportLimiter, createTicket);
router.get('/my', auth, getMyTickets);

// Admin
router.get('/', auth, adminMiddleware, getAllTickets);
router.patch('/:id/status', auth, adminMiddleware, updateTicketStatus);

module.exports = router;
