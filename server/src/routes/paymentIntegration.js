const express = require('express');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate, authorize('SUPER_ADMIN', 'OPERATOR'));

// GET /api/v1/payment-integration/providers
router.get('/providers', async (req, res, next) => {
  res.json({ success: true, data: [
    { id: 'telebirr', name: 'Telebirr', status: 'ACTIVE', type: 'MOBILE_MONEY' },
    { id: 'cbe_birr', name: 'CBE Birr', status: 'ACTIVE', type: 'MOBILE_MONEY' },
    { id: 'cash', name: 'Cash', status: 'ACTIVE', type: 'CASH' }
  ]});
});

// GET /api/v1/payment-integration/transactions
router.get('/transactions', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: { status: ['CONFIRMED', 'USED'] },
      include: [
        { model: User, as: 'passenger', attributes: ['name', 'email'] }
      ],
      attributes: ['id', 'totalAmount', 'status', 'created_at', 'passengers'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: bookings, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// POST /api/v1/payment-integration/refund
router.post('/refund', async (req, res, next) => {
  try {
    const { bookingId, amount, reason } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId is required' });
    
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await booking.update({ status: 'CANCELLED' });
    res.json({ success: true, data: { ...booking.toJSON(), refundAmount: amount, reason } });
  } catch (err) { next(err); }
});

// GET /api/v1/payment-integration/summary
router.get('/summary', async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { status: ['CONFIRMED', 'USED'] },
      attributes: ['totalAmount', 'status']
    });
    const total = bookings.reduce((s, b) => s + (parseFloat(b.totalAmount) || 0), 0);
    res.json({ success: true, data: { totalRevenue: total, totalTransactions: bookings.length, refunds: 0 } });
  } catch (err) { next(err); }
});

module.exports = router;
