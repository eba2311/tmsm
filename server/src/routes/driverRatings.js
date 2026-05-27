const express = require('express');
const DriverRating = require('../models/DriverRating');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/driver-ratings
router.get('/', async (req, res, next) => {
  try {
    const { driverId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (driverId) where.driverId = driverId;

    const { count, rows: ratings } = await DriverRating.findAndCountAll({
      where,
      include: [
        {
          model: Driver,
          as: 'driver',
          include: [
            { model: User, as: 'user', attributes: ['name', 'email'] }
          ],
          attributes: ['id', 'licenseNumber', 'rating', 'status']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: ratings, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// POST /api/v1/driver-ratings
router.post('/', async (req, res, next) => {
  try {
    const { driverId, rating, comment } = req.body;
    if (!driverId || !rating) return res.status(400).json({ success: false, message: 'driverId and rating required' });

    const driver = await Driver.findByPk(driverId);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    // Create rating record
    const driverRating = await DriverRating.create({
      driverId,
      rating: parseFloat(rating),
      comment,
      passengerId: req.user.id
    });

    // Update driver's average rating
    const allRatings = await DriverRating.findAll({ where: { driverId } });
    const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    await driver.update({ rating: avgRating });

    res.status(201).json({ success: true, data: driverRating });
  } catch (err) { next(err); }
});

// GET /api/v1/driver-ratings/:driverId
router.get('/:driverId', async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.params.driverId, {
      include: [
        { model: User, as: 'user', attributes: ['name'] }
      ],
      attributes: ['id', 'rating']
    });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const ratings = await DriverRating.findAll({
      where: { driverId: req.params.driverId },
      include: [
        { model: User, as: 'passenger', attributes: ['name'] }
      ]
    });

    res.json({ success: true, data: { driver, averageRating: parseFloat(driver.rating) || 0, reviews: ratings } });
  } catch (err) { next(err); }
});

module.exports = router;
