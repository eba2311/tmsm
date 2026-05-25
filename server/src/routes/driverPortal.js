const express = require('express');
const Driver = require('../models/Driver');
const Schedule = require('../models/Schedule');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// All routes here require DRIVER role
router.use(authenticate);
router.use(authorize('DRIVER'));

/**
 * GET /api/v1/driver/trips
 * Get upcoming and current trips for the logged in driver
 */
router.get('/trips', async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    const trips = await Schedule.find({
      driver: driver._id,
      status: { $in: ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT'] }
    })
    .populate('route')
    .populate('vehicle', 'plateNumber type make model')
    .sort({ departureTime: 1 });

    res.json({ success: true, data: trips });
  } catch (err) { next(err); }
});

/**
 * GET /api/v1/driver/stats
 * Get performance statistics for the logged in driver
 */
router.get('/stats', async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    // Aggregate some stats
    const stats = {
      totalTrips: driver.totalTrips,
      avgRating: driver.rating,
      onTimeRate: 98, // Mock for now or calculate from actual vs estimated
      totalDistance: driver.totalDistance,
      status: driver.status
    };

    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/v1/driver/trips/:id/status
 * Update trip status (Start trip, End trip)
 */
router.patch('/trips/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const driver = await Driver.findOne({ user: req.user._id });
    const trip = await Schedule.findOne({ _id: id, driver: driver?._id });

    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or not assigned to you' });

    trip.status = status;
    if (status === 'DEPARTED') trip.actualDeparture = new Date();
    if (status === 'ARRIVED') {
        trip.actualArrival = new Date();
        // Update driver stats
        await Driver.findByIdAndUpdate(driver._id, { $inc: { totalTrips: 1 } });
    }

    await trip.save();
    res.json({ success: true, data: trip });
  } catch (err) { next(err); }
});

module.exports = router;
