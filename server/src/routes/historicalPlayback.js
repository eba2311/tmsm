const express = require('express');
const { Op } = require('sequelize');
const VehicleLocationHistory = require('../models/VehicleLocationHistory');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/historical-playback/:vehicleId
router.get('/:vehicleId', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = { vehicleId: req.params.vehicleId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }

    const data = await VehicleLocationHistory.findAll({
      where,
      order: [['timestamp', 'ASC']],
      limit: 500
    });
    
    res.json({ success: true, data: data || [] });
  } catch (err) { next(err); }
});

// GET /api/v1/historical-playback
router.get('/', async (req, res, next) => {
  res.json({ success: true, data: [] });
});

module.exports = router;
