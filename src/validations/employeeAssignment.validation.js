'use strict';

const { body } = require('express-validator');

/**
 * Validation chains for employee assignment routes.
 *
 * Data-shape validation only.
 * Role checks (EMP / RM existence) live in EmployeeAssignmentService.
 * Authorization (CFO-only) is enforced by requireCFO middleware in the router.
 */

/**
 * POST /rest/employees/assign
 * Body: { employeeId, managerId }
 */
const assignEmployeeSchema = [
  body('employeeId')
    .trim()
    .notEmpty().withMessage('employeeId is required')
    .isUUID(4).withMessage('employeeId must be a valid UUID v4'),

  body('managerId')
    .trim()
    .notEmpty().withMessage('managerId is required')
    .isUUID(4).withMessage('managerId must be a valid UUID v4')
    .custom((value, { req }) => {
      if (value === req.body.employeeId) {
        throw new Error('employeeId and managerId must be different users');
      }
      return true;
    }),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('remarks must not exceed 500 characters'),
];

/**
 * DELETE /rest/employees/assign
 * Body: { employeeId }
 */
const removeEmployeeSchema = [
  body('employeeId')
    .trim()
    .notEmpty().withMessage('employeeId is required')
    .isUUID(4).withMessage('employeeId must be a valid UUID v4'),
];

module.exports = { assignEmployeeSchema, removeEmployeeSchema };
