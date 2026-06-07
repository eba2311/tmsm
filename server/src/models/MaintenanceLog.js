const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MaintenanceLog = sequelize.define(
  'MaintenanceLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // FK columns — no inline references
    vehicleId:    { type: DataTypes.UUID, allowNull: false },
    createdById:  { type: DataTypes.UUID },
    completedById:{ type: DataTypes.UUID },
    assignedToId: { type: DataTypes.UUID },

    type: {
      type: DataTypes.ENUM('ROUTINE', 'REPAIR', 'INSPECTION', 'EMERGENCY', 'UPGRADE'),
      allowNull: false,
    },
    description:   { type: DataTypes.TEXT, allowNull: false },
    cost:          { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    mileageAtService: { type: DataTypes.DECIMAL(10, 2) },
    servicedBy:    { type: DataTypes.STRING },
    garage:        { type: DataTypes.STRING },
    startDate:     { type: DataTypes.DATE, allowNull: false },
    endDate:       { type: DataTypes.DATE },
    status: {
      type: DataTypes.ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'SCHEDULED',
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      defaultValue: 'MEDIUM',
    },
    partsReplaced:       { type: DataTypes.JSONB, defaultValue: [] },
    nextServiceMileage:  { type: DataTypes.DECIMAL(10, 2) },
    nextServiceDate:     { type: DataTypes.DATE },
    attachments:         { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    notes:               { type: DataTypes.TEXT },
    isRecurring:         { type: DataTypes.BOOLEAN, defaultValue: false },
    recurringInterval: {
      type: DataTypes.ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'MILEAGE_BASED'),
    },
    recurringIntervalValue: { type: DataTypes.INTEGER },
    reminderDays:  { type: DataTypes.INTEGER, defaultValue: 7 },
    reminderSent:  { type: DataTypes.BOOLEAN, defaultValue: false },
    reminderDate:  { type: DataTypes.DATE },
    estimatedDuration: { type: DataTypes.INTEGER },
    actualDuration:    { type: DataTypes.INTEGER },
    completedAt:       { type: DataTypes.DATE },
  },
  {
    tableName: 'maintenance_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['vehicle_id', 'start_date'] },
      { fields: ['status'] },
      { fields: ['next_service_date'] },
      { fields: ['priority'] },
    ],
    hooks: {
      beforeSave: async (log) => {
        if (log.startDate && !log.reminderDate) {
          const reminderDate = new Date(log.startDate);
          reminderDate.setDate(reminderDate.getDate() - log.reminderDays);
          log.reminderDate = reminderDate;
        }
      },
    },
  }
);

module.exports = MaintenanceLog;
