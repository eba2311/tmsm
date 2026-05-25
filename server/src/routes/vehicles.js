const express = require('express');
const Joi = require('joi');
const Vehicle = require('../models/Vehicle');
const MaintenanceLog = require('../models/MaintenanceLog');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

const vehicleSchema = Joi.object({
  plateNumber: Joi.string().required(),
  type: Joi.string().valid('BUS', 'MINIBUS', 'BAJAJ', 'TAXI', 'CARGO').required(),
  make: Joi.string().required(),
  model: Joi.string().required(),
  year: Joi.number().min(1990).max(new Date().getFullYear() + 1).required(),
  color: Joi.string().optional(),
  capacity: Joi.number().min(1).required(),
  fuelType: Joi.string().valid('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID').default('DIESEL'),
  insuranceExpiry: Joi.date().optional(),
  licenseExpiry: Joi.date().optional(),
  image: Joi.string().optional(),
});

// GET /api/v1/vehicles/map/live — fleet positions for live map (before /:id)
router.get('/map/live', async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ status: 'ACTIVE' })
      .select('plateNumber type status currentLocation assignedRoute')
      .populate('assignedRoute', 'name code origin destination');
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
});

// GET /api/v1/vehicles
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) filter.plateNumber = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate('assignedDriver', 'user licenseNumber')
        .populate('assignedRoute', 'name code')
        .skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Vehicle.countDocuments(filter),
    ]);

    res.json({ success: true, data: vehicles, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /api/v1/vehicles/:id
router.get('/:id', async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('assignedDriver').populate('assignedRoute').populate('operator', 'name email');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

// POST /api/v1/vehicles
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { error, value } = vehicleSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });
    const vehicle = await Vehicle.create({ ...value, operator: req.user._id });
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

// PUT /api/v1/vehicles/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

// DELETE /api/v1/vehicles/:id
router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { status: 'RETIRED' }, { new: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, message: 'Vehicle retired' });
  } catch (err) { next(err); }
});

// GET /api/v1/vehicles/:id/maintenance
router.get('/:id/maintenance', async (req, res, next) => {
  try {
    const logs = await MaintenanceLog.find({ vehicle: req.params.id }).sort({ startDate: -1 });
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
});

// POST /api/v1/vehicles/:id/maintenance
router.post('/:id/maintenance', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const log = await MaintenanceLog.create({ ...req.body, vehicle: req.params.id, createdBy: req.user._id });
    res.status(201).json({ success: true, data: log });
  } catch (err) { next(err); }
});

module.exports = router;
