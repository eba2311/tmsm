const express = require('express');
const Driver = require('../models/Driver');
const Schedule = require('../models/Schedule');
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const DriverPayroll = require('../models/DriverPayroll');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/driver-portal/profile
router.get('/profile', async (req, res, next) => {
  try {
    const driver = await Driver.findOne({
      where: { userId: req.user.id },
      include: [
        { model: User, as: 'user', attributes: ['name', 'email', 'phone', 'avatar'] }
      ]
    });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
});

// GET /api/v1/driver-portal/schedules
router.get('/schedules', async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
    if (!driver) return res.json({ success: true, data: [] });
    
    const schedules = await Schedule.findAll({
      where: { driverId: driver.id },
      include: [
        {
          model: Route,
          as: 'route',
          attributes: ['name', 'origin', 'destination']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['plateNumber', 'type']
        }
      ],
      order: [['departureTime', 'ASC']]
    });
    res.json({ success: true, data: schedules });
  } catch (err) { next(err); }
});

// GET /api/v1/driver-portal/earnings
router.get('/earnings', async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
    if (!driver) return res.json({ success: true, data: { totalEarnings: 0, trips: 0, thisMonth: 0 } });

    const payrolls = await DriverPayroll.findAll({ where: { driverId: driver.id } });
    const totalEarnings = payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0);
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthPayrolls = payrolls.filter(p => p.period && p.period.startsWith(currentMonth));
    const thisMonth = thisMonthPayrolls.reduce((sum, p) => sum + (p.netPay || 0), 0);

    res.json({ success: true, data: { totalEarnings, trips: payrolls.length, thisMonth } });
  } catch (err) { next(err); }
});

module.exports = router;
