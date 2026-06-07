const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const Driver = require('../models/Driver');
const Schedule = require('../models/Schedule');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'));

// GET /api/v1/driver-analytics/performance
// Get driver performance statistics
router.get('/performance', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const drivers = await Driver.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email', 'phone']
        },
        {
          model: Schedule,
          as: 'schedules',
          where,
          required: false,
          include: [
            {
              model: Booking,
              as: 'bookings',
              required: false,
              attributes: ['id', 'status', 'totalAmount']
            }
          ]
        }
      ]
    });

    const performance = drivers.map(driver => {
      const schedules = driver.schedules || [];
      const totalTrips = schedules.length;
      const totalPassengers = schedules.reduce((sum, s) => {
        const bookings = s.bookings || [];
        return sum + bookings.filter(b => b.status === 'USED').length;
      }, 0);
      const totalRevenue = schedules.reduce((sum, s) => {
        const bookings = s.bookings || [];
        return sum + bookings.reduce((bs, b) => bs + parseFloat(b.totalAmount || 0), 0);
      }, 0);

      return {
        driverId: driver.id,
        name: driver.user?.name,
        email: driver.user?.email,
        phone: driver.user?.phone,
        licenseNumber: driver.licenseNumber,
        totalTrips,
        totalPassengers,
        totalRevenue,
        avgPassengersPerTrip: totalTrips > 0 ? (totalPassengers / totalTrips).toFixed(2) : 0,
        avgRevenuePerTrip: totalTrips > 0 ? (totalRevenue / totalTrips).toFixed(2) : 0,
        isActive: driver.isActive
      };
    });

    // Sort by total revenue
    performance.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({ success: true, data: performance });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/driver-analytics/:driverId/trips
// Get trips for a specific driver
router.get('/:driverId/trips', async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = { driverId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where,
      include: [
        {
          model: require('../models/Route'),
          as: 'route',
          attributes: ['origin', 'destination']
        },
        {
          model: Booking,
          as: 'bookings',
          attributes: ['id', 'status', 'totalAmount']
        },
        {
          model: require('../models/Vehicle'),
          as: 'vehicle',
          attributes: ['plateNumber', 'type']
        }
      ],
      order: [['departureTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      subQuery: false
    });

    const formattedSchedules = schedules.map(schedule => {
      const bookings = schedule.bookings || [];
      return {
        id: schedule.id,
        departureTime: schedule.departureTime,
        route: schedule.route,
        vehicle: schedule.vehicle,
        fare: schedule.fare,
        totalSeats: schedule.totalSeats,
        availableSeats: schedule.availableSeats,
        bookings: bookings.length,
        usedSeats: bookings.filter(b => b.status === 'USED').length,
        totalRevenue: bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0),
        status: schedule.status
      };
    });

    res.json({
      success: true,
      data: formattedSchedules,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/driver-analytics/top-drivers
// Get top drivers by various metrics
router.get('/top-drivers/all', async (req, res, next) => {
  try {
    const { metric = 'revenue', limit = 10 } = req.query;

    const drivers = await Driver.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        },
        {
          model: Schedule,
          as: 'schedules',
          include: [
            {
              model: Booking,
              as: 'bookings',
              attributes: ['id', 'status', 'totalAmount']
            }
          ]
        }
      ]
    });

    const stats = drivers.map(driver => {
      const schedules = driver.schedules || [];
      const totalTrips = schedules.length;
      const totalPassengers = schedules.reduce((sum, s) => {
        const bookings = s.bookings || [];
        return sum + bookings.filter(b => b.status === 'USED').length;
      }, 0);
      const totalRevenue = schedules.reduce((sum, s) => {
        const bookings = s.bookings || [];
        return sum + bookings.reduce((bs, b) => bs + parseFloat(b.totalAmount || 0), 0);
      }, 0);

      return {
        driverId: driver.id,
        name: driver.user?.name,
        email: driver.user?.email,
        totalTrips,
        totalPassengers,
        totalRevenue,
        avgPassengersPerTrip: totalTrips > 0 ? (totalPassengers / totalTrips).toFixed(2) : 0,
        avgRevenuePerTrip: totalTrips > 0 ? (totalRevenue / totalTrips).toFixed(2) : 0
      };
    });

    // Sort by metric
    if (metric === 'trips') {
      stats.sort((a, b) => b.totalTrips - a.totalTrips);
    } else if (metric === 'passengers') {
      stats.sort((a, b) => b.totalPassengers - a.totalPassengers);
    } else {
      stats.sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    res.json({
      success: true,
      data: stats.slice(0, parseInt(limit))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
