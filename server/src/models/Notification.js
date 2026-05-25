const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
        'SCHEDULE_DELAY', 'SCHEDULE_CANCELLED', 'VEHICLE_MAINTENANCE', 'DRIVER_ALERT',
        'SYSTEM', 'PROMOTION',
      ],
      required: true,
    },
    title: { type: String, required: true },
    titleAm: { type: String },
    message: { type: String, required: true },
    messageAm: { type: String },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    data: { type: mongoose.Schema.Types.Mixed },
    channel: {
      type: [String],
      enum: ['IN_APP', 'SMS', 'EMAIL', 'PUSH'],
      default: ['IN_APP'],
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
