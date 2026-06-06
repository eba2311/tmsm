const express = require('express');
const RouteOptimization = require('../models/RouteOptimization');
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/route-optimization
router.get('/', async (req, res, next) => {
  try {
    const optimizations = await RouteOptimization.findAll({
      include: [
        {
          model: Route,
          as: 'route',
          attributes: ['id', 'name', 'origin', 'destination']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plateNumber', 'type']
        }
      ],
      limit: 50,
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: optimizations });
  } catch (err) { next(err); }
});

// GET /api/v1/route-optimization/:id
router.get('/:id', async (req, res, next) => {
  try {
    const optimization = await RouteOptimization.findByPk(req.params.id, {
      include: [
        {
          model: Route,
          as: 'route'
        },
        {
          model: Vehicle,
          as: 'vehicle'
        }
      ]
    });
    if (!optimization) return res.status(404).json({ success: false, message: 'Optimization not found' });
    res.json({ success: true, data: optimization });
  } catch (err) { next(err); }
});

// POST /api/v1/route-optimization
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { routeId, vehicleId, notes } = req.body;
    const optimization = await RouteOptimization.create({
      routeId,
      vehicleId,
      status: 'PENDING',
      optimizedById: req.user.id,
      notes,
      optimizationMethod: 'NEAREST_NEIGHBOR'
    });
    res.status(201).json({ success: true, data: optimization });
  } catch (err) { next(err); }
});

// PUT /api/v1/route-optimization/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const optimization = await RouteOptimization.findByPk(req.params.id);
    if (!optimization) return res.status(404).json({ success: false, message: 'Optimization not found' });

    await optimization.update({ status: req.body.status, notes: req.body.notes });
    res.json({ success: true, data: optimization });
  } catch (err) { next(err); }
});

// DELETE /api/v1/route-optimization/:id
router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const optimization = await RouteOptimization.findByPk(req.params.id);
    if (!optimization) return res.status(404).json({ success: false, message: 'Optimization not found' });

    await optimization.destroy();
    res.json({ success: true, message: 'Optimization deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
