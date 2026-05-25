const mongoose = require('mongoose');

const vehicleLocationHistorySchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  speed: {
    type: Number,
    default: 0,
  },
  heading: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  altitude: {
    type: Number,
    default: 0,
  },
  accuracy: {
    type: Number,
    default: 0,
  },
  batteryLevel: {
    type: Number,
    default: 100,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'IDLE', 'OFFLINE', 'MAINTENANCE'],
    default: 'ACTIVE',
  },
});

vehicleLocationHistorySchema.index({ vehicle: 1, timestamp: -1 });
vehicleLocationHistorySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('VehicleLocationHistory', vehicleLocationHistorySchema);
