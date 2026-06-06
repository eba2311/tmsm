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
      references: {
        model: 'users',
        key: 'id',
      },
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    licenseClass: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    licenseExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nationalId: {
      type: DataTypes.STRING,
      allowNull: true,   // explicitly nullable — no unique constraint here
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
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
      allowNull: true,
      references: {
        model: 'vehicles',
        key: 'id',
      },
    },
    assignedRouteId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'routes',
        key: 'id',
      },
    },
    operatorId: {
      type: DataTypes.UUID,
      allowNull: true,
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
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 5.0,
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
      allowNull: true,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
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
        fields: ['status'],
      },
      {
        fields: ['user_id'],
      },
    ],
  }
);

module.exports = Driver;
