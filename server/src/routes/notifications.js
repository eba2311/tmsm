const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/notifications
router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipientId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    const unreadCount = await Notification.count({
      where: { recipientId: req.user.id, isRead: false }
    });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) { next(err); }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    
    await notification.update({ isRead: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) { next(err); }
});

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { recipientId: req.user.id, isRead: false } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/notifications/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    
    await notification.destroy();
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
});

// POST /api/v1/notifications – create a notification
router.post('/', async (req, res, next) => {
  try {
    const { type, title, message, userId } = req.body;
    if (!type || !message) {
      return res.status(400).json({ success: false, message: 'type and message are required' });
    }
    const notification = await Notification.create({
      type,
      title: title || '',
      message,
      recipientId: userId || req.user.id,
      isRead: false
    });
    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

module.exports = router;
