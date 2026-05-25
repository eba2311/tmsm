const express = require('express');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/drivers
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    let query = Driver.find(filter)
      .populate('user', 'name email phone avatar')
      .populate('assignedVehicle', 'plateNumber type make model')
      .populate('assignedRoute', 'name code')
      .skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

    const [drivers, total] = await Promise.all([query, Driver.countDocuments(filter)]);
    res.json({ success: true, data: drivers, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /api/v1/drivers/stats/overview — must be before /:id
router.get('/stats/overview', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const stats = await Driver.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// GET /api/v1/drivers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('user', 'name email phone avatar')
      .populate('assignedVehicle').populate('assignedRoute').populate('operator', 'name');
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
});

// POST /api/v1/drivers
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { name, email, phone, password, ...driverData } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, phone, password: password || 'DefaultPass@123', role: 'DRIVER' });
    }

    const driver = await Driver.create({ ...driverData, user: user._id, operator: req.user._id });
    res.status(201).json({ success: true, data: driver });
  } catch (err) { next(err); }
});

// PUT /api/v1/drivers/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
});

// PATCH /api/v1/drivers/:id/assign
router.patch('/:id/assign', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { vehicleId, routeId } = req.body;
    const driver = await Driver.findByIdAndUpdate(req.params.id, {
      assignedVehicle: vehicleId || null,
      assignedRoute: routeId || null,
    }, { new: true });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
});

module.exports = router;
