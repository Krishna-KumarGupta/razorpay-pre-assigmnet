'use strict';

const { body } = require('express-validator');

/**
 * Validation chains for reimbursement routes.
 */

/**
 * POST /rest/reimbursements
 *
 * Required fields (per spec): title, description, amount
 * Optional extras accepted by the model: category, expenseDate, employeeRemarks
 *
 * Role check (EMP only) is enforced by authorize('EMP') middleware in the router.
 */
const createReimbursementSchema = [
  body('title')
    .trim()
    .notEmpty().withMessage('title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('title must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('description must not exceed 2000 characters'),

  body('amount')
    .notEmpty().withMessage('amount is required')
    .isFloat({ gt: 0 })
    .withMessage('amount must be a positive number greater than 0')
    .toFloat(),

  body('category')
    .optional()
    .isIn(['TRAVEL', 'ACCOMMODATION', 'FOOD', 'OFFICE_SUPPLIES', 'COMMUNICATION', 'TRAINING', 'MEDICAL', 'OTHER'])
    .withMessage('category must be one of: TRAVEL, ACCOMMODATION, FOOD, OFFICE_SUPPLIES, COMMUNICATION, TRAINING, MEDICAL, OTHER'),

  body('expenseDate')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('expenseDate must be a valid date in YYYY-MM-DD format'),

  body('employeeRemarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('employeeRemarks must not exceed 1000 characters'),
];

module.exports = { createReimbursementSchema };
