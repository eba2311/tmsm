const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DriverDocument = sequelize.define(
  'DriverDocument',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    // FK columns — no inline references
    driverId:     { type: DataTypes.UUID, allowNull: false },
    verifiedById: { type: DataTypes.UUID },

    documentType: {
      type: DataTypes.ENUM('LICENSE','PERMIT','INSURANCE','BACKGROUND_CHECK','MEDICAL_CERTIFICATE','TRAINING_CERTIFICATE','CONTRACT','ID_CARD','CERTIFICATION','OTHER'),
      allowNull: false,
    },
    documentNumber:  { type: DataTypes.STRING },
    issueDate:       { type: DataTypes.DATE },
    expiryDate:      { type: DataTypes.DATE },
    issuingAuthority:{ type: DataTypes.STRING },
    fileUrl:         { type: DataTypes.STRING },
    fileName:        { type: DataTypes.STRING },
    fileSize:        { type: DataTypes.INTEGER },
    mimeType:        { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM('PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    verifiedAt:   { type: DataTypes.DATE },
    notes:        { type: DataTypes.STRING },
    reminderSent: { type: DataTypes.BOOLEAN, defaultValue: false },
    reminderDate: { type: DataTypes.DATE },
  },
  {
    tableName: 'driver_documents',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['driver_id', 'document_type'] },
      { fields: ['expiry_date'] },
      { fields: ['status'] },
    ],
    hooks: {
      beforeSave: async (doc) => {
        if (doc.expiryDate && new Date() > doc.expiryDate) {
          doc.status = 'EXPIRED';
        }
      },
    },
  }
);

module.exports = DriverDocument;
