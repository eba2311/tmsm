const express = require('express');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Schedule = require('../models/Schedule');
const Route = require('../models/Route');
const { authenticate, authorize } = require('../middlewares/auth');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authenticate, authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'));

// GET /api/v1/reports/overview
router.get('/overview', async (req, res, next) => {
  try {
    const [totalBookings, bookings, totalVehicles, totalDrivers, activeSchedules] = await Promise.all([
      Booking.count(),
      Booking.findAll({ where: { status: ['CONFIRMED', 'USED'] }, attributes: ['amountPaid'] }),
      Vehicle.count({ where: { status: 'ACTIVE' } }),
      Driver.count({ where: { status: 'ACTIVE' } }),
      Schedule.count({ where: { status: ['SCHEDULED', 'BOARDING', 'IN_TRANSIT'] } })
    ]);

    let totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.amountPaid) || 0), 0);

    res.json({
      success: true,
      data: {
        totalBookings,
        totalRevenue,
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

    const bookings = await Booking.findAll({
      where: {
        status: ['CONFIRMED', 'USED'],
        createdAt: { [Op.gte]: startDate }
      },
      attributes: ['amountPaid', 'createdAt']
    });

    const grouped = {};
    for (const b of bookings) {
      const d = new Date(b.createdAt);
      let key;
      if (period === 'monthly') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'weekly') {
        const week = Math.ceil(d.getDate() / 7);
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-W${week}`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      if (!grouped[key]) grouped[key] = { _id: key, revenue: 0, count: 0 };
      grouped[key].revenue += (parseFloat(b.amountPaid) || 0);
      grouped[key].count += 1;
    }

    const aggregatedArray = Object.values(grouped).sort((a, b) => a._id.localeCompare(b._id));

    res.json({ success: true, data: aggregatedArray });
  } catch (err) { next(err); }
});

// GET /api/v1/reports/bookings
router.get('/bookings', async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({ attributes: ['status', 'amountPaid'] });

    const statsObj = {};
    for (const b of bookings) {
      if (!statsObj[b.status]) statsObj[b.status] = { _id: b.status, count: 0, revenue: 0 };
      statsObj[b.status].count += 1;
      statsObj[b.status].revenue += (parseFloat(b.amountPaid) || 0);
    }

    res.json({ success: true, data: Object.values(statsObj) });
  } catch (err) { next(err); }
});

// GET /api/v1/reports/fleet
router.get('/fleet', async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll({ attributes: ['status', 'type'] });

    const statsObj = {};
    for (const v of vehicles) {
      const key = `${v.status}_${v.type}`;
      if (!statsObj[key]) statsObj[key] = { _id: { status: v.status, type: v.type }, count: 0 };
      statsObj[key].count += 1;
    }

    res.json({ success: true, data: Object.values(statsObj) });
  } catch (err) { next(err); }
});

// GET /api/v1/reports/routes
router.get('/routes', async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { status: ['CONFIRMED', 'USED'] },
      attributes: ['amountPaid'],
      include: [
        {
          model: Schedule,
          as: 'schedule',
          include: [
            {
              model: Route,
              as: 'route',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    const routeStats = {};
    for (const b of bookings) {
      const route = b.schedule?.route;
      if (!route) continue;
      
      const rId = route.id;
      if (!routeStats[rId]) {
        routeStats[rId] = { _id: rId, routeName: route.name, bookings: 0, revenue: 0 };
      }
      routeStats[rId].bookings += 1;
      routeStats[rId].revenue += (parseFloat(b.amountPaid) || 0);
    }

    const sortedData = Object.values(routeStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    res.json({ success: true, data: sortedData });
  } catch (err) { next(err); }
});

module.exports = router;
