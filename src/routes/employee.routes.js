'use strict';

const express = require('express');

const employeeAssignmentController = require('../controllers/employeeAssignment.controller');
const employeeListController = require('../controllers/employeeList.controller');
const { authenticate, authorize, requireCFO } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  assignEmployeeSchema,
  removeEmployeeSchema,
} = require('../validations/employeeAssignment.validation');

const router = express.Router();

/**
 * Employee Routes
 * Base path: /rest/employees   (mounted in src/routes/rest.js)
 *
 * RBAC matrix:
 * ┌───────────────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Path     │ Middleware chain                          │ Who               │
 * ├────────┼──────────┼──────────────────────────────────────────┼───────────────────┤
 * │ GET    │ /        │ authenticate → authorize(RM,APE,CFO)      │ RM | APE | CFO    │
 * │ POST   │ /assign  │ authenticate → requireCFO → validate      │ CFO only          │
 * │ DELETE │ /assign  │ authenticate → requireCFO → validate      │ CFO only          │
 * └────────┴──────────┴──────────────────────────────────────────┴───────────────────┘
 *
 * Visibility rules enforced in EmployeeListService (not middleware):
 *  RM  → own direct reports only (INNER JOIN on employee_managers)
 *  APE → all EMP and RM users    (WHERE role IN ('EMP','RM'))
 *  CFO → all users               (full scan, paginated)
 *  EMP → blocked by authorize() → 403 Forbidden
 */

// ── GET / – Role-scoped employee listing ─────────────────────────────────────

/**
 * @route   GET /rest/employees
 * @desc    Fetch users visible to the requesting actor (role-scoped)
 * @access  Private – RM | APE | CFO
 * @query   page (CFO only, default 1), limit (CFO only, default 50, max 100)
 *
 * Response shape:
 *  RM  / APE → { employees: [...], total: n }
 *  CFO       → paginated envelope { data: [...], meta: { pagination: {...} } }
 */
router.get(
  '/',
  authenticate,
  authorize('RM', 'APE', 'CFO'),   // EMP is explicitly excluded here (→ 403)
  employeeListController.list
);

// ── CFO: Assignment management ────────────────────────────────────────────────

/**
 * @route   POST /rest/employees/assign
 * @desc    Assign an EMP to an RM (CFO only)
 * @access  Private – CFO
 * @body    { employeeId: UUID, managerId: UUID, remarks?: string }
 */
router.post(
  '/assign',
  authenticate,
  requireCFO,
  assignEmployeeSchema,
  validate,
  employeeAssignmentController.assign
);

/**
 * @route   DELETE /rest/employees/assign
 * @desc    Remove the active EMP→RM assignment (soft-deactivate) (CFO only)
 * @access  Private – CFO
 * @body    { employeeId: UUID }
 */
router.delete(
  '/assign',
  authenticate,
  requireCFO,
  removeEmployeeSchema,
  validate,
  employeeAssignmentController.remove
);

module.exports = router;
