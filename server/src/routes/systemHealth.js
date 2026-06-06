const express = require('express');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate, authorize('SUPER_ADMIN'));

// GET /api/v1/system-health
router.get('/', async (req, res, next) => {
  try {
    // Check DB connectivity
    let dbStatus = 'UP';
    try {
      await User.count();
    } catch (err) {
      dbStatus = 'DOWN';
    }
    
    res.json({
      success: true,
      data: {
        status: dbStatus === 'DOWN' ? 'DEGRADED' : 'HEALTHY',
        database: dbStatus,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;

