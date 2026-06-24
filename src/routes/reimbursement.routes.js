'use strict';

const express = require('express');

const reimbursementController = require('../controllers/reimbursement.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createReimbursementSchema } = require('../validations/reimbursement.validation');

const router = express.Router();

/**
 * Reimbursement Routes
 * Base path: /rest/reimbursements   (mounted in src/routes/rest.js)
 *
 * RBAC matrix:
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Path │ Middleware chain                           │ Who             │
 * ├────────┼──────┼───────────────────────────────────────────┼─────────────────┤
 * │ POST   │ /    │ authenticate → authorize(EMP) → validate   │ EMP only        │
 * └────────┴──────┴───────────────────────────────────────────┴─────────────────┘
 *
 * Middleware execution order:
 *  1. authenticate           – JWT cookie → req.user
 *  2. authorize('EMP')       – rejects non-EMP with 403 Forbidden
 *  3. createReimbursementSchema – express-validator chains
 *  4. validate               – collect errors → 422 ValidationError
 *  5. reimbursementController.create
 *
 * Future routes (approve, reject, list) will be added here following the
 * same pattern without modifying rest.js.
 */

/**
 * @route   POST /rest/reimbursements
 * @desc    Submit a new reimbursement claim (EMP only)
 * @access  Private – EMP
 * @body    {
 *            title:            string  (required, 3–200 chars)
 *            description:      string  (optional)
 *            amount:           number  (required, > 0)
 *            category:         string  (optional, defaults to OTHER)
 *            expenseDate:      string  (optional YYYY-MM-DD, defaults to today)
 *            employeeRemarks:  string  (optional)
 *          }
 */
router.post(
  '/',
  authenticate,           // Step 1: verify JWT cookie → req.user
  authorize('EMP'),       // Step 2: RBAC gate – EMP only
  createReimbursementSchema,  // Step 3: input validation
  validate,               // Step 4: collect errors → 422
  reimbursementController.create  // Step 5: delegate to service
);

module.exports = router;
