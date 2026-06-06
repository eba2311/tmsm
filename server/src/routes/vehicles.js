const express = require('express');
const Joi = require('joi');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const MaintenanceLog = require('../models/MaintenanceLog');
const { authenticate, authorize } = require('../middlewares/auth');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authenticate);

const vehicleSchema = Joi.object({
  plateNumber: Joi.string().required(),
  type: Joi.string().valid('BUS', 'MINIBUS', 'BAJAJ', 'TAXI', 'CARGO').required(),
  make: Joi.string().required(),
  model: Joi.string().required(),
  year: Joi.number().min(1990).max(new Date().getFullYear() + 1).required(),
  color: Joi.string().optional().allow(''),
  capacity: Joi.number().min(1).required(),
  fuelType: Joi.string().valid('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID').default('DIESEL'),
  insuranceExpiry: Joi.date().optional().allow(null),
  licenseExpiry: Joi.date().optional().allow(null),
  image: Joi.string().optional().allow(''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED').default('ACTIVE')
});

// GET /api/v1/vehicles/map/live — fleet positions for live map
router.get('/map/live', async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: Route,
          as: 'assignedRoute',
          attributes: ['id', 'name', 'origin', 'destination']
        }
      ],
      attributes: ['id', 'plateNumber', 'type', 'status', 'currentLocation', 'assignedRouteId']
    });
    
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
});

// GET /api/v1/vehicles
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) where.plateNumber = { [Op.iLike]: `%${search}%` };

    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where,
      include: [
        {
          model: Driver,
          as: 'assignedDriver',
          include: [
            { model: require('../models/User'), as: 'user', attributes: ['id', 'name', 'email'] }
          ],
          attributes: ['id', 'licenseNumber']
        },
        {
          model: Route,
          as: 'assignedRoute',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({ 
      success: true, 
      data: vehicles, 
      pagination: { total: count, page: Number(page), limit: Number(limit), pages: Math.ceil(count / limit) } 
    });
  } catch (err) { next(err); }
});

// GET /api/v1/vehicles/:id
router.get('/:id', async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [
        {
          model: Driver,
          as: 'assignedDriver',
          include: [
            { model: require('../models/User'), as: 'user', attributes: ['id', 'name', 'email'] }
          ],
          attributes: ['id', 'licenseNumber']
        },
        {
          model: Route,
          as: 'assignedRoute',
          attributes: ['id', 'name']
        }
      ]
    });
      
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

// POST /api/v1/vehicles
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    // If frontend sends empty strings for dates, convert them to null
    if (req.body.insuranceExpiry === '') req.body.insuranceExpiry = null;
    if (req.body.licenseExpiry === '') req.body.licenseExpiry = null;

    const { error, value } = vehicleSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: error.message });
    
    const vehicle = await Vehicle.create({
      plateNumber: value.plateNumber,
      type: value.type,
      make: value.make,
      model: value.model,
      year: value.year,
      color: value.color || null,
      capacity: value.capacity,
      fuelType: value.fuelType,
      insuranceExpiry: value.insuranceExpiry,
      licenseExpiry: value.licenseExpiry,
      image: value.image || null,
      operatorId: req.user.id
    });
    
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Plate number already exists' });
    }
    next(err);
  }
});

// PUT /api/v1/vehicles/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    await vehicle.update({
      plateNumber: req.body.plateNumber,
      type: req.body.type,
      make: req.body.make,
      model: req.body.model,
      year: req.body.year,
      color: req.body.color,
      capacity: req.body.capacity,
      status: req.body.status,
      fuelType: req.body.fuelType,
      insuranceExpiry: req.body.insuranceExpiry,
      licenseExpiry: req.body.licenseExpiry,
      image: req.body.image
    });

    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

// DELETE /api/v1/vehicles/:id
router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    await vehicle.update({ status: 'RETIRED' });
    res.json({ success: true, message: 'Vehicle retired' });
  } catch (err) { next(err); }
});

// GET /api/v1/vehicles/:id/maintenance
router.get('/:id/maintenance', async (req, res, next) => {
  try {
    const logs = await MaintenanceLog.findAll({
      where: { vehicleId: req.params.id },
      order: [['startDate', 'DESC']]
    });
    
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
});

// POST /api/v1/vehicles/:id/maintenance
router.post('/:id/maintenance', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { description, cost, datePerformed, type } = req.body;
    const log = await MaintenanceLog.create({
      vehicleId: req.params.id,
      type: type || 'ROUTINE',
      description,
      cost: cost || 0,
      startDate: datePerformed || new Date(),
      endDate: datePerformed || new Date(),
      status: 'COMPLETED',
      createdById: req.user.id
    });
    
    res.status(201).json({ success: true, data: log });
  } catch (err) { next(err); }
});

module.exports = router;
