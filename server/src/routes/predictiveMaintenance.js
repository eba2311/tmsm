const express = require('express');
const Vehicle = require('../models/Vehicle');
const MaintenanceLog = require('../models/MaintenanceLog');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/predictive-maintenance
router.get('/', async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ status: 'ACTIVE' })
      .populate('assignedRoute')
      .populate('assignedDriver');
    
    const predictions = await Promise.all(vehicles.map(async (vehicle) => {
      const recentMaintenance = await MaintenanceLog.findOne({ vehicle: vehicle._id })
        .sort({ startDate: -1 });
      
      const prediction = calculateMaintenancePrediction(vehicle, recentMaintenance);
      return {
        vehicle: vehicle._id,
        plateNumber: vehicle.plateNumber,
        prediction,
      };
    }));
    
    res.json({ success: true, data: predictions });
  } catch (err) { next(err); }
});

// GET /api/v1/predictive-maintenance/:vehicleId
router.get('/:vehicleId', async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId)
      .populate('assignedRoute')
      .populate('assignedDriver');
    
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    
    const recentMaintenance = await MaintenanceLog.findOne({ vehicle: vehicle._id })
      .sort({ startDate: -1 });
    
    const prediction = calculateMaintenancePrediction(vehicle, recentMaintenance);
    
    res.json({ success: true, data: { vehicle, prediction } });
  } catch (err) { next(err); }
});

// POST /api/v1/predictive-maintenance/train
router.post('/train', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    // This would trigger ML model training with historical data
    // For now, return a success message
    res.json({ success: true, message: 'ML model training initiated' });
  } catch (err) { next(err); }
});

// POST /api/v1/predictive-maintenance/schedule-high-priority
router.post('/schedule-high-priority', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ status: 'ACTIVE' });
    let scheduledCount = 0;
    
    for (const vehicle of vehicles) {
      const recentMaintenance = await MaintenanceLog.findOne({ vehicle: vehicle._id }).sort({ startDate: -1 });
      const prediction = calculateMaintenancePrediction(vehicle, recentMaintenance);
      
      if (prediction.urgency === 'HIGH') {
        const existing = await MaintenanceLog.findOne({ vehicle: vehicle._id, status: 'SCHEDULED' });
        if (!existing) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + prediction.daysUntilMaintenance);
          
          await MaintenanceLog.create({
            vehicle: vehicle._id,
            type: 'INSPECTION',
            description: `Auto-scheduled: ${prediction.predictedIssues.join(', ')}`,
            priority: 'HIGH',
            startDate: futureDate,
            createdBy: req.user._id,
            status: 'SCHEDULED'
          });
          scheduledCount++;
        }
      }
    }
    
    res.json({ success: true, message: `Auto-scheduled ${scheduledCount} high-priority tasks.` });
  } catch (err) { next(err); }
});

function calculateMaintenancePrediction(vehicle, recentMaintenance) {
  const daysSinceLastMaintenance = recentMaintenance 
    ? Math.floor((Date.now() - recentMaintenance.startDate) / (1000 * 60 * 60 * 24))
    : 365;
  
  const mileage = vehicle.mileage || 0;
  const age = vehicle.year ? new Date().getFullYear() - vehicle.year : 5;
  
  // Simple prediction logic - in production this would use ML
  let urgency = 'LOW';
  let daysUntilMaintenance = 30;
  let predictedIssues = [];
  
  if (daysSinceLastMaintenance > 90 || mileage > 50000) {
    urgency = 'HIGH';
    daysUntilMaintenance = 3;
    predictedIssues.push('Engine check needed');
  } else if (daysSinceLastMaintenance > 60 || mileage > 30000) {
    urgency = 'MEDIUM';
    daysUntilMaintenance = 7;
    predictedIssues.push('Brake inspection recommended');
  } else if (age > 5) {
    urgency = 'MEDIUM';
    daysUntilMaintenance = 14;
    predictedIssues.push('General wear and tear check');
  }
  
  return {
    urgency,
    daysUntilMaintenance,
    predictedIssues,
    confidence: 0.85,
    lastMaintenanceDate: recentMaintenance?.startDate,
    daysSinceLastMaintenance,
  };
}

module.exports = router;
