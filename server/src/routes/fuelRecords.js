const express = require('express');
const FuelRecord = require('../models/FuelRecord');
const Vehicle = require('../models/Vehicle');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/fuel-records
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, vehicleId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (vehicleId) where.vehicleId = vehicleId;

    const { count, rows: records } = await FuelRecord.findAndCountAll({
      where,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plateNumber', 'type']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']]
    });

    res.json({ success: true, data: records, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 20 } });
  }
});

// POST /api/v1/fuel-records
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { vehicleId, quantity, costPerUnit, totalCost, date, odometerReading, previousOdometer, station, location, paymentMethod, receiptNumber, notes } = req.body;

    const record = await FuelRecord.create({
      vehicleId,
      quantity,
      costPerUnit,
      totalCost,
      date: date || new Date(),
      odometerReading,
      previousOdometer,
      station,
      location,
      paymentMethod,
      receiptNumber,
      notes,
      operatorId: req.user.id
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
});

// GET /api/v1/fuel-records/:id
router.get('/:id', async (req, res, next) => {
  try {
    const record = await FuelRecord.findByPk(req.params.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plateNumber']
        }
      ]
    });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
});

// PUT /api/v1/fuel-records/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const record = await FuelRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    await record.update(req.body);
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
});

// DELETE /api/v1/fuel-records/:id
router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const record = await FuelRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    await record.destroy();
    res.json({ success: true, message: 'Fuel record deleted' });
  } catch (err) { next(err); }
});

// GET /api/v1/fuel-records/summary/overview
router.get('/summary/overview', async (req, res, next) => {
  try {
    const records = await FuelRecord.findAll({ attributes: ['totalCost'] });
    const total = records.reduce((s, r) => s + (parseFloat(r.totalCost) || 0), 0);
    res.json({ success: true, data: { totalCost: total, totalRecords: records.length } });
  } catch (err) {
    res.json({ success: true, data: { totalCost: 0, totalRecords: 0 } });
  }
});

module.exports = router;
