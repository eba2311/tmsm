const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inventory = sequelize.define(
  'Inventory',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('PHYSICAL_TICKET', 'DIGITAL_TICKET', 'MONTHLY_PASS'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      trim: true,
    },
    routeId: {
      type: DataTypes.UUID,
      references: {
        model: 'routes',
        key: 'id',
      },
    },
    vehicleId: {
      type: DataTypes.UUID,
      references: {
        model: 'vehicles',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('AVAILABLE', 'SOLD', 'RESERVED', 'EXPIRED'),
      defaultValue: 'AVAILABLE',
    },
    expiryDate: {
      type: DataTypes.DATE,
    },
    createdById: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'inventory',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['type', 'status'],
      },
      {
        fields: ['route_id'],
      },
      {
        fields: ['vehicle_id'],
      },
    ],
  }
);

module.exports = Inventory;
