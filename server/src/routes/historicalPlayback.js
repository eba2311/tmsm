const express = require('express');
const Joi = require('joi');
const VehicleLocationHistory = require('../models/VehicleLocationHistory');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/historical-playback/vehicle/:vehicleId
router.get('/vehicle/:vehicleId', async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { startDate, endDate, interval = '5min' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const history = await VehicleLocationHistory.find({
      vehicle: vehicleId,
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: 1 });
    
    // Group by interval to reduce data points
    const groupedHistory = groupByInterval(history, interval);
    
    res.json({ success: true, data: groupedHistory });
  } catch (err) { next(err); }
});

// GET /api/v1/historical-playback/fleet
router.get('/fleet', async (req, res, next) => {
  try {
    const { startDate, endDate, interval = '5min' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const history = await VehicleLocationHistory.find({
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: 1 });
    
    const groupedHistory = groupByInterval(history, interval);
    
    res.json({ success: true, data: groupedHistory });
  } catch (err) { next(err); }
});

// POST /api/v1/historical-playback/export
router.post('/export', async (req, res, next) => {
  try {
    const { vehicleId, startDate, endDate, format = 'json' } = req.body;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const history = await VehicleLocationHistory.find({
      vehicle: vehicleId,
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: 1 });
    
    if (format === 'csv') {
      const csv = convertToCSV(history);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=vehicle-history.csv');
      res.send(csv);
    } else {
      res.json({ success: true, data: history });
    }
  } catch (err) { next(err); }
});

function groupByInterval(history, interval) {
  const intervalMs = {
    '1min': 60000,
    '5min': 300000,
    '15min': 900000,
    '1hour': 3600000,
  }[interval] || 300000;
  
  const grouped = [];
  let lastTimestamp = null;
  
  history.forEach(point => {
    if (!lastTimestamp || point.timestamp - lastTimestamp >= intervalMs) {
      grouped.push(point);
      lastTimestamp = point.timestamp;
    }
  });
  
  return grouped;
}

function convertToCSV(history) {
  const headers = ['timestamp', 'latitude', 'longitude', 'speed', 'heading'];
  const rows = history.map(h => [
    h.timestamp.toISOString(),
    h.location.coordinates[1],
    h.location.coordinates[0],
    h.speed || 0,
    h.heading || 0,
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

module.exports = router;
