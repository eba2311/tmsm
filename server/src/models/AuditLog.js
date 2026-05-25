const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'CREATE',
      'UPDATE',
      'DELETE',
      'VIEW',
      'EXPORT',
      'IMPORT',
      'APPROVE',
      'REJECT',
      'BOOKING',
      'PAYMENT',
      'CANCEL',
      'REFUND',
    ],
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'USER',
      'VEHICLE',
      'DRIVER',
      'ROUTE',
      'SCHEDULE',
      'BOOKING',
      'PAYMENT',
      'MAINTENANCE',
      'REPORT',
      'NOTIFICATION',
      'SETTING',
    ],
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  success: {
    type: Boolean,
    default: true,
  },
  errorMessage: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// TTL index - keep logs for 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
