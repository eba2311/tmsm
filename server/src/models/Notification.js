const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM(
        'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
        'SCHEDULE_DELAY', 'SCHEDULE_CANCELLED', 'VEHICLE_MAINTENANCE', 'DRIVER_ALERT',
        'SYSTEM', 'PROMOTION'
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    titleAm: {
      type: DataTypes.STRING,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    messageAm: {
      type: DataTypes.TEXT,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
    },
    data: {
      type: DataTypes.JSONB,
    },
    channel: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['IN_APP'],
      validate: {
        isIn: [['IN_APP', 'SMS', 'EMAIL', 'PUSH']],
      },
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['recipient_id', 'is_read', 'created_at'],
      },
    ],
  }
);

module.exports = Notification;
