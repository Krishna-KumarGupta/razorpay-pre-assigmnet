'use strict';

const express = require('express');

const onboardingRoutes = require('./onboarding.routes');
const roleRoutes = require('./role.routes');
const employeeRoutes = require('./employee.routes');

const router = express.Router();

/**
 * REST API router
 * Mounted at /rest in app.js
 *
 * Open/Closed Principle: add new feature routers here without touching app.js.
 *
 * Namespace       │ Router file               │ Description
 * ────────────────┼───────────────────────────┼──────────────────────────────
 * /onboardings    │ onboarding.routes.js       │ Register / Login / Logout
 * /roles          │ role.routes.js             │ CFO: assign user roles
 * /employees      │ employee.routes.js         │ CFO: assign/remove EMP→RM
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Razorpay Pre-Assignment REST API',
    version: '1.0.0',
  });
});

router.use('/onboardings', onboardingRoutes);
router.use('/roles', roleRoutes);
router.use('/employees', employeeRoutes);

module.exports = router;
