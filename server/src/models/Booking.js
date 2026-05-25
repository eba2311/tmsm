const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  nationalId: { type: String },
  seatNumber: { type: Number, required: true },
  ticketNumber: { type: String, unique: true },
  age: { type: Number },
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
});

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, unique: true, default: () => `AM${uuidv4().slice(0, 8).toUpperCase()}` },
    schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    passengers: [passengerSchema],
    totalAmount: { type: Number, required: true }, // ETB
    currency: { type: String, default: 'ETB' },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'USED', 'EXPIRED'],
      default: 'PENDING',
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID', 'REFUNDED', 'PARTIALLY_PAID'],
      default: 'UNPAID',
    },
    paymentMethod: {
      type: String,
      enum: ['TELEBIRR', 'CBE_BIRR', 'CASH', 'CARD', 'BANK_TRANSFER'],
    },
    qrCode: { type: String },
    qrCodeData: { type: String },
    boardingPoint: { type: String },
    droppingPoint: { type: String },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
    cancellationReason: { type: String },
    refundAmount: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

// `unique: true` on `bookingRef` already creates an index; avoid duplicate.
// bookingSchema.index({ bookingRef: 1 });
bookingSchema.index({ passenger: 1, createdAt: -1 });
bookingSchema.index({ schedule: 1 });
bookingSchema.index({ status: 1, paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
