const mongoose = require('mongoose');

const routeOptimizationSchema = new mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
  },
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
  },
  originalStops: [{
    location: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
    name: String,
    address: String,
    estimatedArrival: Date,
    estimatedDeparture: Date,
    passengerCount: Number,
  }],
  optimizedStops: [{
    location: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
    name: String,
    address: String,
    estimatedArrival: Date,
    estimatedDeparture: Date,
    passengerCount: Number,
    sequence: Number,
  }],
  optimizationMetrics: {
    originalDistance: Number, // in km
    optimizedDistance: Number, // in km
    originalDuration: Number, // in minutes
    optimizedDuration: Number, // in minutes
    distanceSaved: Number, // in km
    timeSaved: Number, // in minutes
    fuelSaved: Number, // in liters
    costSaved: Number, // in ETB
    efficiencyImprovement: Number, // percentage
  },
  constraints: {
    maxStops: Number,
    timeWindow: {
      start: Date,
      end: Date,
    },
    maxDuration: Number, // in minutes
    maxDistance: Number, // in km
    avoidTolls: Boolean,
    avoidHighways: Boolean,
    preferredRoutes: [String],
  },
  optimizationMethod: {
    type: String,
    enum: ['NEAREST_NEIGHBOR', 'GENETIC_ALGORITHM', 'SIMULATED_ANNEALING', 'GREEDY', 'CUSTOM'],
    default: 'NEAREST_NEIGHBOR',
  },
  status: {
    type: String,
    enum: ['PENDING', 'OPTIMIZING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  },
  optimizationDate: Date,
  optimizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: String,
}, {
  timestamps: true,
});

// Indexes for efficient querying
routeOptimizationSchema.index({ route: 1, optimizationDate: -1 });
routeOptimizationSchema.index({ vehicle: 1, optimizationDate: -1 });
routeOptimizationSchema.index({ status: 1 });
routeOptimizationSchema.index({ optimizationDate: -1 });

// Virtual for checking if optimization is recent
routeOptimizationSchema.virtual('isRecent').get(function() {
  if (!this.optimizationDate) return false;
  const hoursSinceOptimization = (Date.now() - this.optimizationDate) / (1000 * 60 * 60);
  return hoursSinceOptimization < 24;
});

module.exports = mongoose.model('RouteOptimization', routeOptimizationSchema);
