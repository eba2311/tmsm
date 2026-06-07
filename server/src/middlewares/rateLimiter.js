const rateLimit = require('express-rate-limit');

// Default rate limiter for general API endpoints
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 1000, // relaxed in development
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiter for booking endpoints
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 50 : 1000, // relaxed in development
  message: { success: false, message: 'Too many booking attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { defaultLimiter, authLimiter, bookingLimiter };

