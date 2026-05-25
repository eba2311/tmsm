const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const supabase = require('../config/supabase');
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
    const { data: exists } = await supabase
      .from('users')
      .select('id')
      .eq('email', value.email.toLowerCase())
      .single();

    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(value.password, salt);

    // Create user
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert([{
        name: value.name,
        email: value.email.toLowerCase(),
        phone: value.phone,
        password: hashedPassword,
        role: value.role || 'PASSENGER',
        locale: value.locale || 'en'
      }])
      .select()
      .single();

    if (createError) throw createError;

    const { accessToken, refreshToken } = signTokens(user);

    // Save refresh token to user
    await supabase.from('users').update({ refresh_token: refreshToken }).eq('id', user.id);

    delete user.password;
    res.status(201).json({ success: true, data: { accessToken, refreshToken, user } });
  } catch (err) { next(err); }
});

// POST /api/v1/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', value.email.toLowerCase())
      .single();

    if (findError || !user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await bcrypt.compare(value.password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account deactivated' });

    const { accessToken, refreshToken } = signTokens(user);
    
    // Update last login and refresh token
    await supabase.from('users').update({ 
      refresh_token: refreshToken,
      last_login: new Date().toISOString()
    }).eq('id', user.id);

    delete user.password;
    res.json({ success: true, data: { accessToken, refreshToken, user } });
  } catch (err) { next(err); }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.sub)
      .single();

    if (error || !user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = signTokens(user);
    
    await supabase.from('users').update({ refresh_token: tokens.refreshToken }).eq('id', user.id);

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
    await supabase.from('users').update({ refresh_token: null }).eq('id', req.user.id);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

// POST /api/v1/auth/forgot
router.post('/forgot', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) return res.status(200).json({ success: true, message: 'If the email exists, a reset link was sent' });

    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    
    await supabase.from('users').update({
      password_reset_token: token,
      password_reset_expires: new Date(Date.now() + 1000 * 60 * 60).toISOString() // 1 hour
    }).eq('id', user.id);

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
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_reset_token, password_reset_expires')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user || user.password_reset_token !== token || new Date() > new Date(user.password_reset_expires)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await supabase.from('users').update({
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null
    }).eq('id', user.id);

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) { next(err); }
});

module.exports = router;
