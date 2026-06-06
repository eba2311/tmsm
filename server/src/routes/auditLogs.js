const express = require('express');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/audit-logs
router.get('/', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, action } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: logs, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// POST /api/v1/audit-logs
router.post('/', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { action, entity, entityId, details } = req.body;
    const log = await AuditLog.create({
      userId: req.user.id,
      action,
      entity,
      entityId,
      details,
      ipAddress: req.ip
    });
    res.status(201).json({ success: true, data: log });
  } catch (err) { next(err); }
});

module.exports = router;
