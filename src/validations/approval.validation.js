'use strict';

const { body } = require('express-validator');

/**
 * Validation for PATCH /rest/reimbursements
 */
const approveReimbursementSchema = [
  body('userId')
    .trim()
    .notEmpty().withMessage('userId is required')
    .isUUID(4).withMessage('userId must be a valid UUID v4'),

  body('status')
    .trim()
    .notEmpty().withMessage('status is required')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('status must be either APPROVED or REJECTED'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('remarks must not exceed 1000 characters'),
];

module.exports = { approveReimbursementSchema };
