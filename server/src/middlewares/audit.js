const AuditLog = require('../models/AuditLog');

const resolveAction = (method) => {
  switch (method?.toUpperCase()) {
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    case 'GET': return 'VIEW';
    default: return 'ACCESS';
  }
};

const resolveResource = (path) => {
  if (!path) return 'UNKNOWN';
  const parts = path.replace(/^\//, '').split('/');
  if (parts.length === 0 || !parts[0]) return 'UNKNOWN';
  return parts[0].toUpperCase().replace(/-/g, '_');
};

const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const resolvedAction = action || resolveAction(req.method);
    const resolvedResource = resource || resolveResource(req.baseUrl || req.path);

    res.send = function(data) {
      // Log after response is sent
      setTimeout(async () => {
        try {
          const userId = req.user?.id;
          if (!userId || req.baseUrl?.includes('/audit-logs')) {
            return;
          }

          const errorMessage = res.statusCode >= 400
            ? (typeof data === 'string' ? data : JSON.stringify(data))
            : undefined;

          await AuditLog.create({
            userId,
            action: resolvedAction,
            resource: resolvedResource,
            resourceId: req.params.id || req.body.id || null,
            details: {
              method: req.method,
              path: req.baseUrl || req.path,
              body: req.body,
              params: req.params,
              query: req.query,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            success: res.statusCode < 400,
            errorMessage,
          });
        } catch (error) {
          console.error('Audit log error:', error);
        }
      }, 0);

      return originalSend.call(this, data);
    };

    next();
  };
};

module.exports = auditMiddleware;
