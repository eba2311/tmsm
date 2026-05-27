const express = require('express');
const Geofence = require('../models/Geofence');
const Vehicle = require('../models/Vehicle');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/geofencing/zones
router.get('/zones', async (req, res, next) => {
  try {
    const zones = await Geofence.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: zones });
  } catch (err) { next(err); }
});

// POST /api/v1/geofencing/zones
router.post('/zones', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const zone = await Geofence.create({
      ...req.body,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      createdById: req.user.id
    });
    res.status(201).json({ success: true, data: zone });
  } catch (err) { next(err); }
});

// GET /api/v1/geofencing/alerts
router.get('/alerts', async (req, res, next) => {
  res.json({ success: true, data: [] });
});

// GET /api/v1/geofencing/vehicles
router.get('/vehicles', async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['id', 'plateNumber', 'type', 'status', 'currentLocation']
    });
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
});

// PUT /api/v1/geofencing/zones/:id
router.put('/zones/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const zone = await Geofence.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

    await zone.update(req.body);
    res.json({ success: true, data: zone });
  } catch (err) { next(err); }
});

// DELETE /api/v1/geofencing/zones/:id
router.delete('/zones/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const zone = await Geofence.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

    await zone.destroy();
    res.json({ success: true, message: 'Zone deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
