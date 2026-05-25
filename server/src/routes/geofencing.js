const express = require('express');
const Joi = require('joi');
const Geofence = require('../models/Geofence');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

const geofenceSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('CIRCLE', 'POLYGON', 'RECTANGLE').required(),
  coordinates: Joi.array().required(),
  radius: Joi.number().when('type', { is: 'CIRCLE', then: Joi.required(), otherwise: Joi.optional() }),
  alertOnEntry: Joi.boolean().default(true),
  alertOnExit: Joi.boolean().default(true),
  assignedVehicles: Joi.array().items(Joi.string()).default([]),
  assignedRoutes: Joi.array().items(Joi.string()).default([]),
});

// GET /api/v1/geofencing
router.get('/', async (req, res, next) => {
  try {
    const geofences = await Geofence.find()
      .populate('assignedVehicles', 'plateNumber')
      .populate('assignedRoutes', 'name');
    res.json({ success: true, data: geofences });
  } catch (err) { next(err); }
});

// GET /api/v1/geofencing/:id
router.get('/:id', async (req, res, next) => {
  try {
    const geofence = await Geofence.findById(req.params.id)
      .populate('assignedVehicles')
      .populate('assignedRoutes');
    if (!geofence) return res.status(404).json({ success: false, message: 'Geofence not found' });
    res.json({ success: true, data: geofence });
  } catch (err) { next(err); }
});

// POST /api/v1/geofencing
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { error, value } = geofenceSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });
    const geofence = await Geofence.create({ ...value, createdBy: req.user._id });
    res.status(201).json({ success: true, data: geofence });
  } catch (err) { next(err); }
});

// PUT /api/v1/geofencing/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const geofence = await Geofence.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!geofence) return res.status(404).json({ success: false, message: 'Geofence not found' });
    res.json({ success: true, data: geofence });
  } catch (err) { next(err); }
});

// DELETE /api/v1/geofencing/:id
router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const geofence = await Geofence.findByIdAndDelete(req.params.id);
    if (!geofence) return res.status(404).json({ success: false, message: 'Geofence not found' });
    res.json({ success: true, message: 'Geofence deleted' });
  } catch (err) { next(err); }
});

// POST /api/v1/geofencing/check-vehicle
router.post('/check-vehicle', async (req, res, next) => {
  try {
    const { vehicleId, latitude, longitude } = req.body;
    const geofences = await Geofence.find({ assignedVehicles: vehicleId });
    const alerts = [];
    
    geofences.forEach(geofence => {
      const isInside = checkPointInGeofence(latitude, longitude, geofence);
      if (isInside && geofence.alertOnEntry) {
        alerts.push({ geofenceId: geofence._id, type: 'ENTRY', message: `Vehicle entered ${geofence.name}` });
      } else if (!isInside && geofence.alertOnExit) {
        alerts.push({ geofenceId: geofence._id, type: 'EXIT', message: `Vehicle exited ${geofence.name}` });
      }
    });
    
    res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
});

function checkPointInGeofence(lat, lng, geofence) {
  // Simplified geofence check - implement proper logic based on type
  if (geofence.type === 'CIRCLE') {
    const center = geofence.coordinates[0];
    const distance = calculateDistance(lat, lng, center.lat, center.lng);
    return distance <= geofence.radius;
  }
  // Add polygon and rectangle logic here
  return false;
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

module.exports = router;
