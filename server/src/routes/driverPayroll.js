const express = require('express');
const router = express.Router();
const DriverPayroll = require('../models/DriverPayroll');
const Driver = require('../models/Driver');
const { authenticate, authorize } = require('../middlewares/auth');

// Get all payroll records
router.get('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { driver, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};
    if (driver) query.driver = driver;
    if (status) query.status = status;
    if (startDate || endDate) {
      query['period.startDate'] = {};
      if (startDate) query['period.startDate'].$gte = new Date(startDate);
      if (endDate) query['period.endDate'].$lte = new Date(endDate);
    }

    const payroll = await DriverPayroll.find(query)
      .populate('driver', 'user licenseNumber')
      .populate('approvedBy', 'name email')
      .populate('processedBy', 'name email')
      .sort({ 'period.startDate': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await DriverPayroll.countDocuments(query);

    res.json({
      success: true,
      data: payroll,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) { next(error); }
});

// Get payroll for a specific driver
router.get('/driver/:driverId', authenticate, async (req, res, next) => {
  try {
    const payroll = await DriverPayroll.find({ driver: req.params.driverId })
      .populate('approvedBy', 'name email')
      .populate('processedBy', 'name email')
      .sort({ 'period.startDate': -1 })
      .lean();

    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) { next(error); }
});

// Get payroll by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const payroll = await DriverPayroll.findById(req.params.id)
      .populate('driver', 'user licenseNumber')
      .populate('approvedBy', 'name email')
      .populate('processedBy', 'name email')
      .lean();

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) { next(error); }
});

// Create new payroll record
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { driver, period, baseSalary, bonuses, deductions, tripsCompleted, hoursWorked, revenueGenerated, commissionRate, notes } = req.body;

    // Validate driver exists
    const driverDoc = await Driver.findById(driver);
    if (!driverDoc) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    // Calculate commission
    const commissionAmount = revenueGenerated && commissionRate ? (revenueGenerated * commissionRate) / 100 : 0;

    const payroll = await DriverPayroll.create({
      driver,
      period,
      baseSalary,
      bonuses: bonuses || [],
      deductions: deductions || [],
      tripsCompleted: tripsCompleted || 0,
      hoursWorked: hoursWorked || 0,
      revenueGenerated: revenueGenerated || 0,
      commissionRate: commissionRate || 0,
      commissionAmount,
      grossPay: baseSalary + (bonuses?.reduce((sum, b) => sum + b.amount, 0) || 0) + commissionAmount,
      netPay: 0, // Will be calculated by pre-save hook
      notes,
    });

    const populatedPayroll = await DriverPayroll.findById(payroll._id)
      .populate('driver', 'user licenseNumber')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedPayroll,
    });
  } catch (error) { next(error); }
});

// Update payroll record
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const payroll = await DriverPayroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    // Recalculate commission if revenue or rate changed
    if (req.body.revenueGenerated !== undefined || req.body.commissionRate !== undefined) {
      const revenueGenerated = req.body.revenueGenerated !== undefined ? req.body.revenueGenerated : payroll.revenueGenerated;
      const commissionRate = req.body.commissionRate !== undefined ? req.body.commissionRate : payroll.commissionRate;
      req.body.commissionAmount = (revenueGenerated * commissionRate) / 100;
    }

    const updatedPayroll = await DriverPayroll.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('driver', 'user licenseNumber')
      .populate('approvedBy', 'name email')
      .populate('processedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedPayroll,
    });
  } catch (error) { next(error); }
});

// Approve payroll
router.patch('/:id/approve', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const payroll = await DriverPayroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    payroll.status = 'PROCESSED';
    payroll.approvedBy = req.user._id;
    payroll.approvedAt = new Date();
    await payroll.save();

    const updatedPayroll = await DriverPayroll.findById(payroll._id)
      .populate('driver', 'user licenseNumber')
      .populate('approvedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedPayroll,
    });
  } catch (error) { next(error); }
});

// Mark as paid
router.patch('/:id/pay', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { paymentMethod, transactionReference } = req.body;
    const payroll = await DriverPayroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    payroll.status = 'PAID';
    payroll.paymentMethod = paymentMethod;
    payroll.paymentDate = new Date();
    payroll.transactionReference = transactionReference;
    payroll.processedBy = req.user._id;
    payroll.processedAt = new Date();
    await payroll.save();

    const updatedPayroll = await DriverPayroll.findById(payroll._id)
      .populate('driver', 'user licenseNumber')
      .populate('processedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedPayroll,
    });
  } catch (error) { next(error); }
});

// Delete payroll record
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const payroll = await DriverPayroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    await DriverPayroll.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Payroll record deleted successfully',
    });
  } catch (error) { next(error); }
});

// Get payroll summary
router.get('/summary/overview', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery['period.startDate'] = {};
      if (startDate) matchQuery['period.startDate'].$gte = new Date(startDate);
      if (endDate) matchQuery['period.endDate'].$lte = new Date(endDate);
    }

    const summary = await DriverPayroll.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPayroll: { $sum: '$netPay' },
          totalBonuses: { $sum: { $reduce: { input: '$bonuses', initialValue: 0, in: { $add: ['$$value', '$$this.amount'] } } } },
          totalDeductions: { $sum: { $reduce: { input: '$deductions', initialValue: 0, in: { $add: ['$$value', '$$this.amount'] } } } },
          totalDrivers: { $addToSet: '$driver' },
          processedCount: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalPayroll: 1,
          totalBonuses: 1,
          totalDeductions: 1,
          totalDrivers: { $size: '$totalDrivers' },
          processedCount: 1,
          pendingCount: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: summary[0] || {
        totalPayroll: 0,
        totalBonuses: 0,
        totalDeductions: 0,
        totalDrivers: 0,
        processedCount: 0,
        pendingCount: 0,
      },
    });
  } catch (error) { next(error); }
});

module.exports = router;
