const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FuelRecord = sequelize.define(
  'FuelRecord',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // FK columns — no inline references
    vehicleId:  { type: DataTypes.UUID, allowNull: false },
    driverId:   { type: DataTypes.UUID },
    operatorId: { type: DataTypes.UUID, allowNull: false },

    date:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    fuelType: {
      type: DataTypes.ENUM('DIESEL', 'PETROL', 'CNG', 'LPG', 'ELECTRIC'),
      allowNull: false,
    },
    quantity:     { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    unit:         { type: DataTypes.ENUM('LITERS', 'GALLONS', 'KWH'), defaultValue: 'LITERS' },
    costPerUnit:  { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    totalCost:    { type: DataTypes.DECIMAL(10, 2) },
    odometerReading:  { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    previousOdometer: { type: DataTypes.DECIMAL(10, 2) },
    distanceTraveled: { type: DataTypes.DECIMAL(10, 2) },
    fuelEfficiency:   { type: DataTypes.DECIMAL(10, 2) },
    station:       { type: DataTypes.STRING },
    location:      { type: DataTypes.JSONB },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'CARD', 'CREDIT', 'COMPANY_ACCOUNT'),
      defaultValue: 'CASH',
    },
    receiptNumber: { type: DataTypes.STRING },
    notes:         { type: DataTypes.STRING },
  },
  {
    tableName: 'fuel_records',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['vehicle_id', 'date'] },
      { fields: ['driver_id', 'date'] },
      { fields: ['date'] },
      { fields: ['vehicle_id', 'odometer_reading'] },
    ],
    hooks: {
      beforeSave: async (record) => {
        if (record.previousOdometer && record.odometerReading) {
          record.distanceTraveled = record.odometerReading - record.previousOdometer;
        }
        if (record.distanceTraveled && record.quantity) {
          record.fuelEfficiency = record.distanceTraveled / record.quantity;
        }
        if (record.quantity && record.costPerUnit) {
          record.totalCost = record.quantity * record.costPerUnit;
        }
      },
    },
  }
);

module.exports = FuelRecord;
