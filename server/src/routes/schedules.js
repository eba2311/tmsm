const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const Schedule = require('../models/Schedule');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const { authenticate, authorize } = require('../middlewares/auth');
const router = express.Router();

// Public routes (no authentication required)
router.get('/', async (req, res, next) => {
  try {
    const { routeId, date, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (routeId) filter.route = routeId;
    if (status) {
      const parts = String(status).split(',').map((s) => s.trim()).filter(Boolean);
      filter.status = parts.length > 1 ? { $in: parts } : parts[0];
    }
    if (date) {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date); end.setHours(23,59,59,999);
      filter.departureTime = { $gte: start, $lte: end };
    }
    const skip = (page - 1) * limit;
    const [schedules, total] = await Promise.all([
      Schedule.find(filter)
        .populate('route', 'name code origin destination baseFare')
        .populate('vehicle', 'plateNumber type capacity')
        .populate({ path: 'driver', select: 'licenseNumber', populate: { path: 'user', select: 'name phone' } })
        .skip(skip).limit(Number(limit)).sort({ departureTime: 1 }),
      Schedule.countDocuments(filter),
    ]);
    res.json({ success: true, data: schedules, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// GET /api/v1/schedules/:id/occupancy — occupied seat numbers (public)
router.get('/:id/occupancy', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    }
    const sid = new mongoose.Types.ObjectId(req.params.id);
    const agg = await Booking.aggregate([
      { $match: { schedule: sid, status: { $in: ['PENDING', 'CONFIRMED'] } } },
      { $unwind: '$passengers' },
      { $group: { _id: null, seats: { $addToSet: '$passengers.seatNumber' } } },
    ]);
    res.json({ success: true, data: { occupied: agg[0]?.seats || [] } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const s = await Schedule.findById(req.params.id)
      .populate('route').populate('vehicle').populate('driver').populate('operator','name');
    if (!s) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
});

// Authenticated routes below
router.use(authenticate);

const scheduleCreateSchema = Joi.object({
  route: Joi.string().hex().length(24).required(),
  vehicle: Joi.string().hex().length(24).required(),
  driver: Joi.string().hex().length(24).required(),
  departureTime: Joi.date().required(),
  estimatedArrival: Joi.date().required(),
  availableSeats: Joi.number().integer().min(0).required(),
  totalSeats: Joi.number().integer().min(1).required(),
  fare: Joi.number().min(0).required(),
  platform: Joi.string().allow('', null),
  status: Joi.string().valid('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED', 'DELAYED'),
  notes: Joi.string().allow('', null),
});

router.get('/', async (req, res, next) => {
  try {
    const { routeId, date, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (routeId) filter.route = routeId;
    if (status) {
      const parts = String(status).split(',').map((s) => s.trim()).filter(Boolean);
      filter.status = parts.length > 1 ? { $in: parts } : parts[0];
    }
    if (date) {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date); end.setHours(23,59,59,999);
      filter.departureTime = { $gte: start, $lte: end };
    }
    const skip = (page - 1) * limit;
    const [schedules, total] = await Promise.all([
      Schedule.find(filter)
        .populate('route', 'name code origin destination baseFare')
        .populate('vehicle', 'plateNumber type capacity')
        .populate({ path: 'driver', select: 'licenseNumber', populate: { path: 'user', select: 'name phone' } })
        .skip(skip).limit(Number(limit)).sort({ departureTime: 1 }),
      Schedule.countDocuments(filter),
    ]);
    res.json({ success: true, data: schedules, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// GET /api/v1/schedules/me/driver — logged-in driver's upcoming schedules (before /:id)
router.get('/me/driver', authenticate, authorize('DRIVER'), async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found for this account' });

    const since = new Date();
    since.setDate(since.getDate() - 1);

    const schedules = await Schedule.find({ driver: driver._id, departureTime: { $gte: since } })
      .populate('route', 'name code origin destination baseFare distance estimatedDuration')
      .populate('vehicle', 'plateNumber type capacity status')
      .populate({ path: 'driver', select: 'licenseNumber status', populate: { path: 'user', select: 'name phone' } })
      .sort({ departureTime: 1 })
      .limit(50);

    res.json({ success: true, data: schedules, driverId: driver._id });
  } catch (err) { next(err); }
});

// GET /api/v1/schedules/:id/occupancy — occupied seat numbers
router.get('/:id/occupancy', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    }
    const sid = new mongoose.Types.ObjectId(req.params.id);
    const agg = await Booking.aggregate([
      { $match: { schedule: sid, status: { $in: ['PENDING', 'CONFIRMED'] } } },
      { $unwind: '$passengers' },
      { $group: { _id: null, seats: { $addToSet: '$passengers.seatNumber' } } },
    ]);
    res.json({ success: true, data: { occupied: agg[0]?.seats || [] } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const s = await Schedule.findById(req.params.id)
      .populate('route').populate('vehicle').populate('driver').populate('operator','name');
    if (!s) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('SUPER_ADMIN','OPERATOR'), async (req, res, next) => {
  try {
    const { error, value } = scheduleCreateSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: error.message });
    if (value.availableSeats > value.totalSeats) {
      return res.status(400).json({ success: false, message: 'availableSeats cannot exceed totalSeats' });
    }
    const s = await Schedule.create({ ...value, operator: req.user._id });
    res.status(201).json({ success: true, data: s });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('SUPER_ADMIN','OPERATOR'), async (req, res, next) => {
  try {
    const s = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!s) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
});

router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN','OPERATOR','DRIVER'), async (req, res, next) => {
  try {
    if (req.user.role === 'DRIVER') {
      const driver = await Driver.findOne({ user: req.user._id });
      const existing = await Schedule.findById(req.params.id);
      if (!driver || !existing || String(existing.driver) !== String(driver._id)) {
        return res.status(403).json({ success: false, message: 'You can only update your assigned schedules' });
      }
    }
    const s = await Schedule.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!s) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
});

module.exports = router;
