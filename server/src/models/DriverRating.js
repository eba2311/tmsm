const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DriverRating = sequelize.define(
  'DriverRating',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'drivers',
        key: 'id',
      },
    },
    bookingId: {
      type: DataTypes.UUID,
      references: {
        model: 'bookings',
        key: 'id',
      },
    },
    passengerId: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    categories: {
      type: DataTypes.JSON,
      defaultValue: {
        punctuality: null,
        professionalism: null,
        vehicleCondition: null,
        drivingSkill: null,
        customerService: null,
      },
    },
    comment: {
      type: DataTypes.STRING,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    response: {
      type: DataTypes.STRING,
    },
    respondedAt: {
      type: DataTypes.DATE,
    },
    respondedById: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'driver_ratings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['driver_id', 'created_at'],
      },
      {
        fields: ['booking_id'],
      },
      {
        fields: ['passenger_id'],
      },
      {
        fields: ['rating'],
      },
    ],
  }
);

module.exports = DriverRating;
