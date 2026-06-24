'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validations/auth.validation');

/**
 * Auth Routes
 * Base path: /api/v1/auth
 */

/** @route POST /api/v1/auth/register */
router.post(
  '/register',
  registerSchema,
  validate,
  authController.register
);

/** @route POST /api/v1/auth/login */
router.post(
  '/login',
  loginSchema,
  validate,
  authController.login
);

/** @route POST /api/v1/auth/logout – requires valid access token cookie */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/** @route POST /api/v1/auth/refresh – consumes refresh token cookie */
router.post(
  '/refresh',
  authController.refresh
);

/** @route GET /api/v1/auth/me – returns current user profile */
router.get(
  '/me',
  authenticate,
  authController.me
);

module.exports = router;
