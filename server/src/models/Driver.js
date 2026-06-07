const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Driver = sequelize.define(
  'Driver',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // FK columns — no inline references; handled by associations in models/index.js
    userId:           { type: DataTypes.UUID, allowNull: false },
    assignedVehicleId:{ type: DataTypes.UUID, allowNull: true },
    assignedRouteId:  { type: DataTypes.UUID, allowNull: true },
    operatorId:       { type: DataTypes.UUID, allowNull: true },

    licenseNumber: { type: DataTypes.STRING, allowNull: false },
    licenseClass:  { type: DataTypes.STRING, allowNull: true },
    licenseExpiry: { type: DataTypes.DATE, allowNull: true },
    nationalId:    { type: DataTypes.STRING, allowNull: true },
    dateOfBirth:   { type: DataTypes.DATE, allowNull: true },
    address: {
      type: DataTypes.JSONB,
      defaultValue: { woreda: null, kebele: null, city: 'Arba Minch', region: 'SNNPR' },
    },
    experience: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED'),
      defaultValue: 'ACTIVE',
    },
    emergencyContact: {
      type: DataTypes.JSONB,
      defaultValue: { name: null, phone: null, relation: null },
    },
    salary:        { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    rating:        { type: DataTypes.DECIMAL(3, 1), defaultValue: 5.0 },
    totalTrips:    { type: DataTypes.INTEGER, defaultValue: 0 },
    totalDistance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    bankAccount:   { type: DataTypes.STRING, allowNull: true },
    bankName:      { type: DataTypes.STRING, allowNull: true },
    photo:         { type: DataTypes.STRING, defaultValue: '' },
    joiningDate:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'drivers',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['license_number'] },
      { fields: ['status'] },
      { fields: ['user_id'] },
    ],
  }
);

module.exports = Driver;
