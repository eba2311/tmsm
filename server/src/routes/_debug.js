const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate, authorize('SUPER_ADMIN'));

// GET /api/v1/debug/db
router.get('/db', async (req, res, next) => {
  try {
    const { data, error, count } = await supabase.from('users').select('id', { count: 'exact', head: true });
    res.json({ success: true, data: { database: error ? 'ERROR' : 'OK', userCount: count || 0, error: error?.message } });
  } catch (err) { next(err); }
});

// GET /api/v1/debug/env
router.get('/env', async (req, res, next) => {
  res.json({
    success: true,
    data: {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET'
    }
  });
});

// GET /api/v1/debug/tables
router.get('/tables', async (req, res, next) => {
  try {
    const tables = ['users', 'drivers', 'vehicles', 'routes', 'schedules', 'bookings', 'maintenance_logs', 'audit_logs', 'route_optimizations', 'vehicle_location_history'];
    const results = {};
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      results[table] = error ? `ERROR: ${error.message}` : count;
    }
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

module.exports = router;
