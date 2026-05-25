// Add WebSocket event for real-time reports
const reportsNs = req.app.locals.reportsNs || req.app.locals.io.of('/reports');

// Replace simulated data with real data from the database
const Report = require('../models/Report'); // Assuming a Report model exists

reportsNs.on('connection', (socket) => {
  console.log('Client connected to reports namespace');

  const interval = setInterval(async () => {
    try {
      const metrics = await Report.getLatestMetrics(); // Fetch real-time metrics from the database
      const data = {
        timestamp: new Date(),
        metrics,
      };
      socket.emit('report:update', data);
    } catch (error) {
      console.error('Error fetching report metrics:', error);
    }
  }, 5000);

  socket.on('disconnect', () => {
    console.log('Client disconnected from reports namespace');
    clearInterval(interval);
  });
});