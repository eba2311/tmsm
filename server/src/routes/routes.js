const express = require('express');
const Route = require('../models/Route');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// GET /api/v1/routes (public)
router.get('/', async (req, res, next) => {
  try {
    const { status, type, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.transportType = type;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { 'origin.name': { $regex: search, $options: 'i' } },
      { 'destination.name': { $regex: search, $options: 'i' } },
    ];

    const routes = await Route.find(filter).sort({ name: 1 });
    res.json({ success: true, data: routes });
  } catch (err) { next(err); }
});

// GET /api/v1/routes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id).populate('operator', 'name');
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (err) { next(err); }
});

// POST /api/v1/routes
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const route = await Route.create({ ...req.body, operator: req.user._id });
    res.status(201).json({ success: true, data: route });
  } catch (err) { next(err); }
});

// PUT /api/v1/routes/:id
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (err) { next(err); }
});

// DELETE /api/v1/routes/:id
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    await Route.findByIdAndUpdate(req.params.id, { status: 'INACTIVE' });
    res.json({ success: true, message: 'Route deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
