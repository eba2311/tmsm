const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'ETB',
    },
    method: {
      type: DataTypes.ENUM('TELEBIRR', 'CBE_BIRR', 'CASH', 'CARD', 'BANK_TRANSFER'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'),
      defaultValue: 'PENDING',
    },
    transactionId: {
      type: DataTypes.STRING,
      unique: true,
    },
    gatewayReference: {
      type: DataTypes.STRING,
    },
    gatewayResponse: {
      type: DataTypes.JSON,
    },
    refundReason: {
      type: DataTypes.STRING,
    },
    refundedAt: {
      type: DataTypes.DATE,
    },
    paidAt: {
      type: DataTypes.DATE,
    },
    receiptUrl: {
      type: DataTypes.STRING,
    },
    processedById: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    notes: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['booking_id'],
      },
      {
        fields: ['user_id', 'created_at'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['method'],
      },
      {
        unique: true,
        fields: ['transaction_id'],
      },
    ],
  }
);

module.exports = Payment;
