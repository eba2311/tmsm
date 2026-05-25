const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['PHYSICAL_TICKET', 'DIGITAL_TICKET', 'MONTHLY_PASS'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'SOLD', 'RESERVED', 'EXPIRED'],
    default: 'AVAILABLE',
  },
  expiryDate: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

inventorySchema.index({ type: 1, status: 1 });
inventorySchema.index({ route: 1 });
inventorySchema.index({ vehicle: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
