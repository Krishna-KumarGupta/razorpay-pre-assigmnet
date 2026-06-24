'use strict';

const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  updateUserSchema,
  listUsersSchema,
  changePasswordSchema,
} = require('../validations/user.validation');

/**
 * User Routes
 * Base path: /api/v1/users
 * All routes require authentication.
 */
router.use(authenticate);

/** @route GET /api/v1/users – admin only */
router.get(
  '/',
  authorize('admin'),
  listUsersSchema,
  validate,
  userController.listUsers
);

/** @route GET /api/v1/users/:id */
router.get(
  '/:id',
  userController.getUserById
);

/** @route PATCH /api/v1/users/:id */
router.patch(
  '/:id',
  updateUserSchema,
  validate,
  userController.updateUser
);

/** @route DELETE /api/v1/users/:id – admin only */
router.delete(
  '/:id',
  authorize('admin'),
  userController.deleteUser
);

/** @route PATCH /api/v1/users/:id/change-password */
router.patch(
  '/:id/change-password',
  changePasswordSchema,
  validate,
  userController.changePassword
);

module.exports = router;
