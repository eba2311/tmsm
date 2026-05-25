const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middlewares/auth');

// Get audit logs (admin only)
router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      resource,
      userId,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) { next(error); }
});

// Get audit log statistics (admin only)
router.get('/stats', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const stats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const resourceStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$resource',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const userStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        actionStats: stats,
        resourceStats,
        topUsers: userStats,
      },
    });
  } catch (error) { next(error); }
});

module.exports = router;
