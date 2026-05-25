const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const filter = { recipient: req.user._id };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    const skip = (page - 1) * limit;
    const [notifications, total, unread] = await Promise.all([
      Notification.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);
    res.json({
      success: true,
      data: notifications,
      unread,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) { next(err); }
});

// Must be before /:id/read — otherwise "read-all" is captured as :id
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const n = await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() }, { new: true });
    res.json({ success: true, data: n });
  } catch (err) { next(err); }
});

module.exports = router;
