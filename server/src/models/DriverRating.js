const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DriverRating = sequelize.define(
  'DriverRating',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    // FK columns — no inline references
    driverId:      { type: DataTypes.UUID, allowNull: false },
    bookingId:     { type: DataTypes.UUID },
    passengerId:   { type: DataTypes.UUID },
    respondedById: { type: DataTypes.UUID },

    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    categories: {
      type: DataTypes.JSONB,
      defaultValue: {
        punctuality: null,
        professionalism: null,
        vehicleCondition: null,
        drivingSkill: null,
        customerService: null,
      },
    },
    comment:      { type: DataTypes.STRING },
    isAnonymous:  { type: DataTypes.BOOLEAN, defaultValue: false },
    response:     { type: DataTypes.STRING },
    respondedAt:  { type: DataTypes.DATE },
  },
  {
    tableName: 'driver_ratings',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['driver_id', 'created_at'] },
      { fields: ['booking_id'] },
      { fields: ['passenger_id'] },
      { fields: ['rating'] },
    ],
  }
);

module.exports = DriverRating;
