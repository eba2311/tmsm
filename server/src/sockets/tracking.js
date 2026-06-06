const jwt = require('jsonwebtoken');
const Vehicle = require('../models/Vehicle');

const locationBatch = new Map();

// Process batch every 5 seconds to reduce DB load
setInterval(async () => {
  if (locationBatch.size === 0) return;
  const updates = Array.from(locationBatch.entries());
  locationBatch.clear();

  try {
    for (const [vehicleId, loc] of updates) {
      const locationJson = { type: 'Point', coordinates: [loc.lng, loc.lat] };
      await Vehicle.update({ currentLocation: locationJson }, { where: { id: vehicleId } });
    }
  } catch (err) {
    console.error('[tracking] Batch update error:', err);
  }
}, 5000);

function initTrackingNamespace(io) {
  const ns = io.of('/tracking');

  // Socket authentication middleware
  ns.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.user = decoded;
      next();
    });
  });

  ns.on('connection', (socket) => {
    console.log('[tracking] client connected:', socket.id);

    socket.on('subscribe:route', async ({ routeId }) => {
      socket.join(`route:${routeId}`);
      const vehicles = await Vehicle.findAll({
        where: { assignedRouteId: routeId, status: 'ACTIVE' },
        attributes: ['id', 'plateNumber', 'type', 'currentLocation', 'status']
      });
      socket.emit('vehicles:init', vehicles || []);
    });

    socket.on('subscribe:vehicle', ({ vehicleId }) => {
      socket.join(`vehicle:${vehicleId}`);
    });

    // Driver pushes GPS update
    socket.on('driver:location', ({ vehicleId, lat, lng }) => {
      // Add to batch for async database write
      locationBatch.set(vehicleId, { lat, lng });
      
      // Emit to clients immediately for real-time feel
      const update = { vehicleId, lat, lng, updatedAt: new Date() };
      ns.to(`vehicle:${vehicleId}`).emit('vehicle:location', update);
      socket.broadcast.emit('vehicle:location', update);
    });

    socket.on('disconnect', () => {
      console.log('[tracking] client disconnected:', socket.id);
    });
  });

  return ns;
}

module.exports = { initTrackingNamespace };
