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

// GET /api/v1/schedules (public)
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
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date); end.setHours(23,59,59,999);
      where.departureTime = { [Op.between]: [start, end] };
    }

    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where,
      include: [
        {
          model: Route,
          as: 'route',
          attributes: ['id', 'name', 'origin', 'destination', 'baseFare']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plateNumber', 'type', 'capacity']
        },
        {
          model: Driver,
          as: 'driver',
          include: [
            { model: User, as: 'user', attributes: ['name', 'phone'] }
          ],
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

// GET /api/v1/schedules/:id/occupancy — occupied seat numbers (public)
router.get('/:id/occupancy', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    }
    
    const bookings = await Booking.findAll({
      where: {
        scheduleId: req.params.id,
        status: ['PENDING', 'CONFIRMED']
      },
      attributes: ['seatNumber']
    });
    
    const occupiedSeats = bookings.map(b => b.seatNumber).filter(Boolean);
    
    res.json({ success: true, data: { occupied: occupiedSeats } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    
    const schedule = await Schedule.findByPk(req.params.id, {
      include: [
        {
          model: Route,
          as: 'route'
        },
        {
          model: Vehicle,
          as: 'vehicle'
        },
        {
          model: Driver,
          as: 'driver'
        }
      ]
    });
      
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

// Authenticated routes below
router.use(authenticate);

const scheduleCreateSchema = Joi.object({
  route: Joi.string().required(),
  vehicle: Joi.string().required(),
  driver: Joi.string().required(),
  departureTime: Joi.date().required(),
  estimatedArrival: Joi.date().required(),
  availableSeats: Joi.number().integer().min(0).required(),
  totalSeats: Joi.number().integer().min(1).required(),
  fare: Joi.number().min(0).required(),
  platform: Joi.string().allow('', null),
  status: Joi.string().valid('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED', 'DELAYED'),
  notes: Joi.string().allow('', null),
});

// GET /api/v1/schedules/me/driver — logged-in driver's upcoming schedules
router.get('/me/driver', authorize('DRIVER'), async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ 
      where: { userId: req.user.id },
      attributes: ['id']
    });
      
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    const since = new Date();
    since.setDate(since.getDate() - 1);

    const schedules = await Schedule.findAll({
      where: {
        driverId: driver.id,
        departureTime: { [Op.gte]: since }
      },
      include: [
        {
          model: Route,
          as: 'route',
          attributes: ['id', 'name', 'origin', 'destination', 'baseFare', 'distance', 'estimatedDuration']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plateNumber', 'type', 'capacity', 'status']
        },
        {
          model: Driver,
          as: 'driver',
          include: [
            { model: User, as: 'user', attributes: ['name', 'phone'] }
          ],
          attributes: ['id', 'licenseNumber', 'status']
        }
      ],
      order: [['departureTime', 'ASC']],
      limit: 50
    });

    res.json({ success: true, data: schedules, driverId: driver.id });
  } catch (err) { next(err); }
});

router.post('/', authorize('SUPER_ADMIN','OPERATOR'), async (req, res, next) => {
  try {
    const { error, value } = scheduleCreateSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: error.message });
    if (value.availableSeats > value.totalSeats) {
      return res.status(400).json({ success: false, message: 'availableSeats cannot exceed totalSeats' });
    }
    
    const schedule = await Schedule.create({
      routeId: value.route,
      vehicleId: value.vehicle,
      driverId: value.driver,
      departureTime: value.departureTime,
      estimatedArrival: value.estimatedArrival,
      availableSeats: value.availableSeats,
      totalSeats: value.totalSeats,
      fare: value.fare,
      platform: value.platform,
      status: value.status || 'SCHEDULED',
      notes: value.notes,
      operatorId: req.user.id
    });
    
    res.status(201).json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('SUPER_ADMIN','OPERATOR'), async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    
    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

    await schedule.update({
      routeId: req.body.route,
      vehicleId: req.body.vehicle,
      driverId: req.body.driver,
      departureTime: req.body.departureTime,
      estimatedArrival: req.body.estimatedArrival,
      availableSeats: req.body.availableSeats,
      totalSeats: req.body.totalSeats,
      fare: req.body.fare,
      platform: req.body.platform,
      status: req.body.status,
      notes: req.body.notes
    });
    
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

router.patch('/:id/status', authorize('SUPER_ADMIN','OPERATOR','DRIVER'), async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    
    if (req.user.role === 'DRIVER') {
      const driver = await Driver.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
      const schedule = await Schedule.findByPk(req.params.id, { attributes: ['driverId'] });
      
      if (!driver || !schedule || schedule.driverId !== driver.id) {
        return res.status(403).json({ success: false, message: 'You can only update your assigned schedules' });
      }
    }
    
    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

    await schedule.update({ status: req.body.status });
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

module.exports = router;
