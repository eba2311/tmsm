const express = require('express');
const Joi = require('joi');
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

const routeRequestSchema = Joi.object({
  origin: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).required(),
  destination: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).required(),
  vehicleId: Joi.string().optional(),
  preferences: Joi.object({
    avoidTolls: Joi.boolean().default(false),
    avoidHighways: Joi.boolean().default(false),
    prioritizeTime: Joi.boolean().default(true),
    prioritizeFuel: Joi.boolean().default(false),
  }).optional(),
});

// POST /api/v1/ai-planning/optimize
router.post('/optimize', async (req, res, next) => {
  try {
    const { error, value } = routeRequestSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const { origin, destination, vehicleId, preferences } = value;

    // Get vehicle data if provided
    let vehicle = null;
    if (vehicleId) {
      vehicle = await Vehicle.findById(vehicleId);
    }

    // Generate optimized route options using AI
    const routeOptions = await generateOptimizedRoutes(origin, destination, vehicle, preferences);

    res.json({ success: true, data: routeOptions });
  } catch (err) { next(err); }
});

// GET /api/v1/ai-planning/traffic/:routeId
router.get('/traffic/:routeId', async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.routeId);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const trafficData = await getTrafficData(route);
    res.json({ success: true, data: trafficData });
  } catch (err) { next(err); }
});

// POST /api/v1/ai-planning/train-model
router.post('/train-model', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    // This would trigger ML model training with historical route data
    res.json({ success: true, message: 'AI model training initiated' });
  } catch (err) { next(err); }
});

async function generateOptimizedRoutes(origin, destination, vehicle, preferences) {
  // Simulate AI route optimization
  // In production, this would integrate with Google Maps API, Mapbox, or similar
  
  const baseDistance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  const baseTime = baseDistance * 2; // Rough estimate in minutes
  
  const fuelConsumption = vehicle ? (vehicle.fuelType === 'ELECTRIC' ? 0.15 : 0.25) : 0.25;
  const fuelCost = baseDistance * fuelConsumption * 1.5; // ETB per km

  return [
    {
      id: 'route_1',
      name: 'Fastest Route',
      distance: baseDistance,
      duration: baseTime,
      fuelCost: fuelCost,
      efficiency: 92,
      confidence: 0.95,
      waypoints: generateWaypoints(origin, destination, 3),
      recommended: preferences.prioritizeTime,
    },
    {
      id: 'route_2',
      name: 'Fuel Efficient Route',
      distance: baseDistance * 1.1,
      duration: baseTime * 1.15,
      fuelCost: fuelCost * 0.85,
      efficiency: 98,
      confidence: 0.88,
      waypoints: generateWaypoints(origin, destination, 4),
      recommended: preferences.prioritizeFuel,
    },
    {
      id: 'route_3',
      name: 'Balanced Route',
      distance: baseDistance * 1.05,
      duration: baseTime * 1.08,
      fuelCost: fuelCost * 0.92,
      efficiency: 95,
      confidence: 0.91,
      waypoints: generateWaypoints(origin, destination, 3),
      recommended: !preferences.prioritizeTime && !preferences.prioritizeFuel,
    },
  ];
}

async function getTrafficData(route) {
  // Simulate traffic data
  // In production, this would integrate with real traffic APIs
  return {
    currentCondition: 'MODERATE',
    congestionLevel: 45,
    averageSpeed: 35,
    incidents: [],
    predictedDelay: 5,
  };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function generateWaypoints(origin, destination, count) {
  const waypoints = [];
  for (let i = 1; i <= count; i++) {
    const ratio = i / (count + 1);
    waypoints.push({
      lat: origin.lat + (destination.lat - origin.lat) * ratio,
      lng: origin.lng + (destination.lng - origin.lng) * ratio,
    });
  }
  return waypoints;
}

module.exports = router;
