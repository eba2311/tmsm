const express = require('express');
const router = express.Router();

const Notification = require('../models/Notification');
const Vehicle = require('../models/Vehicle');

function extractRoutes(app) {
  const out = [];
  const stack = app._router?.stack || [];
  stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods || {}).map((m) => m.toUpperCase());
      out.push({ path: layer.route.path, methods });
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      const prefix = layer.regexp && layer.regexp.source ? layer.regexp.source : '';
      layer.handle.stack.forEach((l) => {
        if (l.route && l.route.path) {
          const methods = Object.keys(l.route.methods || {}).map((m) => m.toUpperCase());
          out.push({ path: (layer.regexp?.toString() || '') + l.route.path, methods });
        }
      });
    }
  });
  return out;
}

router.get('/', (req, res, next) => {
  try {
    const routes = extractRoutes(req.app);
    res.json({ success: true, data: routes });
  } catch (e) { next(e); }
});

// Emit a test notification to a user (for debugging)
router.post('/emit-notification', async (req, res, next) => {
  try {
    const { userId, title = 'Test', message = 'This is a test notification', type = 'SYSTEM' } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    const n = await Notification.create({ recipient: userId, title, message, type, data: req.body });
    const ns = req.app.locals.notificationsNs;
    if (ns && ns.sendToUser) ns.sendToUser(String(userId), n);
    return res.json({ success: true, data: n });
  } catch (e) { next(e); }
});

// Emit a vehicle location update via /tracking namespace
router.post('/emit-location', async (req, res, next) => {
  try {
    const { vehicleId, lat, lng } = req.body;
    if (!vehicleId || lat == null || lng == null) return res.status(400).json({ success: false, message: 'vehicleId, lat, lng required' });
    // update vehicle DB location
    await Vehicle.findByIdAndUpdate(vehicleId, { currentLocation: { type: 'Point', coordinates: [lng, lat] } });
    const ns = req.app.locals.trackingNs;
    const update = { vehicleId: String(vehicleId), lat, lng, updatedAt: new Date() };
    if (ns) {
      ns.to(`vehicle:${vehicleId}`).emit('vehicle:location', update);
      ns.emit('vehicle:location', update);
    }
    return res.json({ success: true, data: update });
  } catch (e) { next(e); }
});

module.exports = router;
