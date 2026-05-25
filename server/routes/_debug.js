// Broadcast a system-wide notification
router.post('/broadcast-notification', async (req, res) => {
  try {
    const { title, message, type = 'SYSTEM' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'title and message are required' });
    }

    // Save the notification in the database
    const notification = await Notification.create({
      recipient: null, // System-wide notification
      title,
      message,
      type,
      data: req.body,
    });

    // Emit the notification to all connected clients
    const ns = req.app.locals.notificationsNs;
    if (ns) {
      ns.emit('notification:broadcast', notification);
    }

    return res.json({ success: true, data: notification });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});