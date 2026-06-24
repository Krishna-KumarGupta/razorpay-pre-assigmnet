'use strict';

const express = require('express');

const roleController = require('../controllers/role.controller');
const { authenticate, requireCFO } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { assignRoleSchema } = require('../validations/role.validation');

const router = express.Router();

/**
 * Role Routes
 * Base path: /rest/roles   (mounted in src/routes/rest.js)
 *
 * RBAC matrix:
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ Method │ Path     │ Middleware chain                   │ Who        │
 * ├────────┼──────────┼───────────────────────────────────┼────────────┤
 * │ POST   │ /assign  │ authenticate → requireCFO → valid. │ CFO only   │
 * └────────┴──────────┴───────────────────────────────────┴────────────┘
 *
 * Middleware execution order (left → right):
 *  1. authenticate  – verifies access_token cookie; populates req.user
 *  2. requireCFO    – alias for authorize('CFO'); throws 403 for non-CFO
 *  3. assignRoleSchema – express-validator chains: userId UUID + role ENUM
 *  4. validate      – collects errors → throws 422 ValidationError
 *  5. roleController.assignRole – business logic via RoleService
 */

/**
 * @route   POST /rest/roles/assign
 * @desc    Assign a role to a user (CFO only)
 * @access  Private – CFO
 * @body    { userId: string (UUID), role: 'EMP' | 'RM' | 'APE' | 'CFO' }
 */
router.post(
  '/assign',
  authenticate,        // Step 1: JWT cookie → req.user
  requireCFO,          // Step 2: RBAC gate – CFO only
  assignRoleSchema,    // Step 3: input validation chains
  validate,            // Step 4: collect errors → 422
  roleController.assignRole  // Step 5: delegate to service
);

module.exports = router;
