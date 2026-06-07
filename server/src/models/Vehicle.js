const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehicle = sequelize.define(
  'Vehicle',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    plateNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('BUS', 'MINIBUS', 'BAJAJ', 'TAXI', 'CARGO'),
      allowNull: false,
    },
    make: { type: DataTypes.STRING, allowNull: false },
    model: { type: DataTypes.STRING, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    color: { type: DataTypes.STRING },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED'),
      defaultValue: 'ACTIVE',
    },
    fuelType: {
      type: DataTypes.ENUM('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'),
      defaultValue: 'DIESEL',
    },
    // FK columns — no inline references; handled by associations in models/index.js
    assignedDriverId: { type: DataTypes.UUID },
    assignedRouteId:  { type: DataTypes.UUID },
    operatorId:       { type: DataTypes.UUID, allowNull: false },
    insuranceExpiry:       { type: DataTypes.DATE },
    licenseExpiry:         { type: DataTypes.DATE },
    lastMaintenanceDate:   { type: DataTypes.DATE },
    nextMaintenanceDate:   { type: DataTypes.DATE },
    mileage:     { type: DataTypes.INTEGER, defaultValue: 0 },
    gpsEnabled:  { type: DataTypes.BOOLEAN, defaultValue: false },
    currentLocation: {
      type: DataTypes.JSONB,
      defaultValue: { type: 'Point', coordinates: [37.5543, 6.0333] },
    },
    documents: { type: DataTypes.JSONB, defaultValue: [] },
    image:     { type: DataTypes.STRING, defaultValue: '' },
  },
  {
    tableName: 'vehicles',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['plate_number'] },
      { fields: ['status', 'type'] },
    ],
  }
);

module.exports = Vehicle;
