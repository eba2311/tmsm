const express = require('express');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');
const { bookingLimiter } = require('../middlewares/rateLimiter');
const { Op } = require('sequelize');

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
    
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// POST /api/v1/bookings
router.post('/', bookingLimiter, async (req, res, next) => {
  try {
    const { scheduleId, passengers, paymentMethod } = req.body;

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one passenger with seat is required' });
    }

    if (!isValidUUID(scheduleId)) return res.status(400).json({ success: false, message: 'Invalid schedule ID' });

    // 1. Get Schedule
    const schedule = await Schedule.findByPk(scheduleId);
      
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    if (schedule.availableSeats < passengers.length) {
      return res.status(400).json({ success: false, message: 'Not enough seats available' });
    }

    const seatNumbers = passengers.map((p) => String(p.seatNumber)).filter((n) => n != null && n !== 'undefined');
    if (seatNumbers.length !== passengers.length) {
      return res.status(400).json({ success: false, message: 'Each passenger must include a seatNumber' });
    }
    
    const dupSeat = seatNumbers.find((s, i) => seatNumbers.indexOf(s) !== i);
    if (dupSeat != null) {
      return res.status(400).json({ success: false, message: 'Duplicate seat numbers in request' });
    }

    // 2. Check for taken seats
    const existingBookings = await Booking.findAll({
      where: {
        scheduleId: scheduleId,
        status: ['PENDING', 'CONFIRMED']
      },
      attributes: ['seatNumber']
    });
    
    const takenSeats = new Set(existingBookings.map(b => String(b.seatNumber)));
    const clash = seatNumbers.find(s => takenSeats.has(s));
    if (clash) {
      return res.status(400).json({ success: false, message: `Seat ${clash} is already reserved` });
    }

    const farePerSeat = schedule.fare;
    
    // 3. Insert Bookings (one per passenger seat)
    const bookingRecords = passengers.map(p => ({
      scheduleId: scheduleId,
      passengerId: req.user.id,
      seatNumber: String(p.seatNumber),
      amountPaid: farePerSeat,
      status: 'PENDING',
      bookingDate: new Date()
    }));

    const createdBookings = await Booking.bulkCreate(bookingRecords);

    // 4. Update available seats
    await schedule.update({ availableSeats: schedule.availableSeats - passengers.length });

    res.status(201).json({ success: true, data: createdBookings });
  } catch (err) { next(err); }
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

module.exports = router;
