const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');

// Get mobile users
router.get('/users', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    // Mock data for mobile users
    const users = [
      { id: '1', name: 'Abebe Bikila', email: 'abebe@example.com', platform: 'android', appVersion: '2.1.0', lastActive: new Date(), isActive: true },
      { id: '2', name: 'Haile Gebrselassie', email: 'haile@example.com', platform: 'ios', appVersion: '2.1.0', lastActive: new Date(), isActive: true },
      { id: '3', name: 'Derartu Tulu', email: 'derartu@example.com', platform: 'android', appVersion: '2.0.5', lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), isActive: false },
    ];
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

// Get mobile usage analytics
router.get('/usage', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const usage = [
      { feature: 'Real-time Tracking', dailyUsers: 145, avgUsage: 25, crashRate: 0.2, totalSessions: 1200, avgSessionDuration: 12 },
      { feature: 'Trip Management', dailyUsers: 89, avgUsage: 15, crashRate: 0.5, totalSessions: 800, avgSessionDuration: 8 },
      { feature: 'Offline Mode', dailyUsers: 34, avgUsage: 45, crashRate: 1.2, totalSessions: 300, avgSessionDuration: 20 },
      { feature: 'Digital Tickets', dailyUsers: 210, avgUsage: 5, crashRate: 0.1, totalSessions: 2500, avgSessionDuration: 3 },
    ];
    res.json({ success: true, data: usage });
  } catch (err) { next(err); }
});

module.exports = router;
