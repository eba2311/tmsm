const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RouteOptimization = sequelize.define(
  'RouteOptimization',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    routeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'routes',
        key: 'id',
      },
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
    scheduleId: {
      type: DataTypes.UUID,
      references: {
        model: 'schedules',
        key: 'id',
      },
    },
    originalStops: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    optimizedStops: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    optimizationMetrics: {
      type: DataTypes.JSONB,
      defaultValue: {
        originalDistance: null,
        optimizedDistance: null,
        originalDuration: null,
        optimizedDuration: null,
        distanceSaved: null,
        timeSaved: null,
        fuelSaved: null,
        costSaved: null,
        efficiencyImprovement: null,
      },
    },
    constraints: {
      type: DataTypes.JSONB,
      defaultValue: {
        maxStops: null,
        timeWindow: {
          start: null,
          end: null,
        },
        maxDuration: null,
        maxDistance: null,
        avoidTolls: false,
        avoidHighways: false,
        preferredRoutes: [],
      },
    },
    optimizationMethod: {
      type: DataTypes.ENUM('NEAREST_NEIGHBOR', 'GENETIC_ALGORITHM', 'SIMULATED_ANNEALING', 'GREEDY', 'CUSTOM'),
      defaultValue: 'NEAREST_NEIGHBOR',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'OPTIMIZING', 'COMPLETED', 'FAILED'),
      defaultValue: 'PENDING',
    },
    optimizationDate: {
      type: DataTypes.DATE,
    },
    optimizedById: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'route_optimizations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['route_id', 'optimization_date'],
      },
      {
        fields: ['vehicle_id', 'optimization_date'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['optimization_date'],
      },
    ],
  }
);

module.exports = RouteOptimization;
