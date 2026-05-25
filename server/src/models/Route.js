const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAm: { type: String },
  city: { type: String },
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  distanceFromOrigin: { type: Number, default: 0 }, // km
  estimatedTime: { type: Number, default: 0 }, // minutes from origin
});

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameAm: { type: String, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    origin: {
      name: { type: String, required: true },
      nameAm: { type: String },
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [37.5543, 6.0333] },
      },
    },
    destination: {
      name: { type: String, required: true },
      nameAm: { type: String },
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    stops: [stopSchema],
    distance: { type: Number, required: true }, // km
    estimatedDuration: { type: Number, required: true }, // minutes
    baseFare: { type: Number, required: true }, // ETB
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SEASONAL'], default: 'ACTIVE' },
    transportType: {
      type: [String],
      enum: ['BUS', 'MINIBUS', 'BAJAJ', 'TAXI', 'CARGO'],
      default: ['BUS'],
    },
    isIntercity: { type: Boolean, default: false },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

routeSchema.index({ 'origin.coordinates': '2dsphere' });
routeSchema.index({ 'destination.coordinates': '2dsphere' });
// `unique: true` on `code` already creates an index; avoid duplicate.
// routeSchema.index({ code: 1 });
routeSchema.index({ status: 1 });

module.exports = mongoose.model('Route', routeSchema);
