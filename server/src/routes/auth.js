const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const User = require('../models/User');
const { authLimiter } = require('../middlewares/rateLimiter');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  rememberMe: Joi.boolean().optional(),
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[0-9]{9,15}$/).optional(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('PASSENGER', 'AGENT').default('PASSENGER'),
  locale: Joi.string().valid('en', 'am').default('en'),
});

const signTokens = (user) => {
  const payload = { sub: user.id, role: user.role, email: user.email };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { accessToken, refreshToken };
};

// POST /api/v1/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    // Check if email exists
    const exists = await User.findOne({ where: { email: value.email.toLowerCase() } });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    // Create user (password will be hashed by the model hook)
    const user = await User.create({
      name: value.name,
      email: value.email.toLowerCase(),
      phone: value.phone,
      password: value.password,
      role: value.role || 'PASSENGER',
      locale: value.locale || 'en',
      isActive: true
    });

    const { accessToken, refreshToken } = signTokens(user);

    // Save refresh token to user
    await user.update({ refreshToken });

    const userJson = user.toJSON();
    console.log('[REGISTER] Success for:', value.email.toLowerCase());
    res.status(201).json({ success: true, data: { accessToken, refreshToken, user: userJson } });
  } catch (err) {
    console.error('[REGISTER] Error:', err);
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const user = await User.findOne({ where: { email: value.email.toLowerCase() } });
    if (!user) {
      console.log('[LOGIN] User not found:', value.email.toLowerCase());
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await user.comparePassword(value.password);
    if (!valid) {
      console.log('[LOGIN] Invalid password for:', value.email.toLowerCase());
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      console.log('[LOGIN] Account deactivated:', value.email.toLowerCase());
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const { accessToken, refreshToken } = signTokens(user);
    
    // Update last login and refresh token
    await user.update({ 
      refreshToken,
      lastLogin: new Date()
    });

    const userJson = user.toJSON();
    console.log('[LOGIN] Success for:', value.email.toLowerCase());
    res.json({ success: true, data: { accessToken, refreshToken, user: userJson } });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    next(err);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findByPk(decoded.sub);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = signTokens(user);
    
    await user.update({ refreshToken: tokens.refreshToken });

    res.json({ success: true, data: tokens });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res) => {
  // Assuming req.user is populated by authenticate middleware
  res.json({ success: true, data: req.user });
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await User.update({ refreshToken: null }, { where: { id: req.user.id } });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

// POST /api/v1/auth/forgot
router.post('/forgot', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(200).json({ success: true, message: 'If the email exists, a reset link was sent' });

    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    
    await user.update({
      passwordResetToken: token,
      passwordResetExpires: new Date(Date.now() + 1000 * 60 * 60) // 1 hour
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    logger.info(`[PASSWORD RESET] ${user.email} link=${resetLink}`);

    res.json({ success: true, message: 'If the email exists, a reset link was sent' });
  } catch (err) { next(err); }
});

// POST /api/v1/auth/reset
router.post('/reset', authLimiter, async (req, res, next) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
    
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase(),
        passwordResetToken: token
      }
    });

    if (!user || !user.passwordResetExpires || new Date() > new Date(user.passwordResetExpires)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Password will be hashed by the model hook
    await user.update({
      password: password,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) { next(err); }
});

module.exports = router;
