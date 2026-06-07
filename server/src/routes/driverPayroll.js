const express = require('express');
const DriverPayroll = require('../models/DriverPayroll');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate, authorize('SUPER_ADMIN', 'OPERATOR'));

// GET /api/v1/driver-payroll
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, driverId, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (driverId) where.driverId = driverId;
    if (status && status !== 'all') where.status = status;

    const { count, rows: payroll } = await DriverPayroll.findAndCountAll({
      where,
      include: [
        {
          model: Driver,
          as: 'driver',
          include: [
            { model: User, as: 'user', attributes: ['name', 'email', 'phone'] }
          ],
          attributes: ['id', 'licenseNumber', 'status', 'yearsOfExperience']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: payroll, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// POST /api/v1/driver-payroll
router.post('/', async (req, res, next) => {
  try {
    const {
      driverId: requestedDriverId,
      baseSalary,
      tripsCompleted,
      revenueGenerated,
      commissionRate,
      periodStartDate,
      periodEndDate,
      period
    } = req.body;

    const driverId = requestedDriverId || req.body.driver;
    const startDate = periodStartDate || period?.startDate;
    const endDate = periodEndDate || period?.endDate;

    if (!driverId) return res.status(400).json({ success: false, message: 'Driver is required' });
    if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'Payroll period start and end dates are required' });

    const driver = await Driver.findByPk(driverId, {
      include: [
        { model: User, as: 'user', attributes: ['name'] }
      ],
      attributes: ['id', 'licenseNumber']
    });
    
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const commissionAmount = (parseFloat(revenueGenerated) || 0) * ((parseFloat(commissionRate) || 0) / 100);

    const payroll = await DriverPayroll.create({
      driverId,
      periodType: 'MONTHLY',
      periodStartDate: new Date(startDate),
      periodEndDate: new Date(endDate),
      baseSalary: parseFloat(baseSalary) || 3000,
      tripsCompleted: parseInt(tripsCompleted) || 0,
      revenueGenerated: parseFloat(revenueGenerated) || 0,
      commissionRate: parseFloat(commissionRate) || 0,
      commissionAmount,
      status: 'PENDING'
    });

    const payrollWithDriver = await DriverPayroll.findByPk(payroll.id, {
      include: [
        {
          model: Driver,
          as: 'driver',
          include: [
            { model: User, as: 'user', attributes: ['name'] }
          ]
        }
      ]
    });

    res.status(201).json({ success: true, data: payrollWithDriver });
  } catch (err) { next(err); }
});

// GET /api/v1/driver-payroll/summary
router.get(['/summary', '/summary/overview'], async (req, res, next) => {
  try {
    const totalDrivers = await Driver.count();
    const totalPayroll = await DriverPayroll.sum('netPay');
    const pendingCount = await DriverPayroll.count({ where: { status: 'PENDING' } });
    const processedCount = await DriverPayroll.count({ where: { status: 'PROCESSED' } });
    const paidCount = await DriverPayroll.count({ where: { status: 'PAID' } });
    
    res.json({ success: true, data: { totalDrivers, totalPayroll: totalPayroll || 0, pendingCount, processedCount, paidCount } });
  } catch (err) {
    res.json({ success: true, data: { totalDrivers: 0, totalPayroll: 0, pendingCount: 0, processedCount: 0, paidCount: 0 } });
  }
});

// PATCH /api/v1/driver-payroll/:id/approve
router.patch('/:id/approve', async (req, res, next) => {
  try {
    const payroll = await DriverPayroll.findByPk(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });

    await payroll.update({ status: 'PROCESSED', approvedAt: new Date() });
    res.json({ success: true, data: payroll });
  } catch (err) { next(err); }
});

// PATCH /api/v1/driver-payroll/:id/pay
router.patch('/:id/pay', async (req, res, next) => {
  try {
    const payroll = await DriverPayroll.findByPk(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });

    await payroll.update({
      status: 'PAID',
      paymentMethod: req.body.paymentMethod || payroll.paymentMethod || 'BANK_TRANSFER',
      paymentDate: new Date(),
      processedAt: new Date()
    });
    res.json({ success: true, data: payroll });
  } catch (err) { next(err); }
});

// GET /api/v1/driver-payroll/:id
router.get('/:id', async (req, res, next) => {
  try {
    const payroll = await DriverPayroll.findByPk(req.params.id, {
      include: [
        {
          model: Driver,
          as: 'driver',
          include: [
            { model: User, as: 'user', attributes: ['name'] }
          ]
        }
      ]
    });
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });
    res.json({ success: true, data: payroll });
  } catch (err) { next(err); }
});

// PUT /api/v1/driver-payroll/:id
router.put('/:id', async (req, res, next) => {
  try {
    const payroll = await DriverPayroll.findByPk(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });

    await payroll.update(req.body);
    res.json({ success: true, data: payroll });
  } catch (err) { next(err); }
});

// DELETE /api/v1/driver-payroll/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const payroll = await DriverPayroll.findByPk(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });

    await payroll.destroy();
    res.json({ success: true, message: 'Payroll record deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
