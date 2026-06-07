const express = require('express');
const Joi = require('joi');
const Schedule = require('../models/Schedule');
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Helper to validate UUIDs
const isValidUUID = (uuid) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

// ─── PUBLIC ROUTES (no auth) ─────────────────────────────────────────────────

// GET /api/v1/schedules
router.get('/', async (req, res, next) => {
  try {
    const { routeId, date, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (routeId && isValidUUID(routeId)) where.routeId = routeId;

    if (status) {
      const parts = String(status).split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) where.status = parts;
    }

    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      where.departureTime = { [Op.between]: [start, end] };
    }

    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where,
      include: [
        { model: Route, as: 'route', attributes: ['id', 'name', 'origin', 'destination', 'baseFare'] },
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'plateNumber', 'type', 'capacity'] },
        {
          model: Driver, as: 'driver',
          include: [{ model: User, as: 'user', attributes: ['name', 'phone'] }],
          attributes: ['id', 'licenseNumber']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['departureTime', 'ASC']]
    });

    res.json({ success: true, data: schedules, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// GET /api/v1/schedules/:id/occupancy — must be before /:id
router.get('/:id/occupancy', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    }

    const bookings = await Booking.findAll({
      where: { scheduleId: req.params.id, status: ['PENDING', 'CONFIRMED'] },
      attributes: ['passengers']
    });

    const occupiedSeats = [];
    bookings.forEach(b => {
      if (b.passengers && Array.isArray(b.passengers)) {
        b.passengers.forEach(p => { if (p.seatNumber) occupiedSeats.push(String(p.seatNumber)); });
      }
    });

    res.json({ success: true, data: { occupied: occupiedSeats } });
  } catch (err) { next(err); }
});

// GET /api/v1/schedules/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const schedule = await Schedule.findByPk(req.params.id, {
      include: [
        { model: Route, as: 'route' },
        { model: Vehicle, as: 'vehicle' },
        { model: Driver, as: 'driver', include: [{ model: User, as: 'user', attributes: ['name', 'phone'] }] }
      ]
    });

    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

// ─── AUTHENTICATED ROUTES ─────────────────────────────────────────────────────
router.use(authenticate);

// GET /api/v1/schedules/me/driver — logged-in driver's upcoming schedules
// NOTE: This MUST be registered after authenticate but the path '/me/driver'
// won't conflict with '/:id' because Express matches routes in order and
// '/:id/occupancy' + '/:id' are already registered above as public routes.
// We re-register this specific named path here so auth is enforced.
router.get('/me/driver', authorize('DRIVER'), async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    const since = new Date();
    since.setDate(since.getDate() - 1);

    const schedules = await Schedule.findAll({
      where: { driverId: driver.id, departureTime: { [Op.gte]: since } },
      include: [
        { model: Route, as: 'route', attributes: ['id', 'name', 'origin', 'destination', 'baseFare', 'distance', 'estimatedDuration'] },
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'plateNumber', 'type', 'capacity', 'status'] },
        {
          model: Driver, as: 'driver',
          include: [{ model: User, as: 'user', attributes: ['name', 'phone'] }],
          attributes: ['id', 'licenseNumber', 'status']
        }
      ],
      order: [['departureTime', 'ASC']],
      limit: 50
    });

    res.json({ success: true, data: schedules, driverId: driver.id });
  } catch (err) { next(err); }
});

const scheduleCreateSchema = Joi.object({
  route: Joi.string().uuid().required(),
  vehicle: Joi.string().uuid().required(),
  driver: Joi.string().uuid().required(),
  departureTime: Joi.date().required(),
  estimatedArrival: Joi.date().required(),
  availableSeats: Joi.number().integer().min(0).required(),
  totalSeats: Joi.number().integer().min(1).required(),
  fare: Joi.number().min(0).required(),
  platform: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED', 'DELAYED').optional(),
  notes: Joi.string().allow('', null).optional(),
  isRecurring: Joi.boolean().optional(),
  recurringDays: Joi.array().items(Joi.string()).optional(),
}).unknown(true);

// POST /api/v1/schedules
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const { error, value } = scheduleCreateSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: error.message });

    if (value.availableSeats > value.totalSeats) {
      return res.status(400).json({ success: false, message: 'availableSeats cannot exceed totalSeats' });
    }

    // Validate referenced entities exist
    const [routeExists, vehicleExists, driverExists] = await Promise.all([
      Route.findByPk(value.route, { attributes: ['id'] }),
      Vehicle.findByPk(value.vehicle, { attributes: ['id'] }),
      Driver.findByPk(value.driver, { attributes: ['id'] }),
    ]);

    if (!routeExists) return res.status(400).json({ success: false, message: 'Route not found' });
    if (!vehicleExists) return res.status(400).json({ success: false, message: 'Vehicle not found' });
    if (!driverExists) return res.status(400).json({ success: false, message: 'Driver not found' });

    const schedule = await Schedule.create({
      routeId: value.route,
      vehicleId: value.vehicle,
      driverId: value.driver,
      departureTime: value.departureTime,
      estimatedArrival: value.estimatedArrival,
      availableSeats: value.availableSeats,
      totalSeats: value.totalSeats,
      fare: value.fare,
      platform: value.platform || null,
      status: value.status || 'SCHEDULED',
      notes: value.notes || null,
      isRecurring: value.isRecurring || false,
      recurringDays: value.recurringDays || [],
      operatorId: req.user.id
    });

    // Return with full associations
    const full = await Schedule.findByPk(schedule.id, {
      include: [
        { model: Route, as: 'route', attributes: ['id', 'name', 'origin', 'destination'] },
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'plateNumber', 'type'] },
        { model: Driver, as: 'driver', include: [{ model: User, as: 'user', attributes: ['name'] }], attributes: ['id', 'licenseNumber'] }
      ]
    });

    res.status(201).json({ success: true, data: full });
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: err.errors.map(e => e.message).join(', ') });
    }
    next(err);
  }
});

// PUT /api/v1/schedules/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

    const updates = {};
    if (req.body.route)            updates.routeId = req.body.route;
    if (req.body.vehicle)          updates.vehicleId = req.body.vehicle;
    if (req.body.driver)           updates.driverId = req.body.driver;
    if (req.body.departureTime)    updates.departureTime = req.body.departureTime;
    if (req.body.estimatedArrival) updates.estimatedArrival = req.body.estimatedArrival;
    if (req.body.availableSeats !== undefined) updates.availableSeats = req.body.availableSeats;
    if (req.body.totalSeats !== undefined)     updates.totalSeats = req.body.totalSeats;
    if (req.body.fare !== undefined)           updates.fare = req.body.fare;
    if (req.body.platform !== undefined)       updates.platform = req.body.platform;
    if (req.body.status)                       updates.status = req.body.status;
    if (req.body.notes !== undefined)          updates.notes = req.body.notes;
    if (req.body.isRecurring !== undefined)    updates.isRecurring = req.body.isRecurring;
    if (req.body.recurringDays !== undefined)  updates.recurringDays = req.body.recurringDays;

    await schedule.update(updates);
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

// PATCH /api/v1/schedules/:id/status
router.patch('/:id/status', authorize('SUPER_ADMIN', 'OPERATOR', 'DRIVER'), async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    if (req.user.role === 'DRIVER') {
      const driver = await Driver.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
      const sched = await Schedule.findByPk(req.params.id, { attributes: ['driverId'] });
      if (!driver || !sched || sched.driverId !== driver.id) {
        return res.status(403).json({ success: false, message: 'You can only update your assigned schedules' });
      }
    }

    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

    await schedule.update({ status: req.body.status });
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

// DELETE /api/v1/schedules/:id
router.delete('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    await schedule.destroy();
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
