'use strict';

const express = require('express');

const reimbursementController = require('../controllers/reimbursement.controller');
const approvalController = require('../controllers/approval.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createReimbursementSchema } = require('../validations/reimbursement.validation');
const { approveReimbursementSchema } = require('../validations/approval.validation');

const router = express.Router();

/**
 * Reimbursement Routes
 * Base path: /rest/reimbursements   (mounted in src/routes/rest.js)
 *
 * RBAC matrix:
 * ┌──────────────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Path              │ Middleware chain                    │ Who           │
 * ├────────┼───────────────────┼────────────────────────────────────┼───────────────┤
 * │ POST   │ /                 │ authenticate → authorize(EMP)       │ EMP only      │
 * │ PATCH  │ /:id/approve      │ authenticate → authorize(RM,APE,CFO)│ RM | APE | CFO│
 * │ GET    │ /:id/history      │ authenticate → authorize(RM,APE,CFO)│ RM | APE | CFO│
 * └────────┴───────────────────┴────────────────────────────────────┴───────────────┘
 */

// ── EMP: Submit a new claim ────────────────────────────────────────────────────

/**
 * @route   POST /rest/reimbursements
 * @desc    Submit a new reimbursement claim
 * @access  Private – EMP only
 * @body    { title, description?, amount, category?, expenseDate?, employeeRemarks? }
 */
router.post(
  '/',
  authenticate,
  authorize('EMP'),
  createReimbursementSchema,
  validate,
  reimbursementController.create
);

// ── RM | APE | CFO: Approval actions ──────────────────────────────────────────

/**
 * @route   PATCH /rest/reimbursements/:id/approve
 * @desc    Approve or reject a reimbursement claim
 * @access  Private – RM | APE | CFO
 * @body    { action: 'APPROVED' | 'REJECTED', remarks?: string }
 *
 * State machine (enforced in ApprovalService):
 *
 *   PENDING ──[RM APPROVED]──► RM_APPROVED ──[APE APPROVED]──► APE_APPROVED ──[CFO APPROVED]──► CFO_APPROVED
 *            └─[RM REJECTED]──► RM_REJECTED (terminal)
 *                               └─[APE REJECTED]──► APE_REJECTED (terminal)
 *                                                    └─[CFO REJECTED]──► CFO_REJECTED (terminal)
 *
 * Final APPROVED = RM_APPROVED → APE_APPROVED → CFO_APPROVED
 * Any REJECTED at any level = immediately terminal
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize('RM', 'APE', 'CFO'),
  approveReimbursementSchema,
  validate,
  approvalController.approve
);

/**
 * @route   GET /rest/reimbursements/:id/history
 * @desc    Fetch the complete approval audit trail for a reimbursement
 * @access  Private – RM | APE | CFO
 */
router.get(
  '/:id/history',
  authenticate,
  authorize('RM', 'APE', 'CFO'),
  approvalController.getHistory
);

module.exports = router;
