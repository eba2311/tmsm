const Vehicle = require('../models/Vehicle');

function initTrackingNamespace(io) {
  const ns = io.of('/tracking');

  ns.on('connection', (socket) => {
    console.log('[tracking] client connected:', socket.id);

    socket.on('subscribe:route', async ({ routeId }) => {
      socket.join(`route:${routeId}`);
      const vehicles = await Vehicle.find({ assignedRoute: routeId, status: 'ACTIVE' }).select('plateNumber type currentLocation status');
      socket.emit('vehicles:init', vehicles);
    });

    socket.on('subscribe:vehicle', ({ vehicleId }) => {
      socket.join(`vehicle:${vehicleId}`);
    });

    // Driver pushes GPS update
    socket.on('driver:location', async ({ vehicleId, lat, lng }) => {
      await Vehicle.findByIdAndUpdate(vehicleId, {
        currentLocation: { type: 'Point', coordinates: [lng, lat] },
      });
      const update = { vehicleId, lat, lng, updatedAt: new Date() };
      ns.to(`vehicle:${vehicleId}`).emit('vehicle:location', update);
      // Also broadcast to any route subscribers
      socket.broadcast.emit('vehicle:location', update);
    });

    socket.on('disconnect', () => {
      console.log('[tracking] client disconnected:', socket.id);
    });
  });

  return ns;
}

module.exports = { initTrackingNamespace };
