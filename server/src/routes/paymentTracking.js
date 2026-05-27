const express = require('express');
const PaymentTracking = require('../models/PaymentTracking');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate, authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'));

// GET /api/v1/payment-tracking
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const { count, rows: payments } = await PaymentTracking.findAndCountAll({
      where,
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            { model: User, as: 'passenger', attributes: ['name', 'email', 'phone'] }
          ],
          attributes: ['id', 'amountPaid', 'status', 'bookingDate', 'seatNumber', 'scheduleId']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: payments, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// GET /api/v1/payment-tracking/summary
router.get('/summary', async (req, res, next) => {
  try {
    const payments = await PaymentTracking.findAll({ attributes: ['amount', 'status'] });
    const paid = payments.filter(p => ['COMPLETED', 'CONFIRMED'].includes(p.status));
    const pending = payments.filter(p => p.status === 'PENDING');
    const totalPaid = paid.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const totalPending = pending.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    res.json({ success: true, data: { totalPaid, totalPending, paidCount: paid.length, pendingCount: pending.length } });
  } catch (err) { next(err); }
});

// GET /api/v1/payment-tracking/:id
router.get('/:id', async (req, res, next) => {
  try {
    const payment = await PaymentTracking.findByPk(req.params.id, {
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            { model: User, as: 'passenger', attributes: ['name', 'email', 'phone'] }
          ]
        }
      ]
    });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// PATCH /api/v1/payment-tracking/:id/confirm
router.patch('/:id/confirm', async (req, res, next) => {
  try {
    const payment = await PaymentTracking.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    await payment.update({ status: 'COMPLETED' });
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

module.exports = router;
