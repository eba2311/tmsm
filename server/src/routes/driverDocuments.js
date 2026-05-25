const express = require('express');
const router = express.Router();
const DriverDocument = require('../models/DriverDocument');
const Driver = require('../models/Driver');
const { authenticate, authorize } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/compliance';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `doc-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only images and PDFs allowed'));
  },
});

// Get all driver documents
router.get('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { driver, documentType, status, expiringSoon } = req.query;

    const query = {};
    if (driver) query.driver = driver;
    if (documentType) query.documentType = documentType;
    if (status) query.status = status;

    if (expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query.expiryDate = {
        $gte: new Date(),
        $lte: thirtyDaysFromNow,
      };
    }

    const documents = await DriverDocument.find(query)
      .populate('driver', 'user licenseNumber')
      .populate('verifiedBy', 'name email')
      .sort({ expiryDate: 1 })
      .lean();

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) { next(error); }
});

// Get documents for a specific driver
router.get('/driver/:driverId', authenticate, async (req, res, next) => {
  try {
    const documents = await DriverDocument.find({ driver: req.params.driverId })
      .populate('verifiedBy', 'name email')
      .sort({ documentType: 1 })
      .lean();

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) { next(error); }
});

// Get document by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const document = await DriverDocument.findById(req.params.id)
      .populate('driver', 'user licenseNumber')
      .populate('verifiedBy', 'name email')
      .lean();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) { next(error); }
});

// Create new document
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), upload.single('file'), async (req, res, next) => {
  try {
    const { driver, documentType, documentNumber, issueDate, expiryDate, issuingAuthority, notes } = req.body;

    // Validate driver exists
    const driverDoc = await Driver.findById(driver);
    if (!driverDoc) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const document = await DriverDocument.create({
      driver,
      documentType,
      documentNumber,
      issueDate,
      expiryDate,
      issuingAuthority,
      fileUrl: req.file ? `/uploads/compliance/${req.file.filename}` : undefined,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype,
      notes,
    });

    const populatedDocument = await DriverDocument.findById(document._id)
      .populate('driver', 'user licenseNumber')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedDocument,
    });
  } catch (error) { next(error); }
});

// Update document
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const document = await DriverDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const updatedDocument = await DriverDocument.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('driver', 'user licenseNumber')
      .populate('verifiedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) { next(error); }
});

// Verify document
router.patch('/:id/verify', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const document = await DriverDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    document.status = 'VERIFIED';
    document.verifiedBy = req.user._id;
    document.verifiedAt = new Date();
    await document.save();

    const updatedDocument = await DriverDocument.findById(document._id)
      .populate('driver', 'user licenseNumber')
      .populate('verifiedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) { next(error); }
});

// Reject document
router.patch('/:id/reject', authenticate, authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { notes } = req.body;
    const document = await DriverDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    document.status = 'REJECTED';
    document.notes = notes;
    await document.save();

    const updatedDocument = await DriverDocument.findById(document._id)
      .populate('driver', 'user licenseNumber')
      .populate('verifiedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) { next(error); }
});

// Delete document
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const document = await DriverDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    await DriverDocument.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) { next(error); }
});

module.exports = router;
