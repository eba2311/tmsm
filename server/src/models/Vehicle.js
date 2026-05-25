const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ['BUS', 'MINIBUS', 'BAJAJ', 'TAXI', 'CARGO'],
      required: true,
    },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    color: { type: String },
    capacity: { type: Number, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED'],
      default: 'ACTIVE',
    },
    fuelType: { type: String, enum: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'], default: 'DIESEL' },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    assignedRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    insuranceExpiry: { type: Date },
    licenseExpiry: { type: Date },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    mileage: { type: Number, default: 0 },
    gpsEnabled: { type: Boolean, default: false },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [37.5543, 6.0333] }, // Arba Minch coords
    },
    documents: [
      {
        type: { type: String },
        url: { type: String },
        expiryDate: { type: Date },
      },
    ],
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

vehicleSchema.index({ currentLocation: '2dsphere' });
// `unique: true` on `plateNumber` already creates an index; avoid duplicate.
// vehicleSchema.index({ plateNumber: 1 });
vehicleSchema.index({ status: 1, type: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
