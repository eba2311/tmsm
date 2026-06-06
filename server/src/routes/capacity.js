const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'OPERATOR'));

// GET /api/v1/capacity/realtime
router.get('/realtime', (req, res) => res.json({ success: true, data: [] }));

// GET /api/v1/capacity/trends
router.get('/trends', (req, res) => res.json({ success: true, data: [] }));

// GET /api/v1/capacity/alerts
router.get('/alerts', (req, res) => res.json({ success: true, data: [] }));

// GET /api/v1/capacity/routes/:id
router.get('/routes/:id', (req, res) => res.json({ success: true, data: {} }));

module.exports = router;
