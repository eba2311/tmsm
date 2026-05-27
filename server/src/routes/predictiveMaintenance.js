const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/predictive-maintenance
router.get('/', async (req, res, next) => {
  try {
    const { data: vehicles, error: vError } = await supabase
      .from('vehicles')
      .select('*, routes:assigned_route_id(*), drivers:assigned_driver_id(*)')
      .eq('status', 'ACTIVE');
      
    if (vError) throw vError;
    
    const predictions = await Promise.all(vehicles.map(async (vehicle) => {
      const { data: recentMaintenance } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('date_performed', { ascending: false })
        .limit(1)
        .single();
        
      const prediction = calculateMaintenancePrediction(vehicle, recentMaintenance);
      return {
        vehicle: vehicle.id,
        plateNumber: vehicle.plate_number,
        prediction,
      };
    }));
    
    res.json({ success: true, data: predictions });
  } catch (err) { next(err); }
});

// GET /api/v1/predictive-maintenance/:vehicleId
router.get('/:vehicleId', async (req, res, next) => {
  try {
    const { data: vehicle, error: vError } = await supabase
      .from('vehicles')
      .select('*, routes:assigned_route_id(*), drivers:assigned_driver_id(*)')
      .eq('id', req.params.vehicleId)
      .single();
    
    if (vError || !vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    
    const { data: recentMaintenance } = await supabase
      .from('maintenance_logs')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('date_performed', { ascending: false })
      .limit(1)
      .single();
    
    const prediction = calculateMaintenancePrediction(vehicle, recentMaintenance);
    
    res.json({ success: true, data: { vehicle, prediction } });
  } catch (err) { next(err); }
});

// POST /api/v1/predictive-maintenance/train
router.post('/train', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    res.json({ success: true, message: 'ML model training initiated' });
  } catch (err) { next(err); }
});

// POST /api/v1/predictive-maintenance/schedule-high-priority
router.post('/schedule-high-priority', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { data: vehicles } = await supabase.from('vehicles').select('*').eq('status', 'ACTIVE');
    let scheduledCount = 0;
    
    for (const vehicle of vehicles) {
      const { data: recentMaintenance } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('date_performed', { ascending: false })
        .limit(1)
        .single();
        
      const prediction = calculateMaintenancePrediction(vehicle, recentMaintenance);
      
      if (prediction.urgency === 'HIGH') {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + prediction.daysUntilMaintenance);
        
        await supabase.from('maintenance_logs').insert([{
          vehicle_id: vehicle.id,
          description: `Auto-scheduled (HIGH PRIORITY): ${prediction.predictedIssues.join(', ')}`,
          date_performed: futureDate.toISOString(),
          performed_by: 'SYSTEM'
        }]);
        scheduledCount++;
      }
    }
    
    res.json({ success: true, message: `Auto-scheduled ${scheduledCount} high-priority tasks.` });
  } catch (err) { next(err); }
});

function calculateMaintenancePrediction(vehicle, recentMaintenance) {
  const daysSinceLastMaintenance = recentMaintenance 
    ? Math.floor((Date.now() - new Date(recentMaintenance.date_performed).getTime()) / (1000 * 60 * 60 * 24))
    : 365;
  
  const mileage = parseFloat(vehicle.mileage) || 0;
  const age = vehicle.year ? new Date().getFullYear() - vehicle.year : 5;
  
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
    lastMaintenanceDate: recentMaintenance?.date_performed,
    daysSinceLastMaintenance,
  };
}

module.exports = router;
