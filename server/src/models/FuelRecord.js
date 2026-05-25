const mongoose = require('mongoose');

const fuelRecordSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  fuelType: {
    type: String,
    required: true,
    enum: ['DIESEL', 'PETROL', 'CNG', 'LPG', 'ELECTRIC'],
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    required: true,
    enum: ['LITERS', 'GALLONS', 'KWH'],
    default: 'LITERS',
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: 0,
  },
  totalCost: {
    type: Number,
    min: 0,
  },
  odometerReading: {
    type: Number,
    required: true,
    min: 0,
  },
  previousOdometer: {
    type: Number,
    min: 0,
  },
  distanceTraveled: {
    type: Number,
    min: 0,
  },
  fuelEfficiency: {
    type: Number,
    min: 0,
  },
  station: {
    type: String,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    },
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'CREDIT', 'COMPANY_ACCOUNT'],
    default: 'CASH',
  },
  receiptNumber: {
    type: String,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
fuelRecordSchema.index({ vehicle: 1, date: -1 });
fuelRecordSchema.index({ driver: 1, date: -1 });
fuelRecordSchema.index({ date: -1 });
fuelRecordSchema.index({ vehicle: 1, odometerReading: -1 });

// Virtual for calculating fuel efficiency
fuelRecordSchema.virtual('efficiency').get(function() {
  if (this.distanceTraveled && this.quantity) {
    return this.distanceTraveled / this.quantity; // km per liter
  }
  return null;
});

// Pre-save middleware to calculate distance traveled and efficiency
fuelRecordSchema.pre('save', async function(next) {
  if (this.previousOdometer && this.odometerReading) {
    this.distanceTraveled = this.odometerReading - this.previousOdometer;
  }
  
  if (this.distanceTraveled && this.quantity) {
    this.fuelEfficiency = this.distanceTraveled / this.quantity;
  }
  
  if (this.quantity && this.costPerUnit) {
    this.totalCost = this.quantity * this.costPerUnit;
  }
  
  next();
});

module.exports = mongoose.model('FuelRecord', fuelRecordSchema);
