const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    departureTime: { type: Date, required: true },
    estimatedArrival: { type: Date, required: true },
    actualDeparture: { type: Date },
    actualArrival: { type: Date },
    status: {
      type: String,
      enum: ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED', 'DELAYED'],
      default: 'SCHEDULED',
    },
    availableSeats: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    fare: { type: Number, required: true }, // ETB
    platform: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurringDays: [{ type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] }],
    notes: { type: String },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

scheduleSchema.index({ route: 1, departureTime: 1 });
scheduleSchema.index({ vehicle: 1, departureTime: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ departureTime: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
