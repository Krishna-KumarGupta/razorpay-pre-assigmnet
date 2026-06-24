'use strict';

const express = require('express');

const reimbursementController = require('../controllers/reimbursement.controller');
const reimbursementListController = require('../controllers/reimbursementList.controller');
const approvalController = require('../controllers/approval.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const { createReimbursementSchema } = require('../validations/reimbursement.validation');
const { approveReimbursementSchema } = require('../validations/approval.validation');

const router = express.Router();

/**
 * Reimbursement Routes
 * Base path: /rest/reimbursements   (mounted in src/routes/rest.js)
 *
 * RBAC matrix:
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Path              │ Middleware chain                    │ Who           │
 * ├────────┼───────────────────┼────────────────────────────────────┼───────────────┤
 * │ POST   │ /                 │ authenticate → authorize(EMP)       │ EMP only      │
 * │ GET    │ /                 │ authenticate                        │ All roles     │
 * │ PATCH  │ /:id/approve      │ authenticate → authorize(RM,APE,CFO)│ RM | APE | CFO│
 * │ GET    │ /:id/history      │ authenticate → authorize(RM,APE,CFO)│ RM | APE | CFO│
 * │ GET    │ /:userId          │ authenticate → authorize(RM)        │ RM only       │
 * └────────┴───────────────────┴────────────────────────────────────┴───────────────┘
 *
 * Visibility rules enforced in ReimbursementListService (not middleware):
 *  EMP  → own claims (any status)
 *  RM   → PENDING claims from active direct reports only
 *  APE  → claims with status RM_APPROVED (awaiting APE action)
 *  CFO  → claims with status APE_APPROVED (awaiting CFO final approval)
 *
 * Route ordering is deliberate:
 *  1. POST /             – exact-path write, resolved first
 *  2. GET /              – exact-path read, never conflicts with /:userId
 *  3. PATCH /:id/approve – two-segment path; Express resolves this BEFORE single-segment /:userId
 *  4. GET /:id/history   – two-segment path; same reasoning as above
 *  5. GET /:userId       – single-segment catch; placed LAST so it cannot shadow steps 3–4
 */

// ── EMP: Submit a new claim ────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  authorize('EMP'),
  createReimbursementSchema,
  validate,
  reimbursementController.create
);

// ── GET: Role-scoped listing (Prompt 10) ─────────────────────────────────────

/**
 * @route   GET /rest/reimbursements
 * @desc    Role-scoped reimbursement listing
 * @access  Private – all authenticated roles
 * @query   page (default 1), limit (default 50, max 100)
 *
 * Visibility policy (enforced in ReimbursementListService):
 *  EMP → own claims, any status
 *  RM  → PENDING claims from active direct reports (FIFO order)
 *  APE → claims with status RM_APPROVED (awaiting APE action)
 *  CFO → claims with status APE_APPROVED (awaiting CFO final approval)
 */
router.get(
  '/',
  authenticate,
  reimbursementListController.list
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
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize('RM', 'APE', 'CFO'),
  [param('id').isUUID(4).withMessage('id must be a valid UUID v4')],
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
  [param('id').isUUID(4).withMessage('id must be a valid UUID v4')],
  validate,
  approvalController.getHistory
);

// ── RM: Reimbursements for a specific direct report (Prompt 10) ───────────────

/**
 * @route   GET /rest/reimbursements/:userId
 * @desc    All reimbursements for a specific employee
 * @access  Private – RM only; target must be an active direct report
 * @query   page (default 1), limit (default 50, max 100)
 *
 * NOTE: This route is intentionally placed AFTER the two-segment routes
 * (/:id/approve and /:id/history) so Express resolves them first.
 * A request to /some-uuid/history will never be caught here.
 */
router.get(
  '/:userId',
  authenticate,
  authorize('RM'),
  [param('userId').isUUID(4).withMessage('userId must be a valid UUID v4')],
  validate,
  reimbursementListController.listByEmployee
);

module.exports = router;
