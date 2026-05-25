const mongoose = require('mongoose');

const paymentTrackingSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'ETB',
    enum: ['ETB', 'USD', 'EUR'],
  },
  method: {
    type: String,
    required: true,
    enum: ['TELEBIRR', 'CBE_BIRR', 'AMOLE', 'CASH', 'CARD', 'BANK_TRANSFER'],
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
    default: 'PENDING',
  },
  paymentGateway: {
    type: String,
    required: function() {
      return this.method !== 'CASH';
    },
  },
  gatewayTransactionId: {
    type: String,
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
  },
  metadata: {
    phoneNumber: String,
    cardLast4: String,
    cardBrand: String,
    bankName: String,
    accountNumber: String,
    receiptNumber: String,
    notes: String,
  },
  timestamps: {
    initiated: {
      type: Date,
      default: Date.now,
    },
    completed: Date,
    failed: Date,
    refunded: Date,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  failureReason: {
    type: String,
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundReason: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
paymentTrackingSchema.index({ user: 1, createdAt: -1 });
paymentTrackingSchema.index({ booking: 1 });
paymentTrackingSchema.index({ status: 1, createdAt: -1 });
paymentTrackingSchema.index({ method: 1, status: 1 });
paymentTrackingSchema.index({ 'timestamps.initiated': -1 });

// Virtual for payment duration
paymentTrackingSchema.virtual('duration').get(function() {
  if (this.status === 'COMPLETED' && this.timestamps.completed) {
    return Math.floor((this.timestamps.completed - this.timestamps.initiated) / 1000);
  }
  return null;
});

// Virtual for payment age
paymentTrackingSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.timestamps.initiated) / 1000 / 60); // in minutes
});

// Method to mark as completed
paymentTrackingSchema.methods.markCompleted = function(gatewayTransactionId, gatewayResponse) {
  this.status = 'COMPLETED';
  this.timestamps.completed = new Date();
  if (gatewayTransactionId) this.gatewayTransactionId = gatewayTransactionId;
  if (gatewayResponse) this.gatewayResponse = gatewayResponse;
  return this.save();
};

// Method to mark as failed
paymentTrackingSchema.methods.markFailed = function(reason) {
  this.status = 'FAILED';
  this.timestamps.failed = new Date();
  this.failureReason = reason;
  this.retryCount += 1;
  return this.save();
};

// Method to process refund
paymentTrackingSchema.methods.processRefund = function(refundAmount, reason) {
  this.status = 'REFUNDED';
  this.timestamps.refunded = new Date();
  this.refundAmount = refundAmount;
  this.refundReason = reason;
  return this.save();
};

module.exports = mongoose.model('PaymentTracking', paymentTrackingSchema);
