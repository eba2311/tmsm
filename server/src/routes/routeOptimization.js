const express = require('express');
const router = express.Router();
const RouteOptimization = require('../models/RouteOptimization');
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const { authenticate, authorize } = require('../middlewares/auth');

// Get all route optimizations
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { route, vehicle, status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (route) query.route = route;
    if (vehicle) query.vehicle = vehicle;
    if (status) query.status = status;

    const optimizations = await RouteOptimization.find(query)
      .populate('route', 'name')
      .populate('vehicle', 'plateNumber type')
      .populate('driver', 'name')
      .populate('schedule', 'departureTime')
      .populate('optimizedBy', 'name email')
      .sort({ optimizationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await RouteOptimization.countDocuments(query);

    res.json({
      success: true,
      data: optimizations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) { next(error); }
});

// Get route optimization by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const optimization = await RouteOptimization.findById(req.params.id)
      .populate('route', 'name')
      .populate('vehicle', 'plateNumber type')
      .populate('driver', 'name')
      .populate('schedule', 'departureTime')
      .populate('optimizedBy', 'name email')
      .lean();

    if (!optimization) {
      return res.status(404).json({
        success: false,
        message: 'Route optimization not found',
      });
    }

    res.json({
      success: true,
      data: optimization,
    });
  } catch (error) { next(error); }
});

// Create new route optimization
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { route, vehicle, driver, schedule, originalStops, constraints, optimizationMethod } = req.body;

    // Validate route exists
    const routeDoc = await Route.findById(route);
    if (!routeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    // Validate vehicle exists
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Calculate original distance and duration
    const originalDistance = calculateDistance(originalStops);
    const originalDuration = calculateDuration(originalStops);

    // Optimize route (simple nearest neighbor algorithm)
    const optimizedStops = optimizeRoute(originalStops, constraints);
    const optimizedDistance = calculateDistance(optimizedStops);
    const optimizedDuration = calculateDuration(optimizedStops);

    // Calculate savings
    const distanceSaved = originalDistance - optimizedDistance;
    const timeSaved = originalDuration - optimizedDuration;
    const fuelSaved = distanceSaved * 0.1; // Assume 0.1L per km
    const costSaved = fuelSaved * 25; // Assume 25 ETB per liter
    const efficiencyImprovement = ((distanceSaved / originalDistance) * 100).toFixed(2);

    const optimization = await RouteOptimization.create({
      route,
      vehicle,
      driver,
      schedule,
      originalStops,
      optimizedStops,
      optimizationMetrics: {
        originalDistance,
        optimizedDistance,
        originalDuration,
        optimizedDuration,
        distanceSaved,
        timeSaved,
        fuelSaved,
        costSaved,
        efficiencyImprovement: parseFloat(efficiencyImprovement),
      },
      constraints,
      optimizationMethod: optimizationMethod || 'NEAREST_NEIGHBOR',
      status: 'COMPLETED',
      optimizationDate: new Date(),
      optimizedBy: req.user._id,
    });

    const populatedOptimization = await RouteOptimization.findById(optimization._id)
      .populate('route', 'name')
      .populate('vehicle', 'plateNumber type')
      .populate('driver', 'name')
      .populate('optimizedBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedOptimization,
    });
  } catch (error) { next(error); }
});

// Helper function to calculate total distance
function calculateDistance(stops) {
  let totalDistance = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const dx = stops[i + 1].location.coordinates[0] - stops[i].location.coordinates[0];
    const dy = stops[i + 1].location.coordinates[1] - stops[i].location.coordinates[1];
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }
  return totalDistance;
}

// Helper function to calculate total duration
function calculateDuration(stops) {
  let totalDuration = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    if (stops[i + 1].estimatedArrival && stops[i].estimatedDeparture) {
      totalDuration += (stops[i + 1].estimatedArrival - stops[i].estimatedDeparture) / (1000 * 60);
    }
  }
  return totalDuration;
}

// Helper function to optimize route using nearest neighbor
function optimizeRoute(stops, constraints) {
  if (!stops || stops.length <= 2) return stops;

  const optimized = [stops[0]];
  const remaining = stops.slice(1);
  let current = stops[0];

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dx = remaining[i].location.coordinates[0] - current.location.coordinates[0];
      const dy = remaining[i].location.coordinates[1] - current.location.coordinates[1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    current = remaining[nearestIndex];
    optimized.push(current);
    remaining.splice(nearestIndex, 1);
  }

  return optimized.map((stop, index) => ({ ...stop, sequence: index }));
}

// Delete route optimization
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const optimization = await RouteOptimization.findById(req.params.id);
    if (!optimization) {
      return res.status(404).json({
        success: false,
        message: 'Route optimization not found',
      });
    }

    await RouteOptimization.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Route optimization deleted successfully',
    });
  } catch (error) { next(error); }
});

// Get route optimization summary
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const summary = await RouteOptimization.aggregate([
      {
        $group: {
          _id: null,
          totalSavings: { $sum: '$optimizationMetrics.costSaved' },
          fuelSaved: { $sum: '$optimizationMetrics.fuelSaved' },
          timeSaved: { $sum: '$optimizationMetrics.timeSaved' },
          efficiencyImprovement: { $avg: '$optimizationMetrics.efficiencyImprovement' },
        },
      },
    ]);

    // Mock trend for now if no data
    const trend = [
      { date: '2026-05-10', savings: 1200 },
      { date: '2026-05-11', savings: 1500 },
      { date: '2026-05-12', savings: 1100 },
      { date: '2026-05-13', savings: 1800 },
      { date: '2026-05-14', savings: 2100 },
    ];

    res.json({
      success: true,
      data: {
        ...(summary[0] || { totalSavings: 0, fuelSaved: 0, timeSaved: 0, efficiencyImprovement: 0 }),
        trend,
      },
    });
  } catch (error) { next(error); }
});

module.exports = router;
