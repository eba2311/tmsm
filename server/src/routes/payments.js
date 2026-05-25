const express = require('express');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { authenticate, authorize } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/receipts';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `receipt-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only images and PDFs allowed'));
  },
});

router.use(authenticate);

// GET /api/v1/payments
router.get('/', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, method } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;

    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('booking', 'bookingRef totalAmount status')
        .populate('user', 'name email phone')
        .skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Payment.countDocuments(filter),
    ]);
    res.json({ success: true, data: payments, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// POST /api/v1/payments — initiate payment
router.post('/', upload.single('receipt'), async (req, res, next) => {
  try {
    const { bookingId, method, amount } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const paymentData = {
      booking: bookingId,
      user: req.user._id,
      amount: amount || booking.totalAmount,
      method,
      status: 'PENDING',
      processedBy: req.user._id,
    };

    if (req.file) {
      paymentData.receiptUrl = `/uploads/receipts/${req.file.filename}`;
      paymentData.notes = 'Payment evidence provided by user';
    }

    const payment = await Payment.create(paymentData);

    const finalize = async () => {
      payment.status = 'SUCCESS';
      payment.paidAt = new Date();
      if (!payment.transactionId) payment.transactionId = `TXN-${Date.now()}`;
      await payment.save();
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paymentMethod: method,
      });
      // Create notification and emit
      try {
        const Notification = require('../models/Notification');
        const bookingDoc = await Booking.findById(bookingId).select('passenger bookingRef');
        const n = await Notification.create({
          recipient: bookingDoc.passenger,
          type: 'PAYMENT_SUCCESS',
          title: 'Payment received',
          message: `Payment for ${bookingDoc.bookingRef} received. Your booking is confirmed.`,
          data: { booking: bookingId, payment: payment._id },
          channel: ['IN_APP'],
        });
        const ns = req.app.locals.notificationsNs;
        if (ns && ns.sendToUser) ns.sendToUser(bookingDoc.passenger.toString(), n);
      } catch (e) {
        // ignore notification errors
      }
    };

    // Cash: always settle immediately at terminal / agent desk
    if (method === 'CASH') {
      await finalize();
    } else if (process.env.NODE_ENV !== 'production') {
      // Dev / staging: simulate Telebirr, CBE Birr, cards without external gateways
      await finalize();
    }

    res.status(201).json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// POST /api/v1/payments/webhook — payment gateway callback
router.post('/webhook', async (req, res, next) => {
  try {
    const { transactionId, status, bookingRef, gatewayResponse } = req.body;

    const booking = await Booking.findOne({ bookingRef });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const payment = await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        transactionId,
        status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        gatewayResponse,
        paidAt: status === 'SUCCESS' ? new Date() : undefined,
      },
      { new: true }
    );

    if (status === 'SUCCESS') {
      await Booking.findByIdAndUpdate(booking._id, { paymentStatus: 'PAID', status: 'CONFIRMED' });
    }

    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// GET /api/v1/payments/summary
router.get('/summary', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const summary = await Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

module.exports = router;
