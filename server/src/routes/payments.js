const express = require('express');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/payments
router.get('/', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'passenger',
          attributes: ['name', 'email', 'phone']
        }
      ],
      attributes: ['id', 'amountPaid', 'status', 'bookingDate', 'passengerId', 'scheduleId', 'seatNumber'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: bookings, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// POST /api/v1/payments — initiate payment
router.post('/', async (req, res, next) => {
  try {
    const { bookingId, method, amount } = req.body;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Update booking to CONFIRMED and paid
    await booking.update({ status: 'CONFIRMED', amountPaid: amount || booking.amountPaid });

    // Create payment record
    const payment = await Payment.create({
      bookingId: bookingId,
      userId: req.user.id,
      amount: amount || booking.amountPaid,
      method: method || 'CASH',
      status: 'COMPLETED',
      transactionId: `TXN-${Date.now()}`
    });

    res.status(201).json({ success: true, data: { ...booking.toJSON(), transactionId: payment.transactionId, method: payment.method, paidAt: payment.createdAt } });
  } catch (err) { next(err); }
});

// POST /api/v1/payments/webhook
router.post('/webhook', async (req, res, next) => {
  try {
    const { transactionId, status, bookingRef } = req.body;
    res.json({ success: true, message: 'Webhook received', transactionId });
  } catch (err) { next(err); }
});

// GET /api/v1/payments/summary
router.get('/summary', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { status: ['CONFIRMED', 'USED'] },
      attributes: ['amountPaid', 'status']
    });

    let total = 0;
    for (const b of bookings) total += parseFloat(b.amountPaid) || 0;

    res.json({ success: true, data: [{ id: 'CASH', total, count: bookings.length }] });
  } catch (err) { next(err); }
});

module.exports = router;
