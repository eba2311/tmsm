const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VehicleLocationHistory = sequelize.define(
  'VehicleLocationHistory',
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
    location: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { type: 'Point', coordinates: [0, 0] },
    },
    speed: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    heading: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    altitude: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    accuracy: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    batteryLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'IDLE', 'OFFLINE', 'MAINTENANCE'),
      defaultValue: 'ACTIVE',
    },
  },
  {
    tableName: 'vehicle_location_history',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['vehicle_id', 'timestamp'],
      },
    ],
  }
);

module.exports = VehicleLocationHistory;
