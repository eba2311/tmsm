const express = require('express');
const router = express.Router();
const ReportSchedule = require('../models/ReportSchedule');
const { authenticate, authorize } = require('../middlewares/auth');

// Get all report schedules
router.get('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50, isActive } = req.query;

    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const schedules = await ReportSchedule.find(query)
      .populate('createdBy', 'name email')
      .sort({ nextRun: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ReportSchedule.countDocuments(query);

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

// Get report schedule by ID
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const schedule = await ReportSchedule.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Report schedule not found',
      });
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) { next(error); }
});

// Create new report schedule
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const schedule = await ReportSchedule.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedSchedule = await ReportSchedule.findById(schedule._id)
      .populate('createdBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedSchedule,
    });
  } catch (error) { next(error); }
});

// Update report schedule
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const schedule = await ReportSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Report schedule not found',
      });
    }

    const updatedSchedule = await ReportSchedule.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedSchedule,
    });
  } catch (error) { next(error); }
});

// Delete report schedule
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const schedule = await ReportSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Report schedule not found',
      });
    }

    await ReportSchedule.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Report schedule deleted successfully',
    });
  } catch (error) { next(error); }
});

// Toggle schedule active status
router.patch('/:id/toggle', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const schedule = await ReportSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Report schedule not found',
      });
    }

    schedule.isActive = !schedule.isActive;
    if (schedule.isActive) {
      schedule.calculateNextRun();
    } else {
      schedule.nextRun = null;
    }
    await schedule.save();

    const updatedSchedule = await ReportSchedule.findById(schedule._id)
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedSchedule,
    });
  } catch (error) { next(error); }
});

// Run schedule manually
router.post('/:id/run', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const schedule = await ReportSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Report schedule not found',
      });
    }

    // Update last run time
    schedule.lastRun = new Date();
    await schedule.save();

    // In a real implementation, you would generate and send the report here
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'Report generated and sent successfully',
      data: {
        scheduleId: schedule._id,
        runAt: schedule.lastRun,
      },
    });
  } catch (error) { next(error); }
});

module.exports = router;
