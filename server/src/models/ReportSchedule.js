const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReportSchedule = sequelize.define(
  'ReportSchedule',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
    reportType: {
      type: DataTypes.ENUM('overview', 'revenue', 'bookings', 'fleet', 'routes', 'performance', 'financial'),
      allowNull: false,
    },
    scheduleType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
      allowNull: false,
    },
    scheduleDayOfWeek: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 6,
      },
    },
    scheduleDayOfMonth: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 31,
      },
    },
    scheduleTime: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
    },
    filters: {
      type: DataTypes.JSON,
      defaultValue: {
        startDate: null,
        endDate: null,
        routes: [],
        vehicles: [],
        paymentMethods: [],
        statuses: [],
      },
    },
    format: {
      type: DataTypes.ENUM('pdf', 'excel', 'csv'),
      defaultValue: 'pdf',
    },
    recipients: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    lastRun: {
      type: DataTypes.DATE,
    },
    nextRun: {
      type: DataTypes.DATE,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'report_schedules',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['created_by_id', 'is_active'],
      },
      {
        fields: ['next_run', 'is_active'],
      },
      {
        fields: ['report_type'],
      },
    ],
  }
);

module.exports = ReportSchedule;
