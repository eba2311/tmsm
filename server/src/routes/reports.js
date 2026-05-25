const express = require('express');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Schedule = require('../models/Schedule');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate, authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'));

// GET /api/v1/reports/overview
router.get('/overview', async (req, res, next) => {
  try {
    const [totalBookings, totalRevenue, totalVehicles, totalDrivers, activeSchedules] = await Promise.all([
      Booking.countDocuments(),
      Payment.aggregate([{ $match: { status: 'SUCCESS' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Vehicle.countDocuments({ status: 'ACTIVE' }),
      Driver.countDocuments({ status: 'ACTIVE' }),
      Schedule.countDocuments({ status: { $in: ['SCHEDULED', 'BOARDING', 'IN_TRANSIT'] } }),
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalVehicles,
        totalDrivers,
        activeSchedules,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/reports/revenue?period=daily|weekly|monthly
router.get('/revenue', async (req, res, next) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const groupFormat = period === 'monthly'
      ? { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }
      : period === 'weekly'
      ? { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } }
      : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };

    const data = await Payment.aggregate([
      { $match: { status: 'SUCCESS', createdAt: { $gte: startDate } } },
      { $group: { _id: groupFormat, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /api/v1/reports/bookings
router.get('/bookings', async (req, res, next) => {
  try {
    const stats = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// GET /api/v1/reports/fleet
router.get('/fleet', async (req, res, next) => {
  try {
    const stats = await Vehicle.aggregate([
      { $group: { _id: { status: '$status', type: '$type' }, count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// GET /api/v1/reports/routes
router.get('/routes', async (req, res, next) => {
  try {
    const data = await Booking.aggregate([
      { $lookup: { from: 'schedules', localField: 'schedule', foreignField: '_id', as: 'scheduleData' } },
      { $unwind: '$scheduleData' },
      { $lookup: { from: 'routes', localField: 'scheduleData.route', foreignField: '_id', as: 'routeData' } },
      { $unwind: '$routeData' },
      { $group: { _id: '$routeData._id', routeName: { $first: '$routeData.name' }, bookings: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

module.exports = router;
