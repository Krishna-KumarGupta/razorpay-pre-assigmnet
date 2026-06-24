'use strict';

const express = require('express');

const onboardingRoutes = require('./onboarding.routes');

const router = express.Router();

/**
 * REST API router
 * Mounted at /rest in app.js
 *
 * Follows the same Open/Closed pattern as the /api/v1 router:
 * new feature routers are added here without touching app.js.
 *
 * Namespace  │ Router file
 * ───────────┼─────────────────────────
 * /onboardings │ onboarding.routes.js
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Razorpay Pre-Assignment REST API',
    version: '1.0.0',
  });
});

router.use('/onboardings', onboardingRoutes);

module.exports = router;
