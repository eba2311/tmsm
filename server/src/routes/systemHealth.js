const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const os = require('os');
const mongoose = require('mongoose');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/system-health
router.get('/', async (req, res, next) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
        freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
        loadAverage: os.loadavg(),
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        name: mongoose.connection.name,
        host: mongoose.connection.host,
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      },
    };

    res.json({ success: true, data: health });
  } catch (err) { next(err); }
});

// GET /api/v1/system-health/metrics
router.get('/metrics', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: os.loadavg(),
      },
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss,
      },
      eventLoop: {
        lag: process.hrtime(),
      },
      uptime: process.uptime(),
    };

    res.json({ success: true, data: metrics });
  } catch (err) { next(err); }
});

module.exports = router;
