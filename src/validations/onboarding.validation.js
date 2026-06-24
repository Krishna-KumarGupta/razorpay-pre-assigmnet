'use strict';

const { body } = require('express-validator');

/**
 * Validation chains for onboarding (registration / login) routes.
 *
 * Domain constraint:  Only @org.com email addresses are accepted.
 * This is enforced here at the input layer so the Service never receives
 * an invalid domain and can focus purely on business logic.
 */

// ── Shared field definitions ──────────────────────────────────────────────────

const emailField = body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Must be a valid email address')
  .normalizeEmail({ gmail_remove_dots: false })
  .custom((value) => {
    const domain = value.split('@')[1];
    if (domain !== 'org.com') {
      throw new Error('Only @org.com email addresses are permitted to register');
    }
    return true;
  });

const passwordField = body('password')
  .notEmpty().withMessage('Password is required')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
  .withMessage(
    'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&#)'
  );

// ── Schemas ───────────────────────────────────────────────────────────────────

/**
 * POST /rest/onboardings/register
 *
 * NOTE: `role` is intentionally NOT accepted here.
 * All registrations create EMP accounts only.
 * Role elevation requires POST /rest/roles/assign (CFO-gated).
 */
const registerSchema = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage(
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  emailField,

  passwordField,
];

/**
 * POST /rest/onboardings/login
 */
const loginSchema = [
  emailField,

  body('password')
    .notEmpty().withMessage('Password is required'),
];

module.exports = { registerSchema, loginSchema };
