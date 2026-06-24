'use strict';

const express = require('express');

const onboardingController = require('../controllers/onboarding.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validations/onboarding.validation');

const router = express.Router();

/**
 * Onboarding Routes
 * Base path: /rest/onboardings   (mounted in src/routes/rest.js)
 *
 * These three endpoints form the complete public-facing auth surface.
 * No RBAC is applied here – authorization gates are added in feature routers.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Method │ Path       │ Auth required │ Description                │
 * ├────────┼────────────┼───────────────┼────────────────────────────┤
 * │ POST   │ /register  │ ✗             │ Create a new account       │
 * │ POST   │ /login     │ ✗             │ Issue JWT cookies           │
 * │ POST   │ /logout    │ ✓ (cookie)    │ Invalidate session         │
 * └──────────────────────────────────────────────────────────────────┘
 */

// ── Public routes ─────────────────────────────────────────────────────────────

/**
 * @route   POST /rest/onboardings/register
 * @desc    Register a new org.com user
 * @access  Public
 * @body    { name, email, password, role? }
 */
router.post(
  '/register',
  registerSchema,       // input validation chains
  validate,             // collect errors → 422
  onboardingController.register
);

/**
 * @route   POST /rest/onboardings/login
 * @desc    Authenticate and receive HttpOnly JWT cookies
 * @access  Public
 * @body    { email, password }
 */
router.post(
  '/login',
  loginSchema,
  validate,
  onboardingController.login
);

// ── Protected routes ──────────────────────────────────────────────────────────

/**
 * @route   POST /rest/onboardings/logout
 * @desc    Invalidate server session and clear cookies
 * @access  Private (requires access_token cookie)
 */
router.post(
  '/logout',
  authenticate,          // verifies JWT from HttpOnly cookie, attaches req.user
  onboardingController.logout
);

module.exports = router;
