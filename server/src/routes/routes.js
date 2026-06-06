const express = require('express');
const Route = require('../models/Route');
const { authenticate, authorize } = require('../middlewares/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/v1/routes (public)
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { origin: { name: { [Op.iLike]: `%${search}%` } } },
        { destination: { name: { [Op.iLike]: `%${search}%` } } }
      ];
    }

    const routes = await Route.findAll({
      where,
      order: [['name', 'ASC']]
    });
    
    res.json({ success: true, data: routes });
  } catch (err) { next(err); }
});

// GET /api/v1/routes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const route = await Route.findByPk(req.params.id);
      
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    
    res.json({ success: true, data: route });
  } catch (err) { next(err); }
});

// POST /api/v1/routes
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { name, code, origin, destination, distance, estimatedDuration, baseFare } = req.body;
    
    if (!name) return res.status(400).json({ success: false, message: 'Route name is required' });

    const routeCode = code || `RT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const route = await Route.create({
      name,
      code: routeCode,
      origin: origin || null,
      destination: destination || null,
      distance: distance ? parseFloat(distance) : null,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
      baseFare: baseFare ? parseFloat(baseFare) : null,
      operatorId: req.user.id
    });
    
    res.status(201).json({ success: true, data: route });
  } catch (err) { next(err); }
});

// PUT /api/v1/routes/:id
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { name, origin, destination, distance, estimatedDuration, baseFare } = req.body;
    
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    await route.update({
      name,
      origin: origin || null,
      destination: destination || null,
      distance: distance ? parseFloat(distance) : null,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
      baseFare: baseFare ? parseFloat(baseFare) : null
    });
    
    res.json({ success: true, data: route });
  } catch (err) { next(err); }
});

// DELETE /api/v1/routes/:id
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    await route.destroy();
    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
