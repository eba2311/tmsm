const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Route = sequelize.define(
  'Route',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name:   { type: DataTypes.STRING, allowNull: false },
    nameAm: { type: DataTypes.STRING },
    code:   { type: DataTypes.STRING, allowNull: false, unique: true },
    origin: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        name: '', nameAm: null,
        coordinates: { type: 'Point', coordinates: [37.5543, 6.0333] },
      },
    },
    destination: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        name: '', nameAm: null,
        coordinates: { type: 'Point', coordinates: [0, 0] },
      },
    },
    stops:             { type: DataTypes.JSONB, defaultValue: [] },
    distance:          { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    estimatedDuration: { type: DataTypes.INTEGER, allowNull: false },
    baseFare:          { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SEASONAL'),
      defaultValue: 'ACTIVE',
    },
    transportType: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['BUS'],
    },
    isIntercity: { type: DataTypes.BOOLEAN, defaultValue: false },
    // FK — no inline references
    operatorId: { type: DataTypes.UUID },
  },
  {
    tableName: 'routes',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = Route;
