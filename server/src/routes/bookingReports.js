const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'));

// GET /api/v1/booking-reports/all - Complete booking report with all details
router.get('/all', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, paymentStatus, paymentMethod, startDate, endDate, searchEmail, searchPhone, routeId, vehicleId, driverId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    
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
          where: routeId || driverId ? { 
            routeId: routeId || { [Op.not]: null },
            driverId: driverId || { [Op.not]: null }
          } : undefined,
          include: [
            {
              model: require('../models/Route'),
              as: 'route',
              attributes: ['id', 'name', 'origin', 'destination']
            },
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['id', 'plateNumber', 'type', 'totalSeats'],
              where: vehicleId ? { id: vehicleId } : undefined,
              required: false
            },
            {
              model: Driver,
              as: 'driver',
              include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'phone'] }
              ],
              required: false
            }
          ],
          required: true
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

    // Format complete booking details
    const formattedBookings = bookings.map((b, idx) => ({
      id: b.id,
      ticketNumber: b.bookingRef,
      bookingId: b.bookingRef,
      
      // Passenger Details
      passengerName: b.passenger?.name,
      passengerEmail: b.passenger?.email,
      passengerPhone: b.passenger?.phone,
      passengerRegistered: b.passenger?.createdAt,
      
      // Route Details
      routeName: b.schedule?.route?.name,
      routeOrigin: b.schedule?.route?.origin,
      routeDestination: b.schedule?.route?.destination,
      route: `${b.schedule?.route?.origin} → ${b.schedule?.route?.destination}`,
      
      // Vehicle Details
      vehicleName: b.schedule?.vehicle?.type,
      vehiclePlateNumber: b.schedule?.vehicle?.plateNumber,
      vehicleSeats: b.schedule?.vehicle?.totalSeats,
      
      // Driver Details
      driverName: b.schedule?.driver?.user?.name,
      driverPhone: b.schedule?.driver?.user?.phone,
      
      // Seat & Passenger Details
      passengers: b.passengers,
      seatNumbers: b.passengers?.map(p => p.seatNumber).join(', ') || 'N/A',
      passengerCount: b.passengers?.length || 0,
      
      // Dates
      bookingDate: b.createdAt,
      travelDate: b.schedule?.departureTime,
      
      // Payment Details
      amountPaid: b.totalAmount,
      currency: b.currency,
      paymentStatus: b.paymentStatus,
      paymentMethod: b.paymentMethod || 'N/A',
      transactionId: b.id,
      
      // Booking Status
      bookingStatus: b.status,
      createdBy: b.agent?.name || 'Direct Booking',
      
      // Summary
      fare: b.schedule?.fare
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

// GET /api/v1/booking-reports/summary - Complete summary statistics
router.get('/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const totalBookings = await Booking.count({ where });
    const paidBookings = await Booking.count({ where: { ...where, paymentStatus: 'PAID' } });
    const pendingBookings = await Booking.count({ where: { ...where, paymentStatus: 'UNPAID' } });
    const cancelledBookings = await Booking.count({ where: { ...where, status: 'CANCELLED' } });
    const completedBookings = await Booking.count({ where: { ...where, status: 'USED' } });

    // Revenue calculations
    const totalRevenue = await Booking.findOne({
      where: { ...where, paymentStatus: 'PAID' },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('total_amount')), 'total']
      ],
      raw: true
    });

    // Revenue by payment method
    const revenueByPaymentMethod = await Booking.findAll({
      where: { ...where, paymentStatus: 'PAID' },
      attributes: [
        'paymentMethod',
        [require('sequelize').fn('SUM', require('sequelize').col('total_amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['paymentMethod'],
      raw: true
    });

    // Total passengers
    const bookingsWithPassengers = await Booking.findAll({
      where,
      attributes: ['passengers']
    });
    const totalPassengers = bookingsWithPassengers.reduce((sum, b) => {
      return sum + (b.passengers?.length || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        totalBookings,
        paidBookings,
        pendingBookings,
        cancelledBookings,
        completedBookings,
        totalRevenue: parseFloat(totalRevenue?.total || 0),
        totalPassengers,
        averageBookingValue: totalBookings > 0 ? (parseFloat(totalRevenue?.total || 0) / totalBookings).toFixed(2) : 0,
        revenueByPaymentMethod: revenueByPaymentMethod.map(r => ({
          method: r.paymentMethod || 'Unknown',
          total: parseFloat(r.total),
          count: parseInt(r.count)
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/booking-reports/passenger/:passengerId
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
            },
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['plateNumber', 'type']
            },
            {
              model: Driver,
              as: 'driver',
              include: [{ model: User, as: 'user', attributes: ['name'] }]
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
        bookings
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
