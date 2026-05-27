const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');

const Booking = sequelize.define(
  'Booking',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingRef: {
      type: DataTypes.STRING,
      unique: true,
      defaultValue: () => `AM${uuidv4().slice(0, 8).toUpperCase()}`,
    },
    scheduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'schedules',
        key: 'id',
      },
    },
    passengerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    agentId: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    passengers: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'ETB',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'USED', 'EXPIRED'),
      defaultValue: 'PENDING',
    },
    paymentStatus: {
      type: DataTypes.ENUM('UNPAID', 'PAID', 'REFUNDED', 'PARTIALLY_PAID'),
      defaultValue: 'UNPAID',
    },
    paymentMethod: {
      type: DataTypes.ENUM('TELEBIRR', 'CBE_BIRR', 'CASH', 'CARD', 'BANK_TRANSFER'),
    },
    qrCode: {
      type: DataTypes.STRING,
    },
    qrCodeData: {
      type: DataTypes.STRING,
    },
    boardingPoint: {
      type: DataTypes.STRING,
    },
    droppingPoint: {
      type: DataTypes.STRING,
    },
    checkedIn: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    checkedInAt: {
      type: DataTypes.DATE,
    },
    cancellationReason: {
      type: DataTypes.STRING,
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'bookings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['booking_ref'],
      },
      {
        fields: ['passenger_id', 'created_at'],
      },
      {
        fields: ['schedule_id'],
      },
      {
        fields: ['status', 'payment_status'],
      },
    ],
  }
);

module.exports = Booking;
