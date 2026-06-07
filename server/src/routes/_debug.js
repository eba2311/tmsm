const express = require('express');
const { sequelize } = require('../config/database');

const router = express.Router();

// PUBLIC diagnostic — no auth needed so you can test DB without logging in
// GET /api/v1/debug/ping
router.get('/ping', async (req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    // Mask password in URL for safety
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    await sequelize.authenticate();
    res.json({
      success: true,
      database: 'CONNECTED',
      project: maskedUrl,
      time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      database: 'FAILED',
      error: err.message,
      hint: 'Check DATABASE_URL in server/.env — make sure it points to your PostgreSQL instance',
    });
  }
});

// GET /api/v1/debug/tables — lists row counts per table
router.get('/tables', async (req, res) => {
  const tables = ['users', 'drivers', 'vehicles', 'routes', 'schedules', 'bookings', 'payments'];
  const results = {};
  for (const table of tables) {
    try {
      const [counts] = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}"`);
      results[table] = parseInt(counts[0].count);
    } catch (error) {
      results[table] = `MISSING or ERROR: ${error.message}`;
    }
  }
  res.json({ success: true, data: results });
});

// POST /api/v1/debug/test-driver — test driver creation directly (dev only)
router.post('/test-driver', async (req, res) => {
  try {
    const User = require('../models/User');
    const Driver = require('../models/Driver');

    const testEmail = `test_driver_debug_${Date.now()}@tmsm.local`;
    const user = await User.create({
      name: 'Debug Test Driver',
      email: testEmail,
      password: 'TestPass@123',
      role: 'DRIVER',
    });

    const driver = await Driver.create({
      userId: user.id,
      licenseNumber: `DBG-${Date.now()}`,
      licenseClass: 'C',
      status: 'ACTIVE',
      salary: 5000,
    });

    // Clean up
    await driver.destroy();
    await user.destroy();

    res.json({ success: true, message: 'Driver creation test PASSED — models and DB are working correctly' });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Driver creation test FAILED',
      error: err.message,
      name: err.name,
      detail: err.errors ? err.errors.map(e => e.message) : undefined,
      hint: 'This shows the exact error that happens when the frontend tries to add a driver',
    });
  }
});

module.exports = router;
