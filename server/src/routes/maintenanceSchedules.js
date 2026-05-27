const express = require('express');
const router = express.Router();
const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const { authenticate, authorize } = require('../middlewares/auth');

// Get all maintenance schedules
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { vehicle, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (vehicle) where.vehicleId = vehicle;

    const { count, rows: logs } = await MaintenanceLog.findAndCountAll({
      where,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['plateNumber', 'type', 'make', 'model']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['startDate', 'DESC']]
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) { next(error); }
});

// Get maintenance schedule by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findByPk(req.params.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['plateNumber', 'type', 'make', 'model']
        }
      ]
    });

    if (!log) return res.status(404).json({ success: false, message: 'Maintenance schedule not found' });

    res.json({ success: true, data: log });
  } catch (error) { next(error); }
});

// Create new maintenance schedule
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { vehicle, description, startDate, cost, servicedBy } = req.body;

    const log = await MaintenanceLog.create({
      vehicleId: vehicle,
      type: 'ROUTINE',
      description: description || 'Routine Maintenance',
      cost: cost ? parseFloat(cost) : null,
      startDate: startDate || new Date(),
      endDate: startDate || new Date(),
      status: 'PENDING',
      createdById: req.user.id
    });

    const logWithVehicle = await MaintenanceLog.findByPk(log.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['plateNumber', 'type', 'make', 'model']
        }
      ]
    });

    res.status(201).json({ success: true, data: logWithVehicle });
  } catch (error) { next(error); }
});

// Update maintenance schedule
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { description, startDate, cost, servicedBy } = req.body;
    
    const log = await MaintenanceLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Maintenance log not found' });

    await log.update({
      description,
      cost: cost ? parseFloat(cost) : null,
      startDate: startDate,
      endDate: startDate
    });

    const logWithVehicle = await MaintenanceLog.findByPk(log.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['plateNumber', 'type', 'make', 'model']
        }
      ]
    });

    res.json({ success: true, data: logWithVehicle });
  } catch (error) { next(error); }
});

// Start maintenance
router.patch('/:id/start', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Maintenance schedule not found' });

    await log.update({ status: 'IN_PROGRESS' });
    res.json({ success: true, data: log });
  } catch (error) { next(error); }
});

// Complete maintenance
router.patch('/:id/complete', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { cost, servicedBy, notes } = req.body;

    const log = await MaintenanceLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Maintenance schedule not found' });

    const newDescription = notes 
      ? (log.description ? `${log.description} | Notes: ${notes}` : `Notes: ${notes}`)
      : log.description;

    await log.update({
      cost: cost ? parseFloat(cost) : log.cost,
      description: newDescription,
      status: 'COMPLETED',
      endDate: new Date()
    });

    res.json({ success: true, data: log });
  } catch (error) { next(error); }
});

// Cancel maintenance
router.patch('/:id/cancel', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Maintenance schedule not found' });

    await log.update({ status: 'CANCELLED' });
    res.json({ success: true, data: { id: req.params.id, status: 'CANCELLED' } });
  } catch (error) { next(error); }
});

// Delete maintenance schedule
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Maintenance schedule not found' });

    await log.destroy();
    res.json({ success: true, message: 'Maintenance schedule deleted successfully' });
  } catch (error) { next(error); }
});

// Get maintenance summary
router.get('/summary/overview', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const logs = await MaintenanceLog.findAll({ attributes: ['cost', 'status'] });
    
    let totalCost = 0;
    for (const log of logs) {
      totalCost += (parseFloat(log.cost) || 0);
    }
    
    const completedCount = logs.filter(l => l.status === 'COMPLETED').length;
    
    res.json({
      success: true,
      data: {
        byStatus: [{ id: 'COMPLETED', count: completedCount, totalCost }],
        dueSoon: 0,
        overdue: 0,
      },
    });
  } catch (error) { next(error); }
});

module.exports = router;
