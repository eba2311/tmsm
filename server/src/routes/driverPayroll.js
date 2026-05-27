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
    const { page = 1, limit = 20, driverId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (driverId) where.driverId = driverId;

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
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: payroll, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// POST /api/v1/driver-payroll
router.post('/', async (req, res, next) => {
  try {
    const { driverId, baseSalary, allowances, deductions, period } = req.body;

    const driver = await Driver.findByPk(driverId, {
      include: [
        { model: User, as: 'user', attributes: ['name'] }
      ],
      attributes: ['id', 'licenseNumber']
    });
    
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const netPay = (parseFloat(baseSalary) || 0) + (parseFloat(allowances) || 0) - (parseFloat(deductions) || 0);

    const payroll = await DriverPayroll.create({
      driverId,
      baseSalary: baseSalary || 3000,
      allowances: allowances || 500,
      deductions: deductions || 200,
      netPay,
      paymentStatus: 'PENDING',
      period: period || new Date().toISOString().slice(0, 7)
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
router.get('/summary', async (req, res, next) => {
  try {
    const totalDrivers = await Driver.count();
    const totalPayroll = await DriverPayroll.sum('netPay');
    const pending = await DriverPayroll.count({ where: { paymentStatus: 'PENDING' } });
    const paid = await DriverPayroll.count({ where: { paymentStatus: 'PAID' } });
    
    res.json({ success: true, data: { totalDrivers, totalPayroll: totalPayroll || 0, pending, paid } });
  } catch (err) {
    res.json({ success: true, data: { totalDrivers: 0, totalPayroll: 0, pending: 0, paid: 0 } });
  }
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
