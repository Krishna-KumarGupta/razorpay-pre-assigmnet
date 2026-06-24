'use strict';

const { body, param, query } = require('express-validator');

/**
 * Validation chains for user management routes.
 */

/** PATCH /api/v1/users/:id */
const updateUserSchema = [
  param('id')
    .isUUID(4).withMessage('User ID must be a valid UUID v4'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
];

/** GET /api/v1/users */
const listUsersSchema = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Role must be "user" or "admin"'),

  query('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean')
    .toBoolean(),
];

/** PATCH /api/v1/users/:id/change-password */
const changePasswordSchema = [
  param('id')
    .isUUID(4).withMessage('User ID must be a valid UUID v4'),

  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
    .withMessage('New password must contain uppercase, lowercase, number, and special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
];

module.exports = { updateUserSchema, listUsersSchema, changePasswordSchema };
