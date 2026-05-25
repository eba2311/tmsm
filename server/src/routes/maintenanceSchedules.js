const express = require('express');
const router = express.Router();
const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const { authenticate, authorize } = require('../middlewares/auth');

// Get all maintenance schedules
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { vehicle, status, priority, dueSoon, overdue, page = 1, limit = 50 } = req.query;

    const query = {};
    if (vehicle) query.vehicle = vehicle;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (dueSoon === 'true') {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      query.startDate = {
        $gte: new Date(),
        $lte: sevenDaysFromNow,
      };
      query.status = { $in: ['SCHEDULED', 'IN_PROGRESS'] };
    }

    if (overdue === 'true') {
      query.startDate = { $lt: new Date() };
      query.status = { $in: ['SCHEDULED', 'IN_PROGRESS'] };
    }

    const schedules = await MaintenanceLog.find(query)
      .populate('vehicle', 'plateNumber type make model')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name email')
      .populate('completedBy', 'name email')
      .sort({ startDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await MaintenanceLog.countDocuments(query);

    res.json({
      success: true,
      data: schedules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) { next(error); }
});

// Get maintenance schedule by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const schedule = await MaintenanceLog.findById(req.params.id)
      .populate('vehicle', 'plateNumber type make model')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name email')
      .populate('completedBy', 'name email')
      .lean();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance schedule not found',
      });
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) { next(error); }
});

// Create new maintenance schedule
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const {
      vehicle,
      type,
      description,
      startDate,
      endDate,
      priority,
      isRecurring,
      recurringInterval,
      recurringIntervalValue,
      reminderDays,
      assignedTo,
      estimatedDuration,
      cost,
      notes,
    } = req.body;

    // Validate vehicle exists
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    const schedule = await MaintenanceLog.create({
      vehicle,
      type,
      description,
      startDate,
      endDate,
      priority: priority || 'MEDIUM',
      isRecurring: isRecurring || false,
      recurringInterval,
      recurringIntervalValue,
      reminderDays: reminderDays || 7,
      assignedTo,
      estimatedDuration,
      cost,
      notes,
      createdBy: req.user._id,
    });

    const populatedSchedule = await MaintenanceLog.findById(schedule._id)
      .populate('vehicle', 'plateNumber type make model')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedSchedule,
    });
  } catch (error) { next(error); }
});

// Update maintenance schedule
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const schedule = await MaintenanceLog.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance schedule not found',
      });
    }

    const updatedSchedule = await MaintenanceLog.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('vehicle', 'plateNumber type make model')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedSchedule,
    });
  } catch (error) { next(error); }
});

// Start maintenance (change status to IN_PROGRESS)
router.patch('/:id/start', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const schedule = await MaintenanceLog.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance schedule not found',
      });
    }

    schedule.status = 'IN_PROGRESS';
    await schedule.save();

    const updatedSchedule = await MaintenanceLog.findById(schedule._id)
      .populate('vehicle', 'plateNumber type make model')
      .populate('assignedTo', 'name')
      .lean();

    res.json({
      success: true,
      data: updatedSchedule,
    });
  } catch (error) { next(error); }
});

// Complete maintenance
router.patch('/:id/complete', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { actualDuration, mileageAtService, partsReplaced, cost, servicedBy, garage, notes, nextServiceMileage, nextServiceDate } = req.body;

    const schedule = await MaintenanceLog.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance schedule not found',
      });
    }

    schedule.status = 'COMPLETED';
    schedule.endDate = new Date();
    schedule.completedBy = req.user._id;
    schedule.completedAt = new Date();
    
    if (actualDuration !== undefined) schedule.actualDuration = actualDuration;
    if (mileageAtService !== undefined) schedule.mileageAtService = mileageAtService;
    if (partsReplaced !== undefined) schedule.partsReplaced = partsReplaced;
    if (cost !== undefined) schedule.cost = cost;
    if (servicedBy !== undefined) schedule.servicedBy = servicedBy;
    if (garage !== undefined) schedule.garage = garage;
    if (notes !== undefined) schedule.notes = notes;
    if (nextServiceMileage !== undefined) schedule.nextServiceMileage = nextServiceMileage;
    if (nextServiceDate !== undefined) schedule.nextServiceDate = nextServiceDate;

    // If recurring, create next schedule
    if (schedule.isRecurring && schedule.recurringInterval && schedule.recurringIntervalValue) {
      const nextSchedule = new MaintenanceLog({
        vehicle: schedule.vehicle,
        type: schedule.type,
        description: schedule.description,
        priority: schedule.priority,
        isRecurring: true,
        recurringInterval: schedule.recurringInterval,
        recurringIntervalValue: schedule.recurringIntervalValue,
        reminderDays: schedule.reminderDays,
        assignedTo: schedule.assignedTo,
        estimatedDuration: schedule.estimatedDuration,
        createdBy: req.user._id,
      });

      // Calculate next date based on interval
      const nextDate = new Date();
      switch (schedule.recurringInterval) {
        case 'DAILY':
          nextDate.setDate(nextDate.getDate() + schedule.recurringIntervalValue);
          break;
        case 'WEEKLY':
          nextDate.setDate(nextDate.getDate() + (schedule.recurringIntervalValue * 7));
          break;
        case 'MONTHLY':
          nextDate.setMonth(nextDate.getMonth() + schedule.recurringIntervalValue);
          break;
        case 'QUARTERLY':
          nextDate.setMonth(nextDate.getMonth() + (schedule.recurringIntervalValue * 3));
          break;
        case 'YEARLY':
          nextDate.setFullYear(nextDate.getFullYear() + schedule.recurringIntervalValue);
          break;
      }
      nextSchedule.startDate = nextDate;
      await nextSchedule.save();
    }

    await schedule.save();

    const updatedSchedule = await MaintenanceLog.findById(schedule._id)
      .populate('vehicle', 'plateNumber type make model')
      .populate('assignedTo', 'name')
      .populate('completedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedSchedule,
    });
  } catch (error) { next(error); }
});

// Cancel maintenance
router.patch('/:id/cancel', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { notes } = req.body;
    const schedule = await MaintenanceLog.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance schedule not found',
      });
    }

    schedule.status = 'CANCELLED';
    if (notes) schedule.notes = notes;
    await schedule.save();

    const updatedSchedule = await MaintenanceLog.findById(schedule._id)
      .populate('vehicle', 'plateNumber type make model')
      .populate('assignedTo', 'name')
      .lean();

    res.json({
      success: true,
      data: updatedSchedule,
    });
  } catch (error) { next(error); }
});

// Delete maintenance schedule
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const schedule = await MaintenanceLog.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance schedule not found',
      });
    }

    await MaintenanceLog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Maintenance schedule deleted successfully',
    });
  } catch (error) { next(error); }
});

// Get maintenance summary
router.get('/summary/overview', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const summary = await MaintenanceLog.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
        },
      },
    ]);

    const dueSoon = await MaintenanceLog.countDocuments({
      startDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
    });

    const overdue = await MaintenanceLog.countDocuments({
      startDate: { $lt: new Date() },
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
    });

    res.json({
      success: true,
      data: {
        byStatus: summary,
        dueSoon,
        overdue,
      },
    });
  } catch (error) { next(error); }
});

module.exports = router;
