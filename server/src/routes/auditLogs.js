const express = require('express');
const { Op } = require('sequelize');
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
    if (action) where.action = { [Op.iLike]: `%${action}%` };

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

// GET /api/v1/audit-logs/stats
router.get('/stats', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['name'] }],
      limit: 1000,
      order: [['created_at', 'DESC']],
    });

    const actionCounts = logs.reduce((acc, log) => {
      const key = log.action || 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const userCounts = logs.reduce((acc, log) => {
      const userName = log.user?.name || 'System';
      acc[userName] = (acc[userName] || 0) + 1;
      return acc;
    }, {});

    const actionStats = Object.entries(actionCounts).map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);

    const topUsers = Object.entries(userCounts).map(([userName, count]) => ({ userId: userName, userName, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ success: true, data: { actionStats, topUsers } });
  } catch (err) { next(err); }
});

// POST /api/v1/audit-logs
router.post('/', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { action, resource, resourceId, entity, entityId, details } = req.body;
    const log = await AuditLog.create({
      userId: req.user.id,
      action,
      resource: resource || entity,
      resourceId: resourceId || entityId,
      details,
      ipAddress: req.ip,
    });
    res.status(201).json({ success: true, data: log });
  } catch (err) { next(err); }
});

module.exports = router;
