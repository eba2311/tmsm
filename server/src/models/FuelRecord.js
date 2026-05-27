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
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vehicles',
        key: 'id',
      },
    },
    driverId: {
      type: DataTypes.UUID,
      references: {
        model: 'drivers',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fuelType: {
      type: DataTypes.ENUM('DIESEL', 'PETROL', 'CNG', 'LPG', 'ELECTRIC'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unit: {
      type: DataTypes.ENUM('LITERS', 'GALLONS', 'KWH'),
      defaultValue: 'LITERS',
    },
    costPerUnit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalCost: {
      type: DataTypes.DECIMAL(10, 2),
    },
    odometerReading: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    previousOdometer: {
      type: DataTypes.DECIMAL(10, 2),
    },
    distanceTraveled: {
      type: DataTypes.DECIMAL(10, 2),
    },
    fuelEfficiency: {
      type: DataTypes.DECIMAL(10, 2),
    },
    station: {
      type: DataTypes.STRING,
    },
    location: {
      type: DataTypes.JSON,
    },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'CARD', 'CREDIT', 'COMPANY_ACCOUNT'),
      defaultValue: 'CASH',
    },
    receiptNumber: {
      type: DataTypes.STRING,
    },
    notes: {
      type: DataTypes.STRING,
    },
    operatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'fuel_records',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['vehicle_id', 'date'],
      },
      {
        fields: ['driver_id', 'date'],
      },
      {
        fields: ['date'],
      },
      {
        fields: ['vehicle_id', 'odometer_reading'],
      },
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
