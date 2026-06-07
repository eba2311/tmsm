const express = require('express');
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate, authorize('SUPER_ADMIN', 'OPERATOR'));

// GET /api/v1/ai-planning
router.get('/', async (req, res, next) => {
  try {
    const routes = await Route.findAll({ attributes: ['id', 'name', 'distance', 'estimatedDuration', 'baseFare'] });
    const vehicles = await Vehicle.findAll({ where: { status: 'ACTIVE' }, attributes: ['id', 'plateNumber', 'type', 'capacity', 'status'] });
    const drivers = await Driver.findAll({ 
      where: { status: 'ACTIVE' }, 
      attributes: ['id', 'licenseNumber', 'status'],
      include: [{ model: User, as: 'user', attributes: ['name'] }]
    });

    // Simple AI suggestion: pair available drivers with vehicles on routes
    const suggestions = (routes || []).map((route, i) => ({
      route: route,
      suggestedVehicle: vehicles && vehicles[i % vehicles.length] ? vehicles[i % vehicles.length] : null,
      suggestedDriver: drivers && drivers[i % drivers.length] ? drivers[i % drivers.length] : null,
      confidence: 0.75,
      estimatedDemand: Math.floor(Math.random() * 50) + 10,
      recommendedSchedules: 3
    }));

    res.json({ success: true, data: suggestions });
  } catch (err) { next(err); }
});

// POST /api/v1/ai-planning/optimize
router.post('/optimize', async (req, res, next) => {
  try {
    const { routeId } = req.body;
    res.json({
      success: true,
      data: {
        routeId,
        status: 'COMPLETED',
        recommendations: [
          'Increase frequency during morning rush (6-8 AM)',
          'Assign larger capacity vehicles on weekdays',
          'Consider adding an express service'
        ],
        optimizedAt: new Date().toISOString()
      }
    });
  } catch (err) { next(err); }
});

// GET /api/v1/ai-planning/demand-forecast
router.get('/demand-forecast', async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      attributes: ['created_at', 'scheduleId'],
      order: [['created_at', 'DESC']],
      limit: 100
    });

    const forecast = {
      nextWeek: { estimatedPassengers: (bookings || []).length * 2, confidence: 0.7 },
      nextMonth: { estimatedPassengers: (bookings || []).length * 8, confidence: 0.5 },
      peakHours: ['07:00-09:00', '17:00-19:00'],
      peakDays: ['Monday', 'Friday']
    };

    res.json({ success: true, data: forecast });
  } catch (err) { next(err); }
});

module.exports = router;
