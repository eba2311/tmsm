const express = require('express');
const Joi = require('joi');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

const paymentSchema = Joi.object({
  booking: Joi.string().required(),
  method: Joi.string().valid('TELEBIRR', 'CBE_BIRR', 'AMOLE', 'CASH', 'CARD').required(),
  amount: Joi.number().min(0).required(),
  currency: Joi.string().default('ETB'),
  transactionId: Joi.string().optional(),
  phoneNumber: Joi.string().when('method', { is: 'TELEBIRR', then: Joi.required(), otherwise: Joi.optional() }),
  cardNumber: Joi.string().when('method', { is: 'CARD', then: Joi.required(), otherwise: Joi.optional() }),
  cardExpiry: Joi.string().when('method', { is: 'CARD', then: Joi.required(), otherwise: Joi.optional() }),
  cardCvv: Joi.string().when('method', { is: 'CARD', then: Joi.required(), otherwise: Joi.optional() }),
});

// GET /api/v1/payment-integration/methods
router.get('/methods', async (req, res, next) => {
  try {
    const methods = [
      {
        id: 'TELEBIRR',
        name: 'Telebirr',
        icon: 'telebirr',
        status: 'ACTIVE',
        fee: 0,
        processingTime: 'Instant',
      },
      {
        id: 'CBE_BIRR',
        name: 'CBE Birr',
        icon: 'cbe',
        status: 'ACTIVE',
        fee: 0,
        processingTime: 'Instant',
      },
      {
        id: 'AMOLE',
        name: 'Amole',
        icon: 'amole',
        status: 'ACTIVE',
        fee: 0,
        processingTime: 'Instant',
      },
      {
        id: 'CASH',
        name: 'Cash',
        icon: 'cash',
        status: 'ACTIVE',
        fee: 0,
        processingTime: 'Immediate',
      },
      {
        id: 'CARD',
        name: 'Credit/Debit Card',
        icon: 'card',
        status: 'ACTIVE',
        fee: 0.02,
        processingTime: 'Instant',
      },
    ];
    res.json({ success: true, data: methods });
  } catch (err) { next(err); }
});

// POST /api/v1/payment-integration/initiate
router.post('/initiate', async (req, res, next) => {
  try {
    const { error, value } = paymentSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const booking = await Booking.findById(value.booking);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Simulate payment initiation based on method
    const paymentData = await initiatePayment(value, booking);

    res.json({ success: true, data: paymentData });
  } catch (err) { next(err); }
});

// POST /api/v1/payment-integration/verify
router.post('/verify', async (req, res, next) => {
  try {
    const { transactionId, method } = req.body;
    if (!transactionId) return res.status(400).json({ success: false, message: 'Transaction ID required' });

    const verification = await verifyPayment(transactionId, method);
    res.json({ success: true, data: verification });
  } catch (err) { next(err); }
});

// POST /api/v1/payment-integration/webhook
router.post('/webhook/:method', async (req, res, next) => {
  try {
    const { method } = req.params;
    const webhookData = req.body;

    // Process webhook based on payment method
    const result = await processWebhook(method, webhookData);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/v1/payment-integration/transactions
router.get('/transactions', async (req, res, next) => {
  try {
    const { status, method, startDate, endDate } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Payment.find(filter)
      .populate('booking', 'reference')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: transactions });
  } catch (err) { next(err); }
});

async function initiatePayment(paymentData, booking) {
  // Simulate payment initiation based on method
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const payment = await Payment.create({
    booking: paymentData.booking,
    user: req.user?._id,
    method: paymentData.method,
    amount: paymentData.amount,
    currency: paymentData.currency || 'ETB',
    transactionId,
    status: 'PENDING',
    metadata: {
      phoneNumber: paymentData.phoneNumber,
      cardLast4: paymentData.cardNumber ? paymentData.cardNumber.slice(-4) : null,
    },
  });

  // Simulate different payment flows
  switch (paymentData.method) {
    case 'TELEBIRR':
      return {
        paymentId: payment._id,
        transactionId,
        method: 'TELEBIRR',
        status: 'PENDING',
        instructions: {
          action: 'DIAL',
          code: '*804#',
          merchantCode: 'DABUB001',
          amount: paymentData.amount,
        },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    case 'CBE_BIRR':
      return {
        paymentId: payment._id,
        transactionId,
        method: 'CBE_BIRR',
        status: 'PENDING',
        instructions: {
          action: 'REDIRECT',
          url: `https://cbe.com.et/pay/${transactionId}`,
          amount: paymentData.amount,
        },
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      };
    case 'AMOLE':
      return {
        paymentId: payment._id,
        transactionId,
        method: 'AMOLE',
        status: 'PENDING',
        instructions: {
          action: 'QR',
          qrCode: `AMOLE:${transactionId}:${paymentData.amount}`,
          amount: paymentData.amount,
        },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
    case 'CASH':
      await Payment.findByIdAndUpdate(payment._id, { status: 'COMPLETED' });
      return {
        paymentId: payment._id,
        transactionId,
        method: 'CASH',
        status: 'COMPLETED',
        message: 'Cash payment recorded',
      };
    case 'CARD':
      return {
        paymentId: payment._id,
        transactionId,
        method: 'CARD',
        status: 'PENDING',
        instructions: {
          action: 'CARD_DETAILS',
          amount: paymentData.amount,
          fee: paymentData.amount * 0.02,
        },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    default:
      return {
        paymentId: payment._id,
        transactionId,
        method: paymentData.method,
        status: 'PENDING',
      };
  }
}

async function verifyPayment(transactionId, method) {
  // Simulate payment verification
  const payment = await Payment.findOne({ transactionId });
  if (!payment) return { status: 'NOT_FOUND' };

  // In production, this would call the actual payment gateway API
  const isVerified = Math.random() > 0.1; // 90% success rate for demo
  
  if (isVerified) {
    await Payment.findByIdAndUpdate(payment._id, { status: 'COMPLETED' });
    await Booking.findByIdAndUpdate(payment.booking, { status: 'CONFIRMED' });
    return { status: 'COMPLETED', transactionId };
  } else {
    await Payment.findByIdAndUpdate(payment._id, { status: 'FAILED' });
    return { status: 'FAILED', transactionId };
  }
}

async function processWebhook(method, data) {
  // Process webhook from payment gateway
  const { transactionId, status } = data;
  const payment = await Payment.findOne({ transactionId });
  
  if (!payment) return { status: 'NOT_FOUND' };

  await Payment.findByIdAndUpdate(payment._id, { status });
  
  if (status === 'COMPLETED') {
    await Booking.findByIdAndUpdate(payment.booking, { status: 'CONFIRMED' });
  }

  return { status: 'PROCESSED', transactionId };
}

module.exports = router;
