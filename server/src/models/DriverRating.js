const mongoose = require('mongoose');

const driverRatingSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  categories: {
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
    vehicleCondition: {
      type: Number,
      min: 1,
      max: 5,
    },
    drivingSkill: {
      type: Number,
      min: 1,
      max: 5,
    },
    customerService: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  comment: {
    type: String,
    maxlength: 500,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  response: {
    type: String,
    maxlength: 500,
  },
  respondedAt: {
    type: Date,
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
driverRatingSchema.index({ driver: 1, createdAt: -1 });
driverRatingSchema.index({ booking: 1 });
driverRatingSchema.index({ passenger: 1 });
driverRatingSchema.index({ rating: -1 });

// Virtual for calculating average of categories
driverRatingSchema.virtual('categoryAverage').get(function() {
  const categories = Object.values(this.categories).filter(v => v !== undefined);
  if (categories.length === 0) return null;
  return categories.reduce((sum, val) => sum + val, 0) / categories.length;
});

module.exports = mongoose.model('DriverRating', driverRatingSchema);
