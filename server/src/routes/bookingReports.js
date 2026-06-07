const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'));

// GET /api/v1/booking-reports/all
// Get all bookings with passenger identification
router.get('/all', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, startDate, endDate, searchEmail, searchPhone } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'name', 'email', 'phone', 'createdAt'],
          where: searchEmail || searchPhone ? {
            [Op.or]: [
              searchEmail ? { email: { [Op.iLike]: `%${searchEmail}%` } } : null,
              searchPhone ? { phone: { [Op.iLike]: `%${searchPhone}%` } } : null
            ].filter(Boolean)
          } : undefined,
          required: true
        },
        {
          model: Schedule,
          as: 'schedule',
          attributes: ['id', 'departureTime', 'fare'],
          include: [
            {
              model: require('../models/Route'),
              as: 'route',
              attributes: ['id', 'name', 'origin', 'destination']
            }
          ]
        },
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      subQuery: false
    });

    // Format response with passenger details
    const formattedBookings = bookings.map(b => ({
      id: b.id,
      bookingRef: b.bookingRef,
      status: b.status,
      paymentStatus: b.paymentStatus,
      totalAmount: b.totalAmount,
      currency: b.currency,
      createdAt: b.createdAt,
      passengers: b.passengers,
      passengerCount: b.passengers?.length || 0,
      passengerInfo: {
        id: b.passenger?.id,
        name: b.passenger?.name,
        email: b.passenger?.email,
        phone: b.passenger?.phone,
        registeredAt: b.passenger?.createdAt
      },
      agentInfo: b.agent ? {
        id: b.agent.id,
        name: b.agent.name,
        email: b.agent.email
      } : null,
      schedule: b.schedule,
      qrCode: b.qrCode
    }));

    res.json({
      success: true,
      data: formattedBookings,
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

// GET /api/v1/booking-reports/passenger/:passengerId
// Get all bookings by a specific passenger
router.get('/passenger/:passengerId', async (req, res, next) => {
  try {
    const { passengerId } = req.params;
    const bookings = await Booking.findAll({
      where: { passengerId },
      include: [
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'name', 'email', 'phone', 'createdAt', 'lastLogin']
        },
        {
          model: Schedule,
          as: 'schedule',
          include: [
            {
              model: require('../models/Route'),
              as: 'route',
              attributes: ['origin', 'destination']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    if (!bookings.length) {
      return res.json({ success: true, data: [], message: 'No bookings found for this passenger' });
    }

    const passengerInfo = bookings[0].passenger;
    const totalBookings = bookings.length;
    const totalSpent = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        passengerInfo,
        totalBookings,
        totalSpent,
        bookings: bookings.map(b => ({
          id: b.id,
          bookingRef: b.bookingRef,
          status: b.status,
          paymentStatus: b.paymentStatus,
          totalAmount: b.totalAmount,
          passengerCount: b.passengers?.length || 0,
          route: b.schedule?.route,
          departureTime: b.schedule?.departureTime,
          createdAt: b.createdAt
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/booking-reports/route/:routeId
// Get all bookings for a specific route
router.get('/route/:routeId', async (req, res, next) => {
  try {
    const { routeId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: bookings } = await Booking.findAndCountAll({
      include: [
        {
          model: Schedule,
          as: 'schedule',
          where: {
            routeId: routeId
          },
          required: true,
          include: [
            {
              model: require('../models/Route'),
              as: 'route',
              attributes: ['id', 'name', 'origin', 'destination']
            }
          ]
        },
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      subQuery: false
    });

    res.json({
      success: true,
      data: bookings,
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

// GET /api/v1/booking-reports/statistics
// Get booking statistics
router.get('/statistics', async (req, res, next) => {
  try {
    const totalBookings = await Booking.count();
    const paidBookings = await Booking.count({ where: { paymentStatus: 'PAID' } });
    const cancelledBookings = await Booking.count({ where: { status: 'CANCELLED' } });
    const usedBookings = await Booking.count({ where: { status: 'USED' } });
    
    const totalRevenue = await Booking.findAll({
      where: { paymentStatus: 'PAID' },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('total_amount')), 'total']
      ],
      raw: true
    });

    const topPassengers = await Booking.findAll({
      attributes: ['passengerId', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'bookingCount']],
      include: [
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'name', 'email']
        }
      ],
      group: ['passengerId'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
      limit: 10,
      subQuery: false,
      raw: false
    });

    res.json({
      success: true,
      data: {
        totalBookings,
        paidBookings,
        cancelledBookings,
        usedBookings,
        totalRevenue: parseFloat(totalRevenue[0]?.total || 0),
        topPassengers
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/booking-reports/export
// Export bookings as JSON
router.get('/export', async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;
    const where = {};

    if (status) where.status = status;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Schedule,
          as: 'schedule',
          include: [
            {
              model: require('../models/Route'),
              as: 'route',
              attributes: ['origin', 'destination']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: bookings,
      exportedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
