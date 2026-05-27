// src/routes/passengers.js
const express = require('express');
const Joi = require('joi');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// Validation schema for passenger creation/updating
const passengerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().pattern(/^\+?[0-9]{9,15}$/).optional().allow('', null),
  locale: Joi.string().valid('en', 'am').optional().default('en')
}).unknown(true);

// GET /api/v1/passengers
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    let query = supabase.from('users').select('id, name, email, phone, locale, role, is_active', { count: 'exact' });
    // Only return passengers (role = PASSENGER) unless an admin requests all
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'OPERATOR') {
      query = query.eq('role', 'PASSENGER');
    }
    if (search) query = query.ilike('name', `%${search}%`);
    const skip = (page - 1) * limit;
    query = query.range(skip, skip + limit - 1).order('created_at', { ascending: false });
    const { data: passengers, count, error } = await query;
    if (error) throw error;
    const formatted = (passengers || []).map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      locale: p.locale,
      role: p.role,
      isActive: p.is_active,
      createdAt: p.created_at
    }));
    res.json({ success: true, data: formatted, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

// GET /api/v1/passengers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data: passenger, error } = await supabase.from('users')
      .select('id, name, email, phone, locale, role, is_active, created_at')
      .eq('id', req.params.id)
      .single();
    if (error || !passenger) return res.status(404).json({ success: false, message: 'Passenger not found' });
    if (passenger.role !== 'PASSENGER' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'OPERATOR') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const formatted = {
      _id: passenger.id,
      name: passenger.name,
      email: passenger.email,
      phone: passenger.phone,
      locale: passenger.locale,
      role: passenger.role,
      isActive: passenger.is_active,
      createdAt: passenger.created_at
    };
    res.json({ success: true, data: formatted });
  } catch (err) { next(err); }
});

// POST /api/v1/passengers
router.post('/', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { error, value } = passengerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    let passengerEmail = value.email;
    if (!passengerEmail) {
      passengerEmail = `passenger_${Date.now()}@tmsm.local`;
    }

    // Ensure email uniqueness
    const { data: exists } = await supabase.from('users').select('id').eq('email', passengerEmail.toLowerCase()).maybeSingle();
    
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });
    
    // Insert passenger with role PASSENGER
    const { data: passenger, error: insertErr } = await supabase.from('users')
      .insert([{
        name: value.name,
        email: passengerEmail.toLowerCase(),
        phone: value.phone || null,
        locale: value.locale,
        role: 'PASSENGER',
        is_active: true
      }])
      .select()
      .single();
      
    if (insertErr) throw insertErr;
    
    const formatted = {
      _id: passenger.id,
      name: passenger.name,
      email: passenger.email,
      phone: passenger.phone,
      locale: passenger.locale,
      role: passenger.role,
      isActive: passenger.is_active,
      createdAt: passenger.created_at
    };
    res.status(201).json({ success: true, data: formatted });
  } catch (err) { next(err); }
});

// PUT /api/v1/passengers/:id
router.put('/:id', authorize('SUPER_ADMIN', 'OPERATOR'), async (req, res, next) => {
  try {
    const { error, value } = passengerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const updateData = {
      name: value.name,
      phone: value.phone || null,
      locale: value.locale
    };
    if (value.email) {
      updateData.email = value.email.toLowerCase();
    }

    const { data: passenger, error: updateErr } = await supabase.from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
      
    if (updateErr) throw updateErr;
    
    const formatted = {
      _id: passenger.id,
      name: passenger.name,
      email: passenger.email,
      phone: passenger.phone,
      locale: passenger.locale,
      role: passenger.role,
      isActive: passenger.is_active,
      createdAt: passenger.created_at
    };
    res.json({ success: true, data: formatted });
  } catch (err) { next(err); }
});

// DELETE /api/v1/passengers/:id
router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Passenger deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
