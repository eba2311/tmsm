const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Schedule = sequelize.define(
  'Schedule',
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
      allowNull: false,
      references: {
        model: 'drivers',
        key: 'id',
      },
    },
    departureTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estimatedArrival: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    actualDeparture: {
      type: DataTypes.DATE,
    },
    actualArrival: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED', 'DELAYED'),
      defaultValue: 'SCHEDULED',
    },
    availableSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fare: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    platform: {
      type: DataTypes.STRING,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    recurringDays: {
      type: DataTypes.ARRAY(DataTypes.ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN')),
      defaultValue: [],
    },
    notes: {
      type: DataTypes.STRING,
    },
    operatorId: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'schedules',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['route_id', 'departure_time'],
      },
      {
        fields: ['vehicle_id', 'departure_time'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['departure_time'],
      },
    ],
  }
);

module.exports = Schedule;
