const express = require('express');
const supabase = require('../config/supabase');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/historical-playback/:vehicleId
router.get('/:vehicleId', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let query = supabase
      .from('vehicle_location_history')
      .select('*')
      .eq('vehicle_id', req.params.vehicleId)
      .order('timestamp', { ascending: true })
      .limit(500);

    if (startDate) query = query.gte('timestamp', startDate);
    if (endDate) query = query.lte('timestamp', endDate);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) { next(err); }
});

// GET /api/v1/historical-playback
router.get('/', async (req, res, next) => {
  res.json({ success: true, data: [] });
});

module.exports = router;
