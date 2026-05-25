const express = require('express');
const router = express.Router();
const FuelRecord = require('../models/FuelRecord');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { authenticate, authorize } = require('../middlewares/auth');

// Get all fuel records
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      vehicle,
      driver,
      startDate,
      endDate,
      fuelType,
    } = req.query;

    const query = {};
    
    if (vehicle) query.vehicle = vehicle;
    if (driver) query.driver = driver;
    if (fuelType) query.fuelType = fuelType;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await FuelRecord.find(query)
      .populate('vehicle', 'plateNumber type make model')
      .populate('driver', 'name')
      .populate('operator', 'name email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await FuelRecord.countDocuments(query);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) { next(error); }
});

// Get fuel record by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const record = await FuelRecord.findById(req.params.id)
      .populate('vehicle', 'plateNumber type make model')
      .populate('driver', 'name')
      .populate('operator', 'name email')
      .lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Fuel record not found',
      });
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) { next(error); }
});

// Create new fuel record
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      vehicle,
      driver,
      date,
      fuelType,
      quantity,
      unit,
      costPerUnit,
      odometerReading,
      previousOdometer,
      station,
      location,
      paymentMethod,
      receiptNumber,
      notes,
    } = req.body;

    // Validate vehicle exists
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Validate driver if provided
    if (driver) {
      const driverDoc = await Driver.findById(driver);
      if (!driverDoc) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found',
        });
      }
    }

    const record = await FuelRecord.create({
      vehicle,
      driver,
      date: date || new Date(),
      fuelType,
      quantity,
      unit: unit || 'LITERS',
      costPerUnit,
      odometerReading,
      previousOdometer,
      station,
      location,
      paymentMethod: paymentMethod || 'CASH',
      receiptNumber,
      notes,
      operator: req.user._id,
    });

    const populatedRecord = await FuelRecord.findById(record._id)
      .populate('vehicle', 'plateNumber type make model')
      .populate('driver', 'name')
      .populate('operator', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedRecord,
    });
  } catch (error) { next(error); }
});

// Update fuel record
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const record = await FuelRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Fuel record not found',
      });
    }

    const updatedRecord = await FuelRecord.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('vehicle', 'plateNumber type make model')
      .populate('driver', 'name')
      .populate('operator', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedRecord,
    });
  } catch (error) { next(error); }
});

// Delete fuel record
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const record = await FuelRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Fuel record not found',
      });
    }

    await FuelRecord.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Fuel record deleted successfully',
    });
  } catch (error) { next(error); }
});

// Get fuel statistics
router.get('/stats/summary', authenticate, async (req, res, next) => {
  try {
    const { vehicle, startDate, endDate } = req.query;

    const matchQuery = {};
    if (vehicle) matchQuery.vehicle = vehicle;
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const stats = await FuelRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$totalCost' },
          totalDistance: { $sum: '$distanceTraveled' },
          avgEfficiency: { $avg: '$fuelEfficiency' },
          recordCount: { $sum: 1 },
        },
      },
    ]);

    const byFuelType = await FuelRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$fuelType',
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$totalCost' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalCost: -1 } },
    ]);

    const byVehicle = await FuelRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$vehicle',
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$totalCost' },
          avgEfficiency: { $avg: '$fuelEfficiency' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: '$vehicle' },
      {
        $project: {
          vehicle: {
            plateNumber: '$vehicle.plateNumber',
            type: '$vehicle.type',
          },
          totalQuantity: 1,
          totalCost: 1,
          avgEfficiency: 1,
          count: 1,
        },
      },
      { $sort: { totalCost: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalQuantity: 0,
          totalCost: 0,
          totalDistance: 0,
          avgEfficiency: 0,
          recordCount: 0,
        },
        byFuelType,
        byVehicle,
      },
    });
  } catch (error) { next(error); }
});

module.exports = router;
