const express = require('express');
const Driver = require('../models/Driver');
const DriverDocument = require('../models/DriverDocument');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/driver-documents
router.get('/', async (req, res, next) => {
  try {
    const { driverId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (driverId) where.driverId = driverId;

    const { count, rows: documents } = await DriverDocument.findAndCountAll({
      where,
      include: [
        {
          model: Driver,
          as: 'driver',
          include: [
            { model: User, as: 'user', attributes: ['name', 'email'] }
          ],
          attributes: ['id', 'licenseNumber', 'licenseClass', 'licenseExpiry', 'status']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data: documents, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const document = await DriverDocument.findByPk(req.params.id, {
      include: [
        {
          model: Driver,
          as: 'driver',
          include: [
            { model: User, as: 'user', attributes: ['name', 'email'] }
          ]
        }
      ]
    });
    if (!document) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: document });
  } catch (err) { next(err); }
});

router.post('/', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const document = await DriverDocument.create({
      ...req.body,
      status: 'VALID'
    });
    res.status(201).json({ success: true, data: document });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const document = await DriverDocument.findByPk(req.params.id);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    await document.update(req.body);
    res.json({ success: true, data: document });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const document = await DriverDocument.findByPk(req.params.id);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    await document.destroy();
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
