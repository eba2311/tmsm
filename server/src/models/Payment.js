const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'ETB' },
    method: {
      type: String,
      enum: ['TELEBIRR', 'CBE_BIRR', 'CASH', 'CARD', 'BANK_TRANSFER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'],
      default: 'PENDING',
    },
    transactionId: { type: String, unique: true, sparse: true },
    gatewayReference: { type: String },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    refundReason: { type: String },
    refundedAt: { type: Date },
    paidAt: { type: Date },
    receiptUrl: { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ method: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
