const jwt = require('jsonwebtoken');

function initNotificationNamespace(io) {
  const ns = io.of('/notifications');

  // Socket authentication middleware
  ns.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.user = decoded;
      next();
    });
  });

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
