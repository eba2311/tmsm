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
      trim: true,
    },
    type: {
      type: DataTypes.ENUM('BUS', 'MINIBUS', 'BAJAJ', 'TAXI', 'CARGO'),
      allowNull: false,
    },
    make: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED'),
      defaultValue: 'ACTIVE',
    },
    fuelType: {
      type: DataTypes.ENUM('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'),
      defaultValue: 'DIESEL',
    },
    assignedDriverId: {
      type: DataTypes.UUID,
      references: {
        model: 'drivers',
        key: 'id',
      },
    },
    assignedRouteId: {
      type: DataTypes.UUID,
      references: {
        model: 'routes',
        key: 'id',
      },
    },
    operatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    insuranceExpiry: {
      type: DataTypes.DATE,
    },
    licenseExpiry: {
      type: DataTypes.DATE,
    },
    lastMaintenanceDate: {
      type: DataTypes.DATE,
    },
    nextMaintenanceDate: {
      type: DataTypes.DATE,
    },
    mileage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    gpsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    currentLocation: {
      type: DataTypes.JSON,
      defaultValue: { type: 'Point', coordinates: [37.5543, 6.0333] },
    },
    documents: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    image: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
  },
  {
    tableName: 'vehicles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['plate_number'],
      },
      {
        fields: ['status', 'type'],
      },
    ],
  }
);

module.exports = Vehicle;
