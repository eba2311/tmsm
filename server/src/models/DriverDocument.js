const mongoose = require('mongoose');

const driverDocumentSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
  },
  documentType: {
    type: String,
    required: true,
    enum: ['LICENSE', 'PERMIT', 'INSURANCE', 'BACKGROUND_CHECK', 'MEDICAL_CERTIFICATE', 'TRAINING_CERTIFICATE', 'CONTRACT', 'ID_CARD', 'CERTIFICATION', 'OTHER'],
  },
  documentNumber: {
    type: String,
  },
  issueDate: {
    type: Date,
  },
  expiryDate: {
    type: Date,
  },
  issuingAuthority: {
    type: String,
  },
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  mimeType: {
    type: String,
  },
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED'],
    default: 'PENDING',
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: {
    type: Date,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  reminderDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
driverDocumentSchema.index({ driver: 1, documentType: 1 });
driverDocumentSchema.index({ expiryDate: 1 });
driverDocumentSchema.index({ status: 1 });

// Virtual for checking if document is expiring soon
driverDocumentSchema.virtual('isExpiringSoon').get(function() {
  if (!this.expiryDate) return false;
  const daysUntilExpiry = Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
});

// Virtual for checking if document is expired
driverDocumentSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Pre-save hook to update status based on expiry date
driverDocumentSchema.pre('save', function(next) {
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = 'EXPIRED';
  }
  next();
});

module.exports = mongoose.model('DriverDocument', driverDocumentSchema);
