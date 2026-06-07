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
      order: [['created_at', 'DESC']]
    });
    const unreadCount = await Notification.count({
      where: { recipientId: req.user.id, isRead: false }
    });
    res.json({ success: true, data: notifications, unreadCount, unread: unreadCount });
  } catch (err) { next(err); }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    
    await notification.update({ isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) { next(err); }
});

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
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
    const { type, title, message, userId, titleAm, messageAm, data, channel } = req.body;
    if (!type || !message) {
      return res.status(400).json({ success: false, message: 'type and message are required' });
    }

    const recipientId = userId || req.user.id;
    const notification = await Notification.create({
      type,
      title: title || type,
      titleAm: titleAm || null,
      message,
      messageAm: messageAm || null,
      recipientId,
      isRead: false,
      data: data || null,
      channel: channel || ['IN_APP'],
    });

    // Emit the notification to the recipient in real time if connected
    const notificationsNs = req.app.locals.notificationsNs;
    if (notificationsNs && typeof notificationsNs.sendToUser === 'function') {
      const payload = typeof notification.toJSON === 'function' ? notification.toJSON() : notification;
      notificationsNs.sendToUser(recipientId, payload);
    }

    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

module.exports = router;
