'use strict';

const express = require('express');

const employeeAssignmentController = require('../controllers/employeeAssignment.controller');
const { authenticate, requireCFO } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  assignEmployeeSchema,
  removeEmployeeSchema,
} = require('../validations/employeeAssignment.validation');

const router = express.Router();

/**
 * Employee Assignment Routes
 * Base path: /rest/employees   (mounted in src/routes/rest.js)
 *
 * RBAC matrix:
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Path     │ Middleware chain                           │ Who         │
 * ├────────┼──────────┼───────────────────────────────────────────┼─────────────┤
 * │ POST   │ /assign  │ authenticate → requireCFO → validate       │ CFO only    │
 * │ DELETE │ /assign  │ authenticate → requireCFO → validate       │ CFO only    │
 * └────────┴──────────┴───────────────────────────────────────────┴─────────────┘
 *
 * Middleware execution order (left → right):
 *  1. authenticate              – JWT cookie → req.user
 *  2. requireCFO                – RBAC gate; rejects non-CFO with 403
 *  3. assignEmployee/removeEmployee Schema – express-validator chains
 *  4. validate                  – collect errors → 422 ValidationError
 *  5. controller method         – delegates to EmployeeAssignmentService
 */

// Apply authenticate + requireCFO to every route in this router
router.use(authenticate, requireCFO);

/**
 * @route   POST /rest/employees/assign
 * @desc    Assign an EMP to an RM (CFO only)
 * @access  Private – CFO
 * @body    { employeeId: UUID, managerId: UUID, remarks?: string }
 *
 * Behaviour:
 *  - If the exact EMP→RM pair is already active → 200 no-op response
 *  - If EMP has a different active RM     → deactivate old, create new → 201
 *  - If EMP has no active assignment      → create new → 201
 */
router.post(
  '/assign',
  assignEmployeeSchema,
  validate,
  employeeAssignmentController.assign
);

/**
 * @route   DELETE /rest/employees/assign
 * @desc    Remove the active EMP→RM assignment (soft-deactivate) (CFO only)
 * @access  Private – CFO
 * @body    { employeeId: UUID }
 *
 * Behaviour:
 *  - Soft-deactivates the active assignment row (history preserved)
 *  - Returns 404 if no active assignment exists
 */
router.delete(
  '/assign',
  removeEmployeeSchema,
  validate,
  employeeAssignmentController.remove
);

module.exports = router;
