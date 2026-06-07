const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReportSchedule = sequelize.define(
  'ReportSchedule',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:        { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    reportType: {
      type: DataTypes.ENUM('overview', 'revenue', 'bookings', 'fleet', 'routes', 'performance', 'financial'),
      allowNull: false,
    },
    scheduleType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
      allowNull: false,
    },
    scheduleDayOfWeek:  { type: DataTypes.INTEGER },
    scheduleDayOfMonth: { type: DataTypes.INTEGER },
    scheduleTime:       { type: DataTypes.STRING, allowNull: false },
    filters: {
      type: DataTypes.JSONB,
      defaultValue: { startDate: null, endDate: null, routes: [], vehicles: [], paymentMethods: [], statuses: [] },
    },
    format:     { type: DataTypes.ENUM('pdf', 'excel', 'csv'), defaultValue: 'pdf' },
    recipients: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
    // FK — no inline references
    createdById: { type: DataTypes.UUID, allowNull: false },
    lastRun:     { type: DataTypes.DATE },
    nextRun:     { type: DataTypes.DATE },
    isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'report_schedules',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['created_by_id', 'is_active'] },
      { fields: ['next_run', 'is_active'] },
      { fields: ['report_type'] },
    ],
  }
);

module.exports = ReportSchedule;
