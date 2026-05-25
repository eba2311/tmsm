const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
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
  const payload = { sub: user._id, role: user.role, email: user.email };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { accessToken, refreshToken };
};

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [PASSENGER, AGENT], default: PASSENGER }
 *     responses:
 *       201: { description: User registered successfully }
 *       400: { description: Validation error }
 */
// POST /api/v1/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const exists = await User.findOne({ email: value.email });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    const user = await User.create(value);
    const { accessToken, refreshToken } = signTokens(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({ success: true, data: { accessToken, refreshToken, user } });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login to the system
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
// POST /api/v1/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const user = await User.findOne({ email: value.email }).select('+password +refreshToken');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await user.comparePassword(value.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });

    const { accessToken, refreshToken } = signTokens(user);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, data: { accessToken, refreshToken, user } });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Tokens refreshed }
 *       401: { description: Invalid refresh token }
 */
// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.sub).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = signTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

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
  res.json({ success: true, data: req.user });
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

// POST /api/v1/auth/forgot — request password reset
router.post('/forgot', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetToken +passwordResetExpires');
    if (!user) return res.status(200).json({ success: true, message: 'If the email exists, a reset link was sent' });

    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save({ validateBeforeSave: false });

    // In production send email; for dev log the link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    logger.info(`[PASSWORD RESET] ${user.email} link=${resetLink}`);

    res.json({ success: true, message: 'If the email exists, a reset link was sent' });
  } catch (err) { next(err); }
});

// POST /api/v1/auth/reset — perform password reset
router.post('/reset', authLimiter, async (req, res, next) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetToken +passwordResetExpires');
    if (!user || user.passwordResetToken !== token || Date.now() > user.passwordResetExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) { next(err); }
});

module.exports = router;
