const express = require('express');
const Joi = require('joi');
const PaymentTracking = require('../models/PaymentTracking');
const Booking = require('../models/Booking');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

const paymentTrackingSchema = Joi.object({
  transactionId: Joi.string().required(),
  booking: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  currency: Joi.string().valid('ETB', 'USD', 'EUR').default('ETB'),
  method: Joi.string().valid('TELEBIRR', 'CBE_BIRR', 'AMOLE', 'CASH', 'CARD', 'BANK_TRANSFER').required(),
  metadata: Joi.object({
    phoneNumber: Joi.string().optional(),
    cardLast4: Joi.string().optional(),
    cardBrand: Joi.string().optional(),
    bankName: Joi.string().optional(),
    accountNumber: Joi.string().optional(),
    receiptNumber: Joi.string().optional(),
    notes: Joi.string().optional(),
  }).optional(),
});

// GET /api/v1/payment-tracking
router.get('/', async (req, res, next) => {
  try {
    const { status, method, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (startDate || endDate) {
      filter['timestamps.initiated'] = {};
      if (startDate) filter['timestamps.initiated'].$gte = new Date(startDate);
      if (endDate) filter['timestamps.initiated'].$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      PaymentTracking.find(filter)
        .populate('booking', 'reference passengerName routeName')
        .populate('user', 'name email')
        .sort({ 'timestamps.initiated': -1 })
        .skip(skip)
        .limit(Number(limit)),
      PaymentTracking.countDocuments(filter),
    ]);

    const stats = await PaymentTracking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
          refundedCount: { $sum: { $cond: [{ $eq: ['$status', 'REFUNDED'] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
      stats: stats[0] || { totalAmount: 0, completedCount: 0, pendingCount: 0, failedCount: 0, refundedCount: 0 },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/payment-tracking/stats
router.get('/stats', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter['timestamps.initiated'] = {};
      if (startDate) filter['timestamps.initiated'].$gte = new Date(startDate);
      if (endDate) filter['timestamps.initiated'].$lte = new Date(endDate);
    }

    const stats = await PaymentTracking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$method',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const overallStats = await PaymentTracking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$amount', 0] } },
          totalTransactions: { $sum: 1 },
          successRate: { $avg: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          avgTransactionValue: { $avg: '$amount' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        byMethod: stats,
        overall: overallStats[0] || { totalRevenue: 0, totalTransactions: 0, successRate: 0, avgTransactionValue: 0 },
      },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/payment-tracking/:id
router.get('/:id', async (req, res, next) => {
  try {
    const payment = await PaymentTracking.findById(req.params.id)
      .populate('booking')
      .populate('user')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!payment) return res.status(404).json({ success: false, message: 'Payment tracking not found' });
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// POST /api/v1/payment-tracking
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const { error, value } = paymentTrackingSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const booking = await Booking.findById(value.booking);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const payment = await PaymentTracking.create({
      ...value,
      user: req.user._id,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// PUT /api/v1/payment-tracking/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const payment = await PaymentTracking.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    
    if (!payment) return res.status(404).json({ success: false, message: 'Payment tracking not found' });
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// POST /api/v1/payment-tracking/:id/complete
router.post('/:id/complete', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { gatewayTransactionId, gatewayResponse } = req.body;
    const payment = await PaymentTracking.findById(req.params.id);
    
    if (!payment) return res.status(404).json({ success: false, message: 'Payment tracking not found' });
    
    await payment.markCompleted(gatewayTransactionId, gatewayResponse);
    
    // Update booking status
    await Booking.findByIdAndUpdate(payment.booking, { status: 'CONFIRMED', paymentStatus: 'PAID' });
    
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// POST /api/v1/payment-tracking/:id/fail
router.post('/:id/fail', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const payment = await PaymentTracking.findById(req.params.id);
    
    if (!payment) return res.status(404).json({ success: false, message: 'Payment tracking not found' });
    
    await payment.markFailed(reason);
    
    // Update booking status
    await Booking.findByIdAndUpdate(payment.booking, { status: 'CANCELLED', paymentStatus: 'FAILED' });
    
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// POST /api/v1/payment-tracking/:id/refund
router.post('/:id/refund', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { refundAmount, reason } = req.body;
    const payment = await PaymentTracking.findById(req.params.id);
    
    if (!payment) return res.status(404).json({ success: false, message: 'Payment tracking not found' });
    
    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Only completed payments can be refunded' });
    }
    
    await payment.processRefund(refundAmount || payment.amount, reason);
    
    // Update booking status
    await Booking.findByIdAndUpdate(payment.booking, { status: 'CANCELLED', paymentStatus: 'REFUNDED' });
    
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// DELETE /api/v1/payment-tracking/:id
router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const payment = await PaymentTracking.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment tracking not found' });
    res.json({ success: true, message: 'Payment tracking deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
