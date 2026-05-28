const User = require('./User');
const Driver = require('./Driver');
const Vehicle = require('./Vehicle');
const Route = require('./Route');
const Schedule = require('./Schedule');
const Booking = require('./Booking');
const Payment = require('./Payment');
const FuelRecord = require('./FuelRecord');
const MaintenanceLog = require('./MaintenanceLog');
const DriverDocument = require('./DriverDocument');
const DriverRating = require('./DriverRating');
const DriverPayroll = require('./DriverPayroll');
const Geofence = require('./Geofence');
const PaymentTracking = require('./PaymentTracking');
const ReportSchedule = require('./ReportSchedule');
const RouteOptimization = require('./RouteOptimization');
const VehicleLocationHistory = require('./VehicleLocationHistory');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const Inventory = require('./Inventory');

// User associations
User.hasOne(Driver, { foreignKey: 'userId', as: 'driver' });
Driver.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Driver associations
Driver.hasMany(DriverDocument, { foreignKey: 'driverId', as: 'documents' });
DriverDocument.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

Driver.hasMany(DriverRating, { foreignKey: 'driverId', as: 'ratings' });
DriverRating.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

Driver.hasMany(DriverPayroll, { foreignKey: 'driverId', as: 'payrolls' });
DriverPayroll.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

Driver.belongsTo(Vehicle, { foreignKey: 'assignedVehicleId', as: 'assignedVehicle' });
Vehicle.hasOne(Driver, { foreignKey: 'assignedVehicleId', as: 'assignedDriver' });

Driver.belongsTo(Route, { foreignKey: 'assignedRouteId', as: 'assignedRoute' });
Route.hasMany(Driver, { foreignKey: 'assignedRouteId', as: 'assignedDrivers' });

// Vehicle associations
Vehicle.hasMany(FuelRecord, { foreignKey: 'vehicleId', as: 'fuelRecords' });
FuelRecord.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

Vehicle.hasMany(MaintenanceLog, { foreignKey: 'vehicleId', as: 'maintenanceLogs' });
MaintenanceLog.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

Vehicle.hasMany(VehicleLocationHistory, { foreignKey: 'vehicleId', as: 'locationHistory' });
VehicleLocationHistory.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

Vehicle.belongsTo(Route, { foreignKey: 'assignedRouteId', as: 'assignedRoute' });
Route.hasMany(Vehicle, { foreignKey: 'assignedRouteId', as: 'assignedVehicles' });

Vehicle.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });
User.hasMany(Vehicle, { foreignKey: 'operatorId', as: 'vehicles' });

// Route associations
Route.hasMany(Schedule, { foreignKey: 'routeId', as: 'schedules' });
Schedule.belongsTo(Route, { foreignKey: 'routeId', as: 'route' });

Route.hasMany(RouteOptimization, { foreignKey: 'routeId', as: 'optimizations' });
RouteOptimization.belongsTo(Route, { foreignKey: 'routeId', as: 'route' });

// Schedule associations
Schedule.hasMany(Booking, { foreignKey: 'scheduleId', as: 'bookings' });
Booking.belongsTo(Schedule, { foreignKey: 'scheduleId', as: 'schedule' });

Schedule.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(Schedule, { foreignKey: 'vehicleId', as: 'schedules' });

Schedule.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
Driver.hasMany(Schedule, { foreignKey: 'driverId', as: 'schedules' });

Schedule.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });
User.hasMany(Schedule, { foreignKey: 'operatorId', as: 'schedules' });

// Booking associations
Booking.belongsTo(User, { foreignKey: 'passengerId', as: 'passenger' });
User.hasMany(Booking, { foreignKey: 'passengerId', as: 'bookings' });

Booking.belongsTo(User, { foreignKey: 'agentId', as: 'agent' });
User.hasMany(Booking, { foreignKey: 'agentId', as: 'agentBookings' });

Booking.hasMany(Payment, { foreignKey: 'bookingId', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

Booking.hasMany(DriverRating, { foreignKey: 'bookingId', as: 'ratings' });
DriverRating.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

// Payment associations
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });

// FuelRecord associations
FuelRecord.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
Driver.hasMany(FuelRecord, { foreignKey: 'driverId', as: 'fuelRecords' });

FuelRecord.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });
User.hasMany(FuelRecord, { foreignKey: 'operatorId', as: 'fuelRecords' });

// MaintenanceLog associations
MaintenanceLog.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
User.hasMany(MaintenanceLog, { foreignKey: 'createdById', as: 'createdMaintenanceLogs' });

MaintenanceLog.belongsTo(User, { foreignKey: 'completedById', as: 'completedBy' });
User.hasMany(MaintenanceLog, { foreignKey: 'completedById', as: 'completedMaintenanceLogs' });

MaintenanceLog.belongsTo(Driver, { foreignKey: 'assignedToId', as: 'assignedTo' });
Driver.hasMany(MaintenanceLog, { foreignKey: 'assignedToId', as: 'assignedMaintenanceLogs' });

// DriverDocument associations
DriverDocument.belongsTo(User, { foreignKey: 'verifiedById', as: 'verifiedBy' });
User.hasMany(DriverDocument, { foreignKey: 'verifiedById', as: 'verifiedDocuments' });

// DriverRating associations
DriverRating.belongsTo(User, { foreignKey: 'passengerId', as: 'passenger' });
User.hasMany(DriverRating, { foreignKey: 'passengerId', as: 'givenRatings' });

DriverRating.belongsTo(User, { foreignKey: 'respondedById', as: 'respondedBy' });
User.hasMany(DriverRating, { foreignKey: 'respondedById', as: 'respondedRatings' });

// DriverPayroll associations
DriverPayroll.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
User.hasMany(DriverPayroll, { foreignKey: 'approvedById', as: 'approvedPayrolls' });

DriverPayroll.belongsTo(User, { foreignKey: 'processedById', as: 'processedBy' });
User.hasMany(DriverPayroll, { foreignKey: 'processedById', as: 'processedPayrolls' });

// Geofence associations
Geofence.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
User.hasMany(Geofence, { foreignKey: 'createdById', as: 'createdGeofences' });

// PaymentTracking associations
PaymentTracking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(PaymentTracking, { foreignKey: 'userId', as: 'paymentTrackings' });

PaymentTracking.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
User.hasMany(PaymentTracking, { foreignKey: 'createdById', as: 'createdPaymentTrackings' });

PaymentTracking.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });
User.hasMany(PaymentTracking, { foreignKey: 'updatedById', as: 'updatedPaymentTrackings' });

// ReportSchedule associations
ReportSchedule.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
User.hasMany(ReportSchedule, { foreignKey: 'createdById', as: 'createdReportSchedules' });

// RouteOptimization associations
RouteOptimization.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(RouteOptimization, { foreignKey: 'vehicleId', as: 'routeOptimizations' });

RouteOptimization.belongsTo(User, { foreignKey: 'optimizedById', as: 'optimizer' });
User.hasMany(RouteOptimization, { foreignKey: 'optimizedById', as: 'optimizedRoutes' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications' });

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });

// Inventory associations
Inventory.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(Inventory, { foreignKey: 'vehicleId', as: 'inventoryItems' });

Inventory.belongsTo(Route, { foreignKey: 'routeId', as: 'route' });
Route.hasMany(Inventory, { foreignKey: 'routeId', as: 'inventoryItems' });

module.exports = {
  User,
  Driver,
  Vehicle,
  Route,
  Schedule,
  Booking,
  Payment,
  FuelRecord,
  MaintenanceLog,
  DriverDocument,
  DriverRating,
  DriverPayroll,
  Geofence,
  PaymentTracking,
  ReportSchedule,
  RouteOptimization,
  VehicleLocationHistory,
  Notification,
  AuditLog,
  Inventory,
};
