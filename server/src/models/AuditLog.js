const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define(
  'AuditLog',
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
    action: {
      type: DataTypes.ENUM(
        'LOGIN',
        'LOGOUT',
        'CREATE',
        'UPDATE',
        'DELETE',
        'VIEW',
        'EXPORT',
        'IMPORT',
        'APPROVE',
        'REJECT',
        'BOOKING',
        'PAYMENT',
        'CANCEL',
        'REFUND'
      ),
      allowNull: false,
    },
    resource: {
      type: DataTypes.ENUM(
        'USER',
        'VEHICLE',
        'DRIVER',
        'ROUTE',
        'SCHEDULE',
        'BOOKING',
        'PAYMENT',
        'MAINTENANCE',
        'REPORT',
        'NOTIFICATION',
        'SETTING'
      ),
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.UUID,
    },
    details: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    ipAddress: {
      type: DataTypes.STRING,
    },
    userAgent: {
      type: DataTypes.STRING,
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'timestamp'],
      },
      {
        fields: ['action', 'timestamp'],
      },
      {
        fields: ['resource', 'timestamp'],
      },
      {
        fields: ['timestamp'],
      },
    ],
  }
);

module.exports = AuditLog;
