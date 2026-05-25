const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: {
      type: String,
      enum: ['ROUTINE', 'REPAIR', 'INSPECTION', 'EMERGENCY', 'UPGRADE'],
      required: true,
    },
    description: { type: String, required: true },
    cost: { type: Number, default: 0 }, // ETB
    mileageAtService: { type: Number },
    servicedBy: { type: String },
    garage: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    partsReplaced: [{ name: String, cost: Number, quantity: Number }],
    nextServiceMileage: { type: Number },
    nextServiceDate: { type: Date },
    attachments: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    // Scheduling fields
    isRecurring: { type: Boolean, default: false },
    recurringInterval: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'MILEAGE_BASED'],
    },
    recurringIntervalValue: { type: Number }, // e.g., every 3 months or every 5000 miles
    reminderDays: { type: Number, default: 7 }, // days before to send reminder
    reminderSent: { type: Boolean, default: false },
    reminderDate: { type: Date },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    estimatedDuration: { type: Number }, // in hours
    actualDuration: { type: Number }, // in hours
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

maintenanceLogSchema.index({ vehicle: 1, startDate: -1 });
maintenanceLogSchema.index({ status: 1 });
maintenanceLogSchema.index({ nextServiceDate: 1 });
maintenanceLogSchema.index({ priority: 1 });

// Virtual for checking if maintenance is overdue
maintenanceLogSchema.virtual('isOverdue').get(function() {
  if (this.status === 'COMPLETED' || this.status === 'CANCELLED') return false;
  if (!this.startDate) return false;
  return new Date() > this.startDate;
});

// Virtual for checking if maintenance is due soon
maintenanceLogSchema.virtual('isDueSoon').get(function() {
  if (this.status === 'COMPLETED' || this.status === 'CANCELLED') return false;
  if (!this.startDate) return false;
  const daysUntil = Math.ceil((this.startDate - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntil <= this.reminderDays && daysUntil > 0;
});

// Pre-save hook to calculate reminder date
maintenanceLogSchema.pre('save', function(next) {
  if (this.startDate && !this.reminderDate) {
    this.reminderDate = new Date(this.startDate);
    this.reminderDate.setDate(this.reminderDate.getDate() - this.reminderDays);
  }
  next();
});

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
