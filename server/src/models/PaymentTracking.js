const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentTracking = sequelize.define(
  'PaymentTracking',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
      type: DataTypes.ENUM('ETB', 'USD', 'EUR'),
      defaultValue: 'ETB',
    },
    method: {
      type: DataTypes.ENUM('TELEBIRR', 'CBE_BIRR', 'AMOLE', 'CASH', 'CARD', 'BANK_TRANSFER'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'),
      defaultValue: 'PENDING',
    },
    paymentGateway: {
      type: DataTypes.STRING,
    },
    gatewayTransactionId: {
      type: DataTypes.STRING,
    },
    gatewayResponse: {
      type: DataTypes.JSONB,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        phoneNumber: null,
        cardLast4: null,
        cardBrand: null,
        bankName: null,
        accountNumber: null,
        receiptNumber: null,
        notes: null,
      },
    },
    timestampsInitiated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    timestampsCompleted: {
      type: DataTypes.DATE,
    },
    timestampsFailed: {
      type: DataTypes.DATE,
    },
    timestampsRefunded: {
      type: DataTypes.DATE,
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    failureReason: {
      type: DataTypes.TEXT,
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    refundReason: {
      type: DataTypes.TEXT,
    },
    createdById: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    updatedById: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'payment_tracking',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'created_at'],
      },
      {
        fields: ['booking_id'],
      },
      {
        fields: ['status', 'created_at'],
      },
      {
        fields: ['method', 'status'],
      },
      {
        fields: ['timestamps_initiated'],
      },
    ],
  }
);

module.exports = PaymentTracking;
