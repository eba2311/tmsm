const express = require('express');
const ReportSchedule = require('../models/ReportSchedule');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate, authorize('SUPER_ADMIN'));

// GET /api/v1/report-schedules
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const { count, rows: schedules } = await ReportSchedule.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: schedules, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// POST /api/v1/report-schedules
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      description,
      reportType,
      scheduleType,
      scheduleTime,
      schedule,
      format,
      recipients,
      filters,
      status,
    } = req.body;

    const schedulePayload = {
      name,
      description,
      reportType,
      scheduleType: scheduleType || schedule?.type,
      scheduleTime: scheduleTime || schedule?.time,
      format,
      recipients: Array.isArray(recipients)
        ? recipients
        : String(recipients || '').split(',').map((email) => email.trim()).filter(Boolean),
      filters: filters || {},
      status: status || 'ACTIVE',
      createdById: req.user?.id,
    };

    const createdSchedule = await ReportSchedule.create(schedulePayload);
    res.status(201).json({ success: true, data: createdSchedule });
  } catch (err) { next(err); }
});

// GET /api/v1/report-schedules/:id
router.get('/:id', async (req, res, next) => {
  try {
    const schedule = await ReportSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Report schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

// PUT /api/v1/report-schedules/:id
router.put('/:id', async (req, res, next) => {
  try {
    const schedule = await ReportSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Report schedule not found' });

    await schedule.update(req.body);
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

// DELETE /api/v1/report-schedules/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const schedule = await ReportSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Report schedule not found' });

    await schedule.destroy();
    res.json({ success: true, message: 'Report schedule deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
