const express = require('express');
const Inventory = require('../models/Inventory');
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/inventory
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const { count, rows: items } = await Inventory.findAndCountAll({
      where,
      include: [
        {
          model: Route,
          as: 'route',
          attributes: ['id', 'name']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plateNumber']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: items, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// GET /api/v1/inventory/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Inventory.findByPk(req.params.id, {
      include: [
        {
          model: Route,
          as: 'route',
          attributes: ['id', 'name']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plateNumber']
        }
      ]
    });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// POST /api/v1/inventory
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const item = await Inventory.create({
      ...req.body,
      status: req.body.status || 'AVAILABLE'
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// PUT /api/v1/inventory/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const item = await Inventory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    await item.update(req.body);
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// DELETE /api/v1/inventory/:id
router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const item = await Inventory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    await item.destroy();
    res.json({ success: true, message: 'Inventory item deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
