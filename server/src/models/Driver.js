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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    licenseClass: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D', 'E', 'F'),
      allowNull: true,
    },
    licenseExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nationalId: {
      type: DataTypes.STRING,
      unique: true,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
    },
    address: {
      type: DataTypes.JSONB,
      defaultValue: {
        woreda: null,
        kebele: null,
        city: 'Arba Minch',
        region: 'SNNPR',
      },
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED'),
      defaultValue: 'ACTIVE',
    },
    assignedVehicleId: {
      type: DataTypes.UUID,
      references: {
        model: 'vehicles',
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
      references: {
        model: 'users',
        key: 'id',
      },
    },
    emergencyContact: {
      type: DataTypes.JSONB,
      defaultValue: {
        name: null,
        phone: null,
        relation: null,
      },
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 5,
      validate: {
        min: 1,
        max: 5,
      },
    },
    totalTrips: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalDistance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    bankAccount: {
      type: DataTypes.STRING,
    },
    bankName: {
      type: DataTypes.STRING,
    },
    photo: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    joiningDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'drivers',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['license_number'],
      },
      {
        unique: true,
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

module.exports = Driver;
