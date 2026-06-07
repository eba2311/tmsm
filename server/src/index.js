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

// Initialize model associations
require('./models');

// ── Safe route loader ─────────────────────────────────────────────────────────
function safeRequire(modulePath) {
  try {
    return require(modulePath);
  } catch (e) {
    console.error(`❌ Failed to load route: ${modulePath}\n   Error: ${e.message}`);
    // Return a dummy router so the server doesn't crash
    const { Router } = require('express');
    const r = Router();
    r.all('*', (req, res) => res.status(500).json({ success: false, message: `Route module failed to load: ${modulePath}` }));
    return r;
  }
}

// Route imports
const authRoutes = safeRequire('./routes/auth');
const vehicleRoutes = safeRequire('./routes/vehicles');
const driverRoutes = safeRequire('./routes/drivers');
const driverDocumentRoutes = safeRequire('./routes/driverDocuments');
const driverRatingRoutes = safeRequire('./routes/driverRatings');
const driverPayrollRoutes = safeRequire('./routes/driverPayroll');
const routeRoutes = safeRequire('./routes/routes');
const routeOptimizationRoutes = safeRequire('./routes/routeOptimization');
const bookingRoutes = safeRequire('./routes/bookings');
const passengerRoutes = safeRequire('./routes/passengers');
const paymentRoutes = safeRequire('./routes/payments');
const reportRoutes = safeRequire('./routes/reports');
const scheduleRoutes = safeRequire('./routes/schedules');
const notificationRoutes = safeRequire('./routes/notifications');
const fuelRecordRoutes = safeRequire('./routes/fuelRecords');
const reportScheduleRoutes = safeRequire('./routes/reportSchedules');
const maintenanceScheduleRoutes = safeRequire('./routes/maintenanceSchedules');
const auditLogRoutes = safeRequire('./routes/auditLogs');
const auditMiddleware = require('./middlewares/audit');
const debugRoutes = safeRequire('./routes/_debug');
const geofencingRoutes = safeRequire('./routes/geofencing');
const historicalPlaybackRoutes = safeRequire('./routes/historicalPlayback');
const inventoryRoutes = safeRequire('./routes/inventory');
const predictiveMaintenanceRoutes = safeRequire('./routes/predictiveMaintenance');
const aiPlanningRoutes = safeRequire('./routes/aiPlanning');
const systemHealthRoutes = safeRequire('./routes/systemHealth');
const paymentIntegrationRoutes = safeRequire('./routes/paymentIntegration');
const paymentTrackingRoutes = safeRequire('./routes/paymentTracking');
const driverPortalRoutes = safeRequire('./routes/driverPortal');
const mobileRoutes = safeRequire('./routes/mobile');
const capacityRoutes = safeRequire('./routes/capacity');
const analyticsRoutes = safeRequire('./routes/analytics');
const fuelRoutes = safeRequire('./routes/fuel');
const maintenanceRoutes = safeRequire('./routes/maintenance');

// Socket handlers
const { initTrackingNamespace } = require('./sockets/tracking');
const { initNotificationNamespace } = require('./sockets/notifications');

const app = express();
const server = http.createServer(app);

// Trust proxy (for Render / load-balancer deploys)
app.set('trust proxy', 1);

// Socket.IO - build allowed origins dynamically
const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:5177', 'http://localhost:3000');
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(compression());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Audit all authenticated API requests
app.use('/api/v1', auditMiddleware());

// ── API routes ────────────────────────────────────────────────────────────────
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
app.use('/api/v1/capacity', capacityRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/fuel', fuelRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Dabub Connect API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Swagger UI
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve static assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../../client/dist')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const indexPath = path.join(__dirname, '../../client/dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next(); // In dev, dist may not exist — that is fine
  });
});

// 404 for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Error handler
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// Initialize Socket.IO namespaces
const trackingNs = initTrackingNamespace(io);
const notificationsNs = initNotificationNamespace(io);
app.locals.trackingNs = trackingNs;
app.locals.notificationsNs = notificationsNs;

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 4000;
const { execSync } = require('child_process');

// Frees a port on Windows by finding and killing the process using it
function freePort(port) {
  try {
    console.log(`⚡ Freeing port ${port}...`);
    // Find PID using the port
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = result.trim().split('\n');
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf8' });
        console.log(`✅ Killed process PID ${pid} that was using port ${port}`);
      } catch (_) {}
    }
  } catch (_) {
    // No process found on the port, that's fine
  }
}

const bootstrap = async () => {
  try {
    console.log('🚀 Starting TMSM server...');

    // 1. Free the port before trying to use it (handles stale nodemon processes)
    freePort(PORT);
    await new Promise(r => setTimeout(r, 800));

    // 2. Test DB connectivity (non-blocking)
    console.log('📊 Attempting database connection...');
    try {
      await testConnection();
      console.log('✅ Database connected');
    } catch (err) {
      console.warn('⚠️  Database connection failed:', err.message);
      console.warn('⚠️  Continuing without database...');
    }

    // 3. Sync models (non-blocking)
    console.log('🔄 Syncing database models...');
    try {
      await syncDatabase();
      console.log('✅ Database synced');
    } catch (err) {
      console.warn('⚠️  Database sync failed:', err.message);
      console.warn('⚠️  Continuing anyway...');
    }

    // 4. Admin seeding (non-blocking, dev only)
    if (process.env.NODE_ENV === 'development' || process.env.SEED_ADMIN === 'true') {
      try {
        console.log('👤 Seeding admin account...');
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
        const hashed = await bcrypt.hash(adminPassword, 12);
        const admin = await User.findOne({ where: { email: 'admin@semenconnect.com' } }).catch(() => null);
        if (!admin) {
          await User.create({
            name: 'Admin User',
            email: 'admin@semenconnect.com',
            password: hashed,
            role: 'SUPER_ADMIN',
            locale: 'en',
            isActive: true,
          }, { hooks: false }).catch(() => {});
          console.log('✅ Admin user created (admin@semenconnect.com / Admin@1234)');
        } else {
          console.log('✅ Admin user already exists');
        }
      } catch (err) {
        console.warn('⚠️  Admin seeding skipped:', err.message);
      }
    }

    // 5. Start HTTP server
    console.log(`⚡ Starting HTTP server on port ${PORT}...`);
    server.listen(PORT, () => {
      console.log(`\n✅ TMSM API running → http://localhost:${PORT}`);
      console.log(`📡 Socket.IO ready\n`);
      logger.info(`🚀 TMSM API running → http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        logger.error(`Port ${PORT} is already in use`);
      } else {
        console.error(`❌ Server error:`, err.message);
        logger.error(`Server error: ${err.message}`);
      }
    });

  } catch (err) {
    console.error('❌ Bootstrap error:', err.message);
    console.error(err.stack);
    logger.error('Bootstrap error: ' + err.message);
    
    // Try to start server anyway
    console.log('⚠️  Attempting to start server despite errors...');
    server.listen(PORT, () => {
      console.log(`\n⚠️  TMSM API started with errors → http://localhost:${PORT}`);
    }).on('error', () => {
      console.error('❌ Could not start server on port', PORT);
      process.exit(1);
    });
  }
};

bootstrap();

module.exports = { app, server, io };