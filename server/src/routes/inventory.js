const express = require('express');
const Joi = require('joi');
const Inventory = require('../models/Inventory');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

const inventorySchema = Joi.object({
  type: Joi.string().valid('PHYSICAL_TICKET', 'DIGITAL_TICKET', 'MONTHLY_PASS').required(),
  quantity: Joi.number().min(0).required(),
  price: Joi.number().min(0).required(),
  route: Joi.string().optional(),
  vehicle: Joi.string().optional(),
  status: Joi.string().valid('AVAILABLE', 'SOLD', 'RESERVED', 'EXPIRED').default('AVAILABLE'),
  expiryDate: Joi.date().optional(),
  description: Joi.string().allow('', null).optional(),
});

// GET /api/v1/inventory
router.get('/', async (req, res, next) => {
  try {
    const { type, status, route, vehicle } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (route) filter.route = route;
    if (vehicle) filter.vehicle = vehicle;

    const inventory = await Inventory.find(filter)
      .populate('route', 'name')
      .populate('vehicle', 'plateNumber')
      .sort({ createdAt: -1 });
    
    const summary = await Inventory.aggregate([
      { $match: filter },
      { $group: {
        _id: '$type',
        total: { $sum: '$quantity' },
        available: { $sum: { $cond: [{ $eq: ['$status', 'AVAILABLE'] }, '$quantity', 0] } },
        sold: { $sum: { $cond: [{ $eq: ['$status', 'SOLD'] }, '$quantity', 0] } },
      }},
    ]);

    res.json({ success: true, data: inventory, summary });
  } catch (err) { next(err); }
});

// GET /api/v1/inventory/stats
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalAvailable: { $sum: { $cond: [{ $eq: ['$status', 'AVAILABLE'] }, '$quantity', 0] } },
          totalSold: { $sum: { $cond: [{ $eq: ['$status', 'SOLD'] }, '$quantity', 0] } },
          totalReserved: { $sum: { $cond: [{ $eq: ['$status', 'RESERVED'] }, '$quantity', 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'SOLD'] }, { $multiply: ['$quantity', '$price'] }, 0] } },
        },
      },
    ]);

    res.json({ success: true, data: stats[0] || {} });
  } catch (err) { next(err); }
});

// POST /api/v1/inventory
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { error, value } = inventorySchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });
    const inventory = await Inventory.create({ ...value, createdBy: req.user._id });
    res.status(201).json({ success: true, data: inventory });
  } catch (err) { next(err); }
});

// PUT /api/v1/inventory/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!inventory) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    res.json({ success: true, data: inventory });
  } catch (err) { next(err); }
});

// POST /api/v1/inventory/:id/sell
router.post('/:id/sell', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { quantity = 1 } = req.body;
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    if (inventory.quantity < quantity) return res.status(400).json({ success: false, message: 'Insufficient quantity' });
    
    inventory.quantity -= quantity;
    if (inventory.quantity === 0) inventory.status = 'SOLD';
    await inventory.save();
    
    res.json({ success: true, data: inventory });
  } catch (err) { next(err); }
});

module.exports = router;
