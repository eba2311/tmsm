const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const DriverRating = require('../models/DriverRating');
const Driver = require('../models/Driver');
const { authenticate, authorize } = require('../middlewares/auth');

// Get all driver ratings
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { driver, booking, passenger, minRating, maxRating } = req.query;

    const query = {};
    if (driver) query.driver = driver;
    if (booking) query.booking = booking;
    if (passenger) query.passenger = passenger;
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = Number(minRating);
      if (maxRating) query.rating.$lte = Number(maxRating);
    }

    const ratings = await DriverRating.find(query)
      .populate('driver', 'user licenseNumber')
      .populate('passenger', 'name email')
      .populate('booking', 'bookingRef')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: ratings,
    });
  } catch (error) { next(error); }
});

// Get ratings for a specific driver
router.get('/driver/:driverId', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const ratings = await DriverRating.find({ driver: req.params.driverId })
      .populate('passenger', 'name')
      .populate('booking', 'bookingRef')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await DriverRating.countDocuments({ driver: req.params.driverId });

    // Calculate average rating
    const stats = await DriverRating.aggregate([
      { $match: { driver: new mongoose.Types.ObjectId(req.params.driverId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          categoryAverages: {
            avgPunctuality: { $avg: '$categories.punctuality' },
            avgProfessionalism: { $avg: '$categories.professionalism' },
            avgVehicleCondition: { $avg: '$categories.vehicleCondition' },
            avgDrivingSkill: { $avg: '$categories.drivingSkill' },
            avgCustomerService: { $avg: '$categories.customerService' },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: ratings,
      stats: stats[0] || { averageRating: 0, totalRatings: 0, categoryAverages: {} },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) { next(error); }
});

// Get rating by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const rating = await DriverRating.findById(req.params.id)
      .populate('driver', 'user licenseNumber')
      .populate('passenger', 'name email')
      .populate('booking', 'bookingRef')
      .populate('respondedBy', 'name email')
      .lean();

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found',
      });
    }

    res.json({
      success: true,
      data: rating,
    });
  } catch (error) { next(error); }
});

// Create new rating
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { driver, booking, rating, categories, comment, isAnonymous } = req.body;

    // Validate driver exists
    const driverDoc = await Driver.findById(driver);
    if (!driverDoc) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const ratingDoc = await DriverRating.create({
      driver,
      booking,
      rating,
      categories,
      comment,
      isAnonymous,
      passenger: req.user._id,
    });

    // Update driver's average rating
    const allRatings = await DriverRating.find({ driver });
    const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    await Driver.findByIdAndUpdate(driver, { rating: avgRating });

    const populatedRating = await DriverRating.findById(ratingDoc._id)
      .populate('driver', 'user licenseNumber')
      .populate('passenger', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedRating,
    });
  } catch (error) { next(error); }
});

// Respond to rating (driver response)
router.patch('/:id/respond', authenticate, async (req, res, next) => {
  try {
    const { response } = req.body;
    const rating = await DriverRating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found',
      });
    }

    rating.response = response;
    rating.respondedAt = new Date();
    rating.respondedBy = req.user._id;
    await rating.save();

    const updatedRating = await DriverRating.findById(rating._id)
      .populate('driver', 'user licenseNumber')
      .populate('respondedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedRating,
    });
  } catch (error) { next(error); }
});

// Delete rating
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const rating = await DriverRating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found',
      });
    }

    await DriverRating.findByIdAndDelete(req.params.id);

    // Recalculate driver's average rating
    const allRatings = await DriverRating.find({ driver: rating.driver });
    const avgRating = allRatings.length > 0 
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length 
      : 0;
    await Driver.findByIdAndUpdate(rating.driver, { rating: avgRating });

    res.json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error) { next(error); }
});

module.exports = router;
