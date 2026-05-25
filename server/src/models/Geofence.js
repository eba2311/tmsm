const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['CIRCLE', 'POLYGON', 'RECTANGLE'],
    required: true,
  },
  coordinates: {
    type: [[Number]],
    required: true,
  },
  radius: {
    type: Number,
    required: function() {
      return this.type === 'CIRCLE';
    },
  },
  alertOnEntry: {
    type: Boolean,
    default: true,
  },
  alertOnExit: {
    type: Boolean,
    default: true,
  },
  assignedVehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
  }],
  assignedRoutes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

geofenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Geofence', geofenceSchema);
