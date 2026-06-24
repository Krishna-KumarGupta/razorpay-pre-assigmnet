'use strict';

const { body } = require('express-validator');

/**
 * Validation chains for role management routes.
 */

/**
 * POST /rest/roles/assign
 *
 * Validates that:
 *  - userId is a non-empty UUID v4 string.
 *  - role is one of the four allowed system roles.
 *
 * Domain rule (who *can* assign) is enforced by the requireCFO middleware,
 * not here.  Validation only concerns data shape and allowed values.
 */
const assignRoleSchema = [
  body('userId')
    .trim()
    .notEmpty().withMessage('userId is required')
    .isUUID(4).withMessage('userId must be a valid UUID v4'),

  body('role')
    .trim()
    .notEmpty().withMessage('role is required')
    .isIn(['EMP', 'RM', 'APE', 'CFO'])
    .withMessage('role must be one of: EMP, RM, APE, CFO'),
];

module.exports = { assignRoleSchema };
