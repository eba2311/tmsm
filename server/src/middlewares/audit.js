const AuditLog = require('../models/AuditLog');

const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log after response is sent
      setTimeout(async () => {
        try {
          const userId = req.user?._id;
          if (userId) {
            await AuditLog.create({
              userId,
              action,
              resource,
              resourceId: req.params.id || req.body._id,
              details: {
                method: req.method,
                path: req.path,
                body: req.body,
                params: req.params,
                query: req.query,
              },
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
              success: res.statusCode < 400,
              errorMessage: res.statusCode >= 400 ? data : undefined,
            });
          }
        } catch (error) {
          console.error('Audit log error:', error);
        }
      }, 0);
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = auditMiddleware;
