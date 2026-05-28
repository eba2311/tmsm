const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Geofence = sequelize.define(
  'Geofence',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      trim: true,
    },
    type: {
      type: DataTypes.ENUM('CIRCLE', 'POLYGON', 'RECTANGLE'),
      allowNull: false,
    },
    coordinates: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    radius: {
      type: DataTypes.DECIMAL(10, 2),
    },
    alertOnEntry: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    alertOnExit: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    assignedVehicleIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
    assignedRouteIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdById: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'geofences',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Geofence;
