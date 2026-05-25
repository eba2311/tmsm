const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    licenseNumber: { type: String, required: true, unique: true, uppercase: true },
    licenseClass: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F'], required: true },
    licenseExpiry: { type: Date, required: true },
    nationalId: { type: String, unique: true, sparse: true },
    dateOfBirth: { type: Date },
    address: {
      woreda: { type: String },
      kebele: { type: String },
      city: { type: String, default: 'Arba Minch' },
      region: { type: String, default: 'SNNPR' },
    },
    experience: { type: Number, default: 0 }, // years
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    assignedRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
    salary: { type: Number, default: 0 }, // in ETB
    rating: { type: Number, default: 5, min: 1, max: 5 },
    totalTrips: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 }, // km
    bankAccount: { type: String },
    bankName: { type: String },
    photo: { type: String, default: '' },
    joiningDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// `unique: true` on `licenseNumber` already creates an index; avoid duplicate.
// Keep only the non-unique index for status.
// driverSchema.index({ licenseNumber: 1 });
driverSchema.index({ status: 1 });

module.exports = mongoose.model('Driver', driverSchema);
