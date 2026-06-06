const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`[${req.method}] ${req.url} — ${err.message}`);

  // Joi validation error (if using Joi)
  if (err.isJoi) {
    return res.status(400).json({ success: false, message: err.details[0].message });
  }

  // Postgres duplicate key
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: err.details || err.message || 'Record already exists',
    });
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500
      ? (process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message)
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
