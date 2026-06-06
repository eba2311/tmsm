const express = require('express');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');
const { bookingLimiter } = require('../middlewares/rateLimiter');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const router = express.Router();
router.use(authenticate);

// Helper to validate UUIDs
const isValidUUID = (uuid) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

// GET /api/v1/bookings
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    // Passengers only see their own bookings
    if (req.user.role === 'PASSENGER') {
      where.passengerId = req.user.id;
    }
    
    if (status) where.status = status;

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where,
      include: [
        {
          model: Schedule,
          as: 'schedule',
          include: [
            {
              model: require('../models/Route'),
              as: 'route',
              attributes: ['id', 'name', 'origin', 'destination']
            }
          ],
          attributes: ['id', 'departureTime']
        },
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: bookings, pagination: { total: count, page: Number(page), limit: Number(limit), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
});

// GET /api/v1/bookings/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Schedule,
          as: 'schedule',
          include: [
            {
              model: require('../models/Route'),
              as: 'route',
              attributes: ['id', 'name']
            },
            {
              model: require('../models/Vehicle'),
              as: 'vehicle',
              attributes: ['plateNumber', 'type']
            },
            {
              model: require('../models/Driver'),
              as: 'driver',
              include: [
                { model: User, as: 'user', attributes: ['name'] }
              ]
            }
          ]
        },
        {
          model: User,
          as: 'passenger',
          attributes: ['name', 'email', 'phone']
        }
      ]
    });
      
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    // IDOR Protection: Passengers can only view their own bookings
    if (req.user.role === 'PASSENGER' && booking.passengerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this booking' });
    }
    
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// POST /api/v1/bookings
router.post('/', bookingLimiter, async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { scheduleId, passengers, paymentMethod } = req.body;

    if (!Array.isArray(passengers) || passengers.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'At least one passenger with seat is required' });
    }

    if (!isValidUUID(scheduleId)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Invalid schedule ID' });
    }

    // 1. Get Schedule with row-level lock
    const schedule = await Schedule.findByPk(scheduleId, { transaction: t, lock: t.LOCK.UPDATE });
      
    if (!schedule) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    if (schedule.availableSeats < passengers.length) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Not enough seats available' });
    }

    const seatNumbers = passengers.map((p) => String(p.seatNumber)).filter((n) => n != null && n !== 'undefined');
    if (seatNumbers.length !== passengers.length) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Each passenger must include a seatNumber' });
    }
    
    const dupSeat = seatNumbers.find((s, i) => seatNumbers.indexOf(s) !== i);
    if (dupSeat != null) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Duplicate seat numbers in request' });
    }

    // 2. Check for taken seats (from passengers JSONB)
    const existingBookings = await Booking.findAll({
      where: {
        scheduleId: scheduleId,
        status: ['PENDING', 'CONFIRMED']
      },
      attributes: ['passengers'],
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    
    const takenSeats = new Set();
    existingBookings.forEach(b => {
      if (b.passengers && Array.isArray(b.passengers)) {
        b.passengers.forEach(p => {
          if (p.seatNumber) takenSeats.add(String(p.seatNumber));
        });
      }
    });
    const clash = seatNumbers.find(s => takenSeats.has(s));
    if (clash) {
      await t.rollback();
      return res.status(400).json({ success: false, message: `Seat ${clash} is already reserved` });
    }

    const farePerSeat = schedule.fare;
    
    // 3. Insert Booking (one booking with all passengers)
    const booking = await Booking.create({
      scheduleId: scheduleId,
      passengerId: req.user.id,
      passengers: passengers,
      totalAmount: farePerSeat * passengers.length,
      status: 'PENDING',
      paymentStatus: 'UNPAID'
    }, { transaction: t });

    // 4. Update available seats
    await schedule.update({ availableSeats: schedule.availableSeats - passengers.length }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    await t.rollback();
    next(err);
  }
});

// PATCH /api/v1/bookings/:id/cancel
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    
    const booking = await Booking.findByPk(req.params.id);
      
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (booking.passengerId !== req.user.id && !['SUPER_ADMIN', 'OPERATOR', 'AGENT'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await booking.update({ status: 'CANCELLED' });

    // Release 1 seat
    const schedule = await Schedule.findByPk(booking.scheduleId);
    if (schedule) {
      await schedule.update({ availableSeats: schedule.availableSeats + 1 });
    }

    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// PATCH /api/v1/bookings/:id/checkin
router.patch('/:id/checkin', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT', 'DRIVER'), async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await booking.update({ status: 'USED' });
      
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// GET /api/v1/bookings/:id/qr
router.get('/:id/qr', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (req.user.role === 'PASSENGER' && booking.passengerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const qrData = JSON.stringify({ bookingId: booking.id, passengerId: booking.passengerId, status: booking.status });
    const qrCodeImage = await QRCode.toDataURL(qrData);
    
    res.json({ success: true, data: { qrCode: qrCodeImage } });
  } catch (err) { next(err); }
});

module.exports = router;
