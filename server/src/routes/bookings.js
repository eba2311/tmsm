const express = require('express');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middlewares/auth');
const { bookingLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/bookings
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    const filter = {};
    // Passengers only see their own bookings
    if (req.user.role === 'PASSENGER') filter.passenger = req.user._id;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate({ path: 'schedule', populate: { path: 'route', select: 'name origin destination' } })
        .populate('passenger', 'name email phone')
        .skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Booking.countDocuments(filter),
    ]);
    res.json({ success: true, data: bookings, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /api/v1/bookings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'schedule', populate: [{ path: 'route' }, { path: 'vehicle', select: 'plateNumber type' }, { path: 'driver' }] })
      .populate('passenger', 'name email phone')
      .populate('agent', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// POST /api/v1/bookings
router.post('/', bookingLimiter, async (req, res, next) => {
  try {
    const { scheduleId, passengers, paymentMethod, boardingPoint, droppingPoint } = req.body;

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one passenger with seat is required' });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    if (schedule.availableSeats < passengers.length) {
      return res.status(400).json({ success: false, message: 'Not enough seats available' });
    }

    const seatNumbers = passengers.map((p) => p.seatNumber).filter((n) => n != null);
    if (seatNumbers.length !== passengers.length) {
      return res.status(400).json({ success: false, message: 'Each passenger must include a seatNumber' });
    }
    const dupSeat = seatNumbers.find((s, i) => seatNumbers.indexOf(s) !== i);
    if (dupSeat != null) {
      return res.status(400).json({ success: false, message: 'Duplicate seat numbers in request' });
    }

    const occupiedAgg = await Booking.aggregate([
      {
        $match: {
          schedule: schedule._id,
          status: { $in: ['PENDING', 'CONFIRMED'] },
        },
      },
      { $unwind: '$passengers' },
      { $group: { _id: null, seats: { $addToSet: '$passengers.seatNumber' } } },
    ]);
    const takenSeats = new Set(occupiedAgg[0]?.seats || []);
    const clash = seatNumbers.find((s) => takenSeats.has(s));
    if (clash != null) {
      return res.status(400).json({ success: false, message: `Seat ${clash} is already reserved` });
    }

    const totalAmount = schedule.fare * passengers.length;

    // Generate QR code
    const bookingRef = `AM${Date.now().toString(36).toUpperCase()}`;
    const qrData = JSON.stringify({ bookingRef, scheduleId, totalAmount, passengers: passengers.length });
    const qrCode = await QRCode.toDataURL(qrData);

    const booking = await Booking.create({
      bookingRef,
      schedule: scheduleId,
      passenger: req.user._id,
      agent: ['AGENT'].includes(req.user.role) ? req.user._id : null,
      passengers: passengers.map((p, i) => ({ ...p, ticketNumber: `${bookingRef}-${i + 1}` })),
      totalAmount,
      paymentMethod,
      boardingPoint,
      droppingPoint,
      qrCode,
      qrCodeData: qrData,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
    });

    // Reserve seats
    await Schedule.findByIdAndUpdate(scheduleId, { $inc: { availableSeats: -passengers.length } });

    // Create in-app notification for passenger
    try {
      const n = await Notification.create({
        recipient: req.user._id,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking created',
        message: `Your booking ${booking.bookingRef} was created (pending payment).`,
        data: { booking: booking._id },
        channel: ['IN_APP'],
      });
      const ns = req.app.locals.notificationsNs;
      if (ns && ns.sendToUser) ns.sendToUser(req.user._id.toString(), n);
    } catch (e) {
      // swallow notification errors
    }

    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// PATCH /api/v1/bookings/:id/cancel
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.passenger.toString() !== req.user._id.toString() && !['SUPER_ADMIN', 'OPERATOR', 'AGENT'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    booking.status = 'CANCELLED';
    booking.cancellationReason = req.body.reason || 'User cancelled';
    await booking.save();

    // Release seats
    await Schedule.findByIdAndUpdate(booking.schedule, { $inc: { availableSeats: booking.passengers.length } });

    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// PATCH /api/v1/bookings/:id/checkin
router.patch('/:id/checkin', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT', 'DRIVER'), async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id,
      { checkedIn: true, checkedInAt: new Date(), status: 'USED' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

module.exports = router;
