const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DriverPayroll = sequelize.define(
  'DriverPayroll',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    // FK columns — no inline references
    driverId:      { type: DataTypes.UUID, allowNull: false },
    approvedById:  { type: DataTypes.UUID },
    processedById: { type: DataTypes.UUID },

    periodType: {
      type: DataTypes.ENUM('WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY'),
      allowNull: false,
    },
    periodStartDate:    { type: DataTypes.DATE, allowNull: false },
    periodEndDate:      { type: DataTypes.DATE, allowNull: false },
    baseSalary:         { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    bonuses:            { type: DataTypes.JSONB, defaultValue: [] },
    deductions:         { type: DataTypes.JSONB, defaultValue: [] },
    tripsCompleted:     { type: DataTypes.INTEGER, defaultValue: 0 },
    hoursWorked:        { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    revenueGenerated:   { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    commissionRate:     { type: DataTypes.DECIMAL(5, 2) },
    commissionAmount:   { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    grossPay:           { type: DataTypes.DECIMAL(10, 2) },
    netPay:             { type: DataTypes.DECIMAL(10, 2) },
    status: {
      type: DataTypes.ENUM('PENDING', 'PROCESSED', 'PAID', 'CANCELLED'),
      defaultValue: 'PENDING',
    },
    paymentMethod: {
      type: DataTypes.ENUM('BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'CHECK'),
    },
    paymentDate:          { type: DataTypes.DATE },
    transactionReference: { type: DataTypes.STRING },
    notes:                { type: DataTypes.STRING },
    approvedAt:           { type: DataTypes.DATE },
    processedAt:          { type: DataTypes.DATE },
  },
  {
    tableName: 'driver_payrolls',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['driver_id', 'period_start_date'] },
      { fields: ['status'] },
      { fields: ['period_start_date', 'period_end_date'] },
    ],
    hooks: {
      beforeSave: async (payroll) => {
        const totalBonuses = payroll.bonuses?.reduce((sum, b) => sum + b.amount, 0) || 0;
        const totalDeductions = payroll.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;
        payroll.grossPay = payroll.baseSalary + totalBonuses + (payroll.commissionAmount || 0);
        payroll.netPay = payroll.grossPay - totalDeductions;
      },
    },
  }
);

module.exports = DriverPayroll;
