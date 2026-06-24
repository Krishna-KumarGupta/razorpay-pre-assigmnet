'use strict';

const { body } = require('express-validator');

/**
 * Validation for PATCH /rest/reimbursements/:id/approve
 *
 * Data-shape only. Role guards (RM | APE | CFO) enforced by middleware.
 */
const approveReimbursementSchema = [
  body('action')
    .trim()
    .notEmpty().withMessage('action is required')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('action must be either APPROVED or REJECTED'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('remarks must not exceed 1000 characters'),
];

module.exports = { approveReimbursementSchema };
