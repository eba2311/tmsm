// src/routes/passengers.js
const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authenticate);

// Validation schema for passenger creation/updating
const passengerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().pattern(/^\+?[0-9]{9,15}$/).optional().allow('', null),
  locale: Joi.string().valid('en', 'am').optional().default('en')
}).unknown(true);

// GET /api/v1/passengers
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'OPERATOR') {
      where.role = 'PASSENGER';
    }
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows: passengers } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'phone', 'locale', 'role', 'isActive', 'createdAt'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: passengers, pagination: { total: count, page: Number(page), limit: Number(limit), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
});

// GET /api/v1/passengers/analytics
router.get('/analytics', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    // Return empty array or mock data for now
    res.json({ success: true, data: [] });
  } catch (err) { next(err); }
});

// GET /api/v1/passengers/:id/history
router.get('/:id/history', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    // Return empty array or mock data for now
    res.json({ success: true, data: [] });
  } catch (err) { next(err); }
});

// GET /api/v1/passengers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const passenger = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'phone', 'locale', 'role', 'isActive', 'createdAt']
    });

    if (!passenger) return res.status(404).json({ success: false, message: 'Passenger not found' });
    
    if (passenger.role !== 'PASSENGER' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'OPERATOR') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    res.json({ success: true, data: passenger });
  } catch (err) { next(err); }
});

// POST /api/v1/passengers
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { error, value } = passengerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    let passengerEmail = value.email;
    if (!passengerEmail) {
      passengerEmail = `passenger_${Date.now()}@tmsm.local`;
    }

    // Ensure email uniqueness
    const exists = await User.findOne({ where: { email: passengerEmail.toLowerCase() } });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });
    
    // Insert passenger with role PASSENGER
    const passenger = await User.create({
      name: value.name,
      email: passengerEmail.toLowerCase(),
      phone: value.phone || null,
      locale: value.locale,
      role: 'PASSENGER',
      password: 'DefaultPass@123',
      isActive: true
    });
    
    const formatted = {
      id: passenger.id,
      name: passenger.name,
      email: passenger.email,
      phone: passenger.phone,
      locale: passenger.locale,
      role: passenger.role,
      isActive: passenger.isActive,
      createdAt: passenger.createdAt
    };
    res.status(201).json({ success: true, data: formatted });
  } catch (err) { next(err); }
});

// PUT /api/v1/passengers/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { error, value } = passengerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const updateData = {
      name: value.name,
      phone: value.phone || null,
      locale: value.locale
    };
    if (value.email) {
      updateData.email = value.email.toLowerCase();
    }

    let passenger = await User.findByPk(req.params.id);
    if (!passenger) return res.status(404).json({ success: false, message: 'Passenger not found' });
    
    await passenger.update(updateData);
    
    const formatted = {
      id: passenger.id,
      name: passenger.name,
      email: passenger.email,
      phone: passenger.phone,
      locale: passenger.locale,
      role: passenger.role,
      isActive: passenger.isActive,
      createdAt: passenger.createdAt
    };
    res.json({ success: true, data: formatted });
  } catch (err) { next(err); }
});

// DELETE /api/v1/passengers/:id
router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Passenger not found' });
    
    await user.destroy();
    res.json({ success: true, message: 'Passenger deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
