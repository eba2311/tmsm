const express = require('express');
const Route = require('../models/Route');
const { authenticate, authorize } = require('../middlewares/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/v1/routes (public - no auth needed for searching routes)
router.get('/', async (req, res, next) => {
  try {
    const { search, status } = req.query;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const routes = await Route.findAll({
      where,
      order: [['name', 'ASC']]
    });

    res.json({ success: true, data: routes });
  } catch (err) { next(err); }
});

// GET /api/v1/routes/:id (public)
router.get('/:id', async (req, res, next) => {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (err) { next(err); }
});

// POST /api/v1/routes
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const {
      name, nameAm, code,
      origin, destination, stops,
      distance, estimatedDuration, baseFare,
      status, transportType, isIntercity
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Route name is required' });
    }
    if (!distance || isNaN(parseFloat(distance))) {
      return res.status(400).json({ success: false, message: 'Distance (km) is required' });
    }
    if (!estimatedDuration || isNaN(parseInt(estimatedDuration))) {
      return res.status(400).json({ success: false, message: 'Estimated duration (minutes) is required' });
    }
    if (!baseFare || isNaN(parseFloat(baseFare))) {
      return res.status(400).json({ success: false, message: 'Base fare is required' });
    }

    // Generate a guaranteed-unique code
    const routeCode = code && String(code).trim()
      ? String(code).trim()
      : `RT-${Date.now().toString(36).toUpperCase()}`;

    const route = await Route.create({
      name: String(name).trim(),
      nameAm: nameAm || null,
      code: routeCode,
      origin: origin || { name: '', coordinates: { type: 'Point', coordinates: [37.5543, 6.0333] } },
      destination: destination || { name: '', coordinates: { type: 'Point', coordinates: [0, 0] } },
      stops: stops || [],
      distance: parseFloat(distance),
      estimatedDuration: parseInt(estimatedDuration),
      baseFare: parseFloat(baseFare),
      status: status || 'ACTIVE',
      transportType: transportType || ['BUS'],
      isIntercity: isIntercity !== undefined ? isIntercity : false,
      operatorId: req.user.id
    });

    res.status(201).json({ success: true, data: route });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Route code already exists. Leave code blank to auto-generate one.' });
    }
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: err.errors.map(e => e.message).join(', ') });
    }
    next(err);
  }
});

// PUT /api/v1/routes/:id
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), async (req, res, next) => {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const updates = {};
    if (req.body.name !== undefined)              updates.name = req.body.name;
    if (req.body.nameAm !== undefined)            updates.nameAm = req.body.nameAm;
    if (req.body.origin !== undefined)            updates.origin = req.body.origin;
    if (req.body.destination !== undefined)       updates.destination = req.body.destination;
    if (req.body.stops !== undefined)             updates.stops = req.body.stops;
    if (req.body.distance !== undefined)          updates.distance = parseFloat(req.body.distance);
    if (req.body.estimatedDuration !== undefined) updates.estimatedDuration = parseInt(req.body.estimatedDuration);
    if (req.body.baseFare !== undefined)          updates.baseFare = parseFloat(req.body.baseFare);
    if (req.body.status !== undefined)            updates.status = req.body.status;
    if (req.body.transportType !== undefined)     updates.transportType = req.body.transportType;
    if (req.body.isIntercity !== undefined)       updates.isIntercity = req.body.isIntercity;

    await route.update(updates);
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
