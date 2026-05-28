const express = require('express');
const bcrypt = require('bcryptjs');
const Driver = require('../models/Driver');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { authenticate, authorize } = require('../middlewares/auth');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/drivers
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) where.licenseNumber = { [Op.iLike]: `%${search}%` };

    const { count, rows: drivers } = await Driver.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'avatar']
        },
        {
          model: Vehicle,
          as: 'assignedVehicle',
          attributes: ['id', 'plateNumber', 'type', 'make', 'model']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({ 
      success: true, 
      data: drivers, 
      pagination: { total: count, page: Number(page), limit: Number(limit), pages: Math.ceil(count / limit) } 
    });
  } catch (err) { next(err); }
});

// GET /api/v1/drivers/stats/overview — must be before /:id
router.get('/stats/overview', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const drivers = await Driver.findAll({
      attributes: ['status']
    });
    
    const statsObj = drivers.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});
    
    const stats = Object.keys(statsObj).map(status => ({ id: status, count: statsObj[status] }));
    
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// GET /api/v1/drivers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'avatar']
        },
        {
          model: Vehicle,
          as: 'assignedVehicle',
          attributes: ['id', 'plateNumber', 'type', 'make', 'model']
        }
      ]
    });
      
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
});

// POST /api/v1/drivers
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const { name, email, phone, password, licenseNumber, licenseClass, licenseType, licenseExpiry, yearsOfExperience, status } = req.body;

    if (!name || !licenseNumber) {
      return res.status(400).json({ success: false, message: 'Name and License Number are required' });
    }

    let driverEmail = email;

    if (!driverEmail) {
      driverEmail = `driver_${String(licenseNumber).replace(/\s+/g, '').toLowerCase()}_${Date.now()}@tmsm.local`;
    }

    // 1. Find or create user
    let user = await User.findOne({ 
      where: { email: String(driverEmail).toLowerCase() } 
    });

    if (!user) {
      user = await User.create({
        name: String(name),
        email: String(driverEmail).toLowerCase(),
        phone: phone ? String(phone) : null,
        password: password || 'DefaultPass@123',
        role: 'DRIVER'
      });
    }

    // Handle "null" strings from frontend FormData
    const expiry = (licenseExpiry && licenseExpiry !== 'null' && licenseExpiry !== '') ? licenseExpiry : null;
    const expYears = (yearsOfExperience && yearsOfExperience !== 'null' && yearsOfExperience !== '') ? parseInt(yearsOfExperience) : 0;

    // 2. Create driver profile
    const driver = await Driver.create({
      userId: user.id,
      licenseNumber: licenseNumber,
      licenseClass: (licenseClass && licenseClass !== 'null') ? licenseClass : ((licenseType && licenseType !== 'null') ? licenseType : null),
      licenseExpiry: expiry,
      experience: expYears,
      status: status || 'ACTIVE'
    });
    
    // Fetch the driver with user included
    const driverWithUser = await Driver.findByPk(driver.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });
    
    res.status(201).json({ success: true, data: driverWithUser });
  } catch (err) { 
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'License number already exists' });
    }
    if (err.message && err.message.includes('null value in column "email"')) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    console.error('Driver creation error:', err);
    return res.status(500).json({ success: false, message: `Server error: ${err.message || 'Unknown error'}` });
  }
});

// PUT /api/v1/drivers/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const { licenseNumber, licenseClass, licenseType, licenseExpiry, yearsOfExperience, status } = req.body;
    
    const expiry = (licenseExpiry && licenseExpiry !== 'null' && licenseExpiry !== '') ? licenseExpiry : null;
    const expYears = (yearsOfExperience && yearsOfExperience !== 'null' && yearsOfExperience !== '') ? parseInt(yearsOfExperience) : 0;
    
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    await driver.update({
      licenseNumber: licenseNumber,
      licenseClass: (licenseClass && licenseClass !== 'null') ? licenseClass : ((licenseType && licenseType !== 'null') ? licenseType : null),
      licenseExpiry: expiry,
      experience: expYears,
      status
    });
    
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
});

// PATCH /api/v1/drivers/:id/assign
router.patch('/:id/assign', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const { vehicleId, routeId } = req.body;
    
    // If vehicleId is provided, update the vehicle to assign this driver
    if (vehicleId) {
      await Vehicle.update({ assignedDriverId: req.params.id }, { where: { id: vehicleId } });
    } else {
      // Unassign vehicle from this driver
      await Vehicle.update({ assignedDriverId: null }, { where: { assignedDriverId: req.params.id } });
    }
    
    res.json({ success: true, message: 'Driver assignments updated successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
