const mongoose = require('mongoose');

const reportScheduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  reportType: {
    type: String,
    required: true,
    enum: ['overview', 'revenue', 'bookings', 'fleet', 'routes', 'performance', 'financial'],
  },
  schedule: {
    type: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
    },
    time: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Invalid time format. Use HH:MM',
      },
    },
  },
  filters: {
    startDate: Date,
    endDate: Date,
    routes: [mongoose.Schema.Types.ObjectId],
    vehicles: [mongoose.Schema.Types.ObjectId],
    paymentMethods: [String],
    statuses: [String],
  },
  format: {
    type: String,
    required: true,
    enum: ['pdf', 'excel', 'csv'],
    default: 'pdf',
  },
  recipients: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0 && v.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      },
      message: 'Invalid email addresses',
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastRun: Date,
  nextRun: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
reportScheduleSchema.index({ createdBy: 1, isActive: 1 });
reportScheduleSchema.index({ nextRun: 1, isActive: 1 });
reportScheduleSchema.index({ reportType: 1 });

// Calculate next run time
reportScheduleSchema.methods.calculateNextRun = function() {
  const now = new Date();
  const { type, dayOfWeek, dayOfMonth, time } = this.schedule;
  const [hours, minutes] = time.split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (type) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    case 'weekly':
      if (dayOfWeek !== undefined) {
        nextRun.setDate(nextRun.getDate() + (dayOfWeek - nextRun.getDay() + 7) % 7);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
      }
      break;
    case 'monthly':
      if (dayOfMonth !== undefined) {
        nextRun.setDate(dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }
      break;
    case 'quarterly':
      nextRun.setMonth(nextRun.getMonth() + (3 - (nextRun.getMonth() % 3)));
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 3);
      }
      break;
    case 'yearly':
      nextRun.setMonth(0);
      nextRun.setDate(1);
      if (nextRun <= now) {
        nextRun.setFullYear(nextRun.getFullYear() + 1);
      }
      break;
  }
  
  this.nextRun = nextRun;
  return nextRun;
};

// Pre-save hook to calculate next run time
reportScheduleSchema.pre('save', function(next) {
  if (this.isActive) {
    this.calculateNextRun();
  }
  next();
});

module.exports = mongoose.model('ReportSchedule', reportScheduleSchema);
