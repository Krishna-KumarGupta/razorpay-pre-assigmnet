'use strict';

const { body } = require('express-validator');

/**
 * Validation chains for authentication routes.
 * Used alongside the `validate` middleware to enforce input rules before
 * requests reach the controller.
 */

/**
 * POST /api/v1/auth/register
 */
const registerSchema = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),

  body('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Role must be either "user" or "admin"'),
];

/**
 * POST /api/v1/auth/login
 */
const loginSchema = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

module.exports = { registerSchema, loginSchema };
