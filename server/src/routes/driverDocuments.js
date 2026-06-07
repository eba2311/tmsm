const express = require('express');
const { Op } = require('sequelize');
const Driver = require('../models/Driver');
const DriverDocument = require('../models/DriverDocument');
const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/driver-documents/drivers - Get drivers for dropdown
router.get('/drivers', async (req, res, next) => {
  try {
    const drivers = await Driver.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      attributes: ['id', 'licenseNumber', 'status'],
      where: { status: ['ACTIVE', 'ON_LEAVE'] },
      order: [[{ model: User, as: 'user' }, 'name', 'ASC']]
    });

    // Format for dropdown
    const formattedDrivers = drivers.map(driver => ({
      id: driver.id,
      name: driver.user?.name || 'Unknown Driver',
      licenseNumber: driver.licenseNumber,
      email: driver.user?.email,
      displayName: `${driver.user?.name || 'Unknown'} (${driver.licenseNumber || 'No License'})`
    }));

    res.json({ success: true, data: formattedDrivers });
  } catch (err) { 
    console.error('Error fetching drivers for documents:', err);
    next(err); 
  }
});

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

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/', authorize('SUPER_ADMIN', 'OPERATOR', 'AGENT'), upload.single('file'), async (req, res, next) => {
  try {
    console.log('Driver document creation request:', {
      body: req.body,
      file: req.file ? { filename: req.file.filename, size: req.file.size } : null
    });

    // Handle both 'driver' and 'driverId' fields from frontend
    let { driverId, driver, documentType, documentNumber, expiryDate, issuingAuthority, notes } = req.body;
    
    // If frontend sends 'driver' field, use it as driverId
    if (!driverId && driver) {
      driverId = driver;
    }

    if (typeof driverId === 'string') {
      driverId = driverId.trim();
    }

    // Validate driverId is not empty/null
    if (!driverId || driverId === 'null' || driverId === 'undefined' || driverId === '') {
      console.error('❌ Missing driverId:', { 
        original: req.body.driver || req.body.driverId, 
        bodyKeys: Object.keys(req.body) 
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Driver selection is required. Please select a driver from the dropdown.' 
      });
    }

    // Reject invalid UUIDs early to avoid Sequelize UUID parse failures
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(driverId)) {
      console.warn('⚠️ DriverId is not a UUID, attempting fallback lookup:', { driverId });
      const label = String(driverId || '').trim();
      const match = label.match(/^(.*?)\s*\(([^)]+)\)$/);
      let candidate;

      if (match) {
        const namePart = match[1].trim();
        const licensePart = match[2].trim();
        candidate = await Driver.findOne({
          where: { licenseNumber: licensePart },
          include: [{ model: User, as: 'user', attributes: ['name'] }]
        });
        if (!candidate && namePart) {
          candidate = await Driver.findOne({
            include: [{ model: User, as: 'user', attributes: ['name'], where: { name: namePart } }]
          });
        }
      }

      if (!candidate) {
        // allow lookup by raw driver label as license number if it matches exactly
        candidate = await Driver.findOne({
          where: { licenseNumber: label },
          include: [{ model: User, as: 'user', attributes: ['name'] }]
        });
      }

      if (candidate) {
        driverId = String(candidate.id);
        console.log('✅ Fallback driver resolved to UUID:', { driverId, name: candidate.user?.name, license: candidate.licenseNumber });
      } else {
        console.error('❌ Invalid driverId format and fallback failed:', { driverId });
        return res.status(400).json({
          success: false,
          message: 'Invalid driver selection. Please choose a driver from the list.'
        });
      }
    }

    if (!documentType || documentType === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: 'Document type is required' 
      });
    }

    // Verify the driver exists
    const driverRecord = await Driver.findByPk(driverId, {
      include: [{ model: User, as: 'user', attributes: ['name'] }]
    });
    
    if (!driverRecord) {
      console.error('❌ Driver not found:', { driverId });
      return res.status(404).json({ 
        success: false, 
        message: `Driver not found with ID: ${driverId}` 
      });
    }

    console.log('✅ Driver verified:', { id: driverRecord.id, name: driverRecord.user?.name });

    // Parse expiry date if provided
    let parsedExpiryDate = null;
    if (expiryDate && expiryDate !== 'null' && expiryDate !== '') {
      parsedExpiryDate = new Date(expiryDate);
      if (isNaN(parsedExpiryDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid expiry date format' 
        });
      }
    }

    // Prepare document data with explicit field mapping
    const documentData = {
      driverId: String(driverId), // Ensure it's a string UUID
      documentType: String(documentType),
      documentNumber: documentNumber && documentNumber !== 'null' ? String(documentNumber) : null,
      expiryDate: parsedExpiryDate,
      issuingAuthority: issuingAuthority && issuingAuthority !== 'null' ? String(issuingAuthority) : null,
      notes: notes && notes !== 'null' ? String(notes) : null,
      status: 'VERIFIED'
    };

    // Handle file upload
    if (req.file) {
      documentData.fileUrl = `/uploads/${req.file.filename}`;
      documentData.fileName = req.file.originalname;
      documentData.fileSize = req.file.size;
      documentData.mimeType = req.file.mimetype;
    }

    console.log('📄 Creating document with data:', {
      driverId: documentData.driverId,
      documentType: documentData.documentType,
      hasFile: !!req.file
    });

    const document = await DriverDocument.create(documentData);
    console.log('✅ Document created successfully:', document.id);
    
    // Fetch the created document with driver info
    const createdDocument = await DriverDocument.findByPk(document.id, {
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

    res.status(201).json({ 
      success: true, 
      data: createdDocument,
      message: 'Driver document uploaded successfully'
    });
  } catch (err) { 
    console.error('❌ Driver document creation error:', err.message);
    console.error('Error details:', err);
    
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error: ' + err.errors.map(e => e.message).join(', ')
      });
    }
    
    if (err.name === 'SequelizeDatabaseError' && err.message.includes('null value')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required field is missing. Please ensure all required fields are filled.'
      });
    }
    
    next(err); 
  }
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
