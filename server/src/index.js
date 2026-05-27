require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Server } = require('socket.io');
const { testConnection, syncDatabase } = require('./config/database');
const logger = require('./config/logger');

// Route imports
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const driverDocumentRoutes = require('./routes/driverDocuments');
const driverRatingRoutes = require('./routes/driverRatings');
const driverPayrollRoutes = require('./routes/driverPayroll');
const routeRoutes = require('./routes/routes');
const routeOptimizationRoutes = require('./routes/routeOptimization');
const bookingRoutes = require('./routes/bookings');
const passengerRoutes = require('./routes/passengers');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');
const scheduleRoutes = require('./routes/schedules');
const notificationRoutes = require('./routes/notifications');
const fuelRecordRoutes = require('./routes/fuelRecords');
const reportScheduleRoutes = require('./routes/reportSchedules');
const maintenanceScheduleRoutes = require('./routes/maintenanceSchedules');
const auditLogRoutes = require('./routes/auditLogs');
const debugRoutes = require('./routes/_debug');
const geofencingRoutes = require('./routes/geofencing');
const historicalPlaybackRoutes = require('./routes/historicalPlayback');
const inventoryRoutes = require('./routes/inventory');
const predictiveMaintenanceRoutes = require('./routes/predictiveMaintenance');
const aiPlanningRoutes = require('./routes/aiPlanning');
const systemHealthRoutes = require('./routes/systemHealth');
const paymentIntegrationRoutes = require('./routes/paymentIntegration');
const paymentTrackingRoutes = require('./routes/paymentTracking');
const driverPortalRoutes = require('./routes/driverPortal');
const mobileRoutes = require('./routes/mobile');

// Socket handlers
const { initTrackingNamespace } = require('./sockets/tracking');
const { initNotificationNamespace } = require('./sockets/notifications');

const app = express();
const server = http.createServer(app);

// Trust the Render proxy (fixes 'Too many requests' from load balancer IP)
app.set('trust proxy', 1);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Rate limiting (increased default to 10000 to prevent blocking)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/driver-documents', driverDocumentRoutes);
app.use('/api/v1/driver-ratings', driverRatingRoutes);
app.use('/api/v1/driver-payroll', driverPayrollRoutes);
app.use('/api/v1/routes', routeRoutes);
app.use('/api/v1/route-optimization', routeOptimizationRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/passengers', passengerRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/fuel-records', fuelRecordRoutes);
app.use('/api/v1/report-schedules', reportScheduleRoutes);
app.use('/api/v1/maintenance-schedules', maintenanceScheduleRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/_debug', debugRoutes);
app.use('/api/v1/geofencing', geofencingRoutes);
app.use('/api/v1/historical-playback', historicalPlaybackRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/predictive-maintenance', predictiveMaintenanceRoutes);
app.use('/api/v1/ai-planning', aiPlanningRoutes);
app.use('/api/v1/system-health', systemHealthRoutes);
app.use('/api/v1/payment-integration', paymentIntegrationRoutes);
app.use('/api/v1/payment-tracking', paymentTrackingRoutes);
app.use('/api/v1/driver', driverPortalRoutes);
app.use('/api/v1/mobile', mobileRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Dabub Connect API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Removed API landing page to ensure React frontend is served on the root route.

// Swagger UI
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve static files (Always fallback to React frontend)
app.use(express.static(path.join(__dirname, '../../client/dist')));

app.get('*', (req, res, next) => {
  // If it's an API route that wasn't found, pass to the 404 handler
  if (req.path.startsWith('/api/')) {
    return next();
  }
  // Otherwise, serve the React app
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API Route not found' });
});

// Error handler
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// Initialize Socket.IO namespaces
const trackingNs = initTrackingNamespace(io);
const notificationsNs = initNotificationNamespace(io);
app.locals.trackingNs = trackingNs;
app.locals.notificationsNs = notificationsNs;

// Start server
const PORT = process.env.PORT || 4000;

// Connect to PostgreSQL and start server
testConnection()
  .then(async () => {
    // Sync database (create tables if they don't exist)
    await syncDatabase();
    
    server.listen(PORT, () => {
      logger.info(`🚀 Dabub Connect API running on http://localhost:${PORT}`);
      logger.info(`📡 Socket.IO ready`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please use a different port.`);
        process.exit(1);
      }
      logger.error(`Server error: ${err.message}`);
      process.exit(1);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to PostgreSQL: ' + err.message);
    process.exit(1);
  });

module.exports = { app, server, io };