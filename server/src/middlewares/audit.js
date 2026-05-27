const supabase = require('../config/supabase');

const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log after response is sent
      setTimeout(async () => {
        try {
          const userId = req.user?.id;
          if (userId) {
            await supabase.from('audit_logs').insert([{
              user_id: userId,
              action: action,
              entity: resource,
              entity_id: req.params.id || req.body.id || null,
              details: {
                method: req.method,
                path: req.path,
                body: req.body,
                params: req.params,
                query: req.query,
                success: res.statusCode < 400,
                errorMessage: res.statusCode >= 400 ? data : undefined,
                userAgent: req.get('user-agent'),
              },
              ip_address: req.ip,
            }]);
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
