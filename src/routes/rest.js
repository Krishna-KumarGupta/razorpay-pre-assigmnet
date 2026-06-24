'use strict';

const express = require('express');

const onboardingRoutes = require('./onboarding.routes');
const roleRoutes = require('./role.routes');

const router = express.Router();

/**
 * REST API router
 * Mounted at /rest in app.js
 *
 * Follows the Open/Closed Principle: new feature routers are registered here
 * without touching app.js.
 *
 * Namespace       │ Router file
 * ────────────────┼────────────────────────
 * /onboardings    │ onboarding.routes.js
 * /roles          │ role.routes.js
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

module.exports = router;
