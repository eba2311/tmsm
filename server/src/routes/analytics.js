const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'OPERATOR'));

// GET /api/v1/analytics/drivers
router.get('/drivers', (req, res) => res.json({ success: true, data: [] }));

// GET /api/v1/analytics/drivers/top-performers
router.get('/drivers/top-performers', (req, res) => res.json({ success: true, data: [] }));

// GET /api/v1/analytics/drivers/trends
router.get('/drivers/trends', (req, res) => res.json({ success: true, data: [] }));

// GET /api/v1/analytics/drivers/:id
router.get('/drivers/:id', (req, res) => res.json({ success: true, data: {} }));

module.exports = router;
