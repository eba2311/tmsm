const express = require('express');
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
          attributes: ['id', 'plateNumber', 'type', 'make', 'model'],
          required: false,
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
    const drivers = await Driver.findAll({ attributes: ['status'] });
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
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'avatar'] },
        { model: Vehicle, as: 'assignedVehicle', attributes: ['id', 'plateNumber', 'type', 'make', 'model'], required: false }
      ]
    });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
});

// POST /api/v1/drivers
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const { name, email, phone, password, licenseNumber, licenseClass, licenseType, licenseExpiry, yearsOfExperience, status, salary } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Driver name is required' });
    }
    if (!licenseNumber || !String(licenseNumber).trim()) {
      return res.status(400).json({ success: false, message: 'License Number is required' });
    }

    // Check duplicate license
    const existingDriver = await Driver.findOne({ where: { licenseNumber: String(licenseNumber).trim() } });
    if (existingDriver) {
      return res.status(409).json({ success: false, message: 'A driver with this license number already exists' });
    }

    // Build driver email
    let driverEmail = (email && String(email).trim() !== '') ? String(email).trim().toLowerCase() : null;
    if (!driverEmail) {
      driverEmail = `driver_${String(licenseNumber).replace(/\s+/g, '').toLowerCase()}_${Date.now()}@tmsm.local`;
    }

    // 1. Find or create user account for this driver
    let user = await User.findOne({ where: { email: driverEmail } });
    if (!user) {
      try {
        user = await User.create({
          name: String(name).trim(),
          email: driverEmail,
          phone: (phone && String(phone).trim() !== '') ? String(phone).trim() : null,
          password: (password && String(password).trim() !== '') ? String(password).trim() : 'DefaultPass@123',
          role: 'DRIVER',
        });
      } catch (createErr) {
        console.error('[DRIVER USER CREATE ERROR]', createErr.name, createErr.message);
        if (createErr.name === 'SequelizeUniqueConstraintError') {
          return res.status(409).json({ success: false, message: 'Email already registered. Use a different email or leave blank.' });
        }
        if (createErr.name === 'SequelizeValidationError') {
          return res.status(400).json({ success: false, message: createErr.errors.map(e => e.message).join(', ') });
        }
        throw createErr;
      }
    }

    // Check if user already has a driver profile
    const existing = await Driver.findOne({ where: { userId: user.id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This user already has a driver profile' });
    }

    // Resolve optional fields
    const expiry = (licenseExpiry && licenseExpiry !== 'null' && licenseExpiry !== '') ? licenseExpiry : null;
    const expYears = (yearsOfExperience && yearsOfExperience !== 'null' && yearsOfExperience !== '') ? parseInt(yearsOfExperience) : 0;
    const resolvedClass = (licenseClass && licenseClass !== 'null' && licenseClass !== '')
      ? String(licenseClass)
      : (licenseType && licenseType !== 'null' && licenseType !== '') ? String(licenseType) : null;

    // 2. Create driver profile
    const driver = await Driver.create({
      userId: user.id,
      licenseNumber: String(licenseNumber).trim(),
      licenseClass: resolvedClass,
      licenseExpiry: expiry,
      experience: expYears,
      salary: (salary && !isNaN(parseFloat(salary))) ? parseFloat(salary) : 0,
      status: status || 'ACTIVE',
    });

    // 3. Return driver with user info
    const driverWithUser = await Driver.findByPk(driver.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
    });

    return res.status(201).json({ success: true, data: driverWithUser });

  } catch (err) {
    console.error('[DRIVER CREATE ERROR]', err.name, err.message, err.errors);
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors?.[0]?.path || 'field';
      return res.status(409).json({ success: false, message: `Duplicate ${field} — already exists` });
    }
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: err.errors.map(e => e.message).join(', ') });
    }
    return res.status(500).json({ success: false, message: err.message || 'Server error creating driver' });
  }
});

// PUT /api/v1/drivers/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const { licenseNumber, licenseClass, licenseType, licenseExpiry, yearsOfExperience, status, salary } = req.body;

    const expiry = (licenseExpiry && licenseExpiry !== 'null' && licenseExpiry !== '') ? licenseExpiry : null;
    const expYears = (yearsOfExperience && yearsOfExperience !== 'null' && yearsOfExperience !== '') ? parseInt(yearsOfExperience) : 0;

    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    await driver.update({
      licenseNumber: licenseNumber || driver.licenseNumber,
      licenseClass: (licenseClass && licenseClass !== 'null') ? licenseClass : ((licenseType && licenseType !== 'null') ? licenseType : driver.licenseClass),
      licenseExpiry: expiry,
      experience: expYears,
      salary: salary ? parseFloat(salary) : driver.salary,
      status: status || driver.status,
    });

    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
});

// DELETE /api/v1/drivers/:id
router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    await driver.destroy();
    res.json({ success: true, message: 'Driver deleted' });
  } catch (err) { next(err); }
});

// PATCH /api/v1/drivers/:id/assign
router.patch('/:id/assign', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const { vehicleId, routeId } = req.body;

    if (vehicleId) {
      await Vehicle.update({ assignedDriverId: req.params.id }, { where: { id: vehicleId } });
    } else {
      await Vehicle.update({ assignedDriverId: null }, { where: { assignedDriverId: req.params.id } });
    }

    res.json({ success: true, message: 'Driver assignments updated successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
