const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'OPERATOR'));

// GET /api/v1/fuel/consumption
router.get('/consumption', (req, res) => res.json({ success: true, data: [] }));

// GET /api/v1/fuel/alerts
router.get('/alerts', (req, res) => res.json({ success: true, data: [] }));

// GET /api/v1/fuel/cost-analysis
router.get('/cost-analysis', (req, res) => res.json({ success: true, data: [] }));

module.exports = router;
