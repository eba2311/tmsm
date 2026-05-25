const mongoose = require('mongoose');

const driverPayrollSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
  },
  period: {
    type: {
      type: String,
      required: true,
      enum: ['WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  baseSalary: {
    type: Number,
    required: true,
    min: 0,
  },
  bonuses: [{
    type: {
      type: String,
      enum: ['PERFORMANCE', 'OVERTIME', 'SAFETY', 'CUSTOMER_SATISFACTION', 'REFERRAL', 'OTHER'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      maxlength: 200,
    },
  }],
  deductions: [{
    type: {
      type: String,
      enum: ['TAX', 'INSURANCE', 'LOAN', 'PENALTY', 'ABSENCE', 'OTHER'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      maxlength: 200,
    },
  }],
  tripsCompleted: {
    type: Number,
    default: 0,
  },
  hoursWorked: {
    type: Number,
    default: 0,
  },
  revenueGenerated: {
    type: Number,
    default: 0,
  },
  commissionRate: {
    type: Number,
    min: 0,
    max: 100,
  },
  commissionAmount: {
    type: Number,
    default: 0,
  },
  grossPay: {
    type: Number,
    min: 0,
  },
  netPay: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSED', 'PAID', 'CANCELLED'],
    default: 'PENDING',
  },
  paymentMethod: {
    type: String,
    enum: ['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'CHECK'],
  },
  paymentDate: {
    type: Date,
  },
  transactionReference: {
    type: String,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  processedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
driverPayrollSchema.index({ driver: 1, 'period.startDate': -1 });
driverPayrollSchema.index({ status: 1 });
driverPayrollSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });

// Pre-save hook to calculate totals
driverPayrollSchema.pre('save', function(next) {
  const totalBonuses = this.bonuses.reduce((sum, b) => sum + b.amount, 0);
  const totalDeductions = this.deductions.reduce((sum, d) => sum + d.amount, 0);
  
  this.grossPay = this.baseSalary + totalBonuses + this.commissionAmount;
  this.netPay = this.grossPay - totalDeductions;
  
  next();
});

module.exports = mongoose.model('DriverPayroll', driverPayrollSchema);
