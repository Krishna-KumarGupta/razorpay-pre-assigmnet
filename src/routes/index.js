'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

/**
 * Root API router – v1
 * Mounted at /api/v1 in app.js
 *
 * All feature routers are registered here. Add new feature routes below
 * without modifying app.js (Open/Closed Principle).
 */

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Razorpay Pre-Assignment API v1',
    version: '1.0.0',
    docs: '/api/v1/docs',
  });
});

// ── Feature Routers ───────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
