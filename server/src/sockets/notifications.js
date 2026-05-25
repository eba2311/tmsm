function initNotificationNamespace(io) {
  const ns = io.of('/notifications');

  ns.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`[notifications] user ${userId} connected`);
    }

    socket.on('disconnect', () => {
      console.log('[notifications] client disconnected:', socket.id);
    });
  });

  // Helper to push notification to a specific user
  ns.sendToUser = (userId, notification) => {
    ns.to(`user:${userId}`).emit('notification', notification);
  };

  return ns;
}

module.exports = { initNotificationNamespace };
