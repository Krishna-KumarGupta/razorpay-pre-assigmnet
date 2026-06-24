'use strict';

const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * User Routes
 * Base path: /api/v1/users
 *
 * NOTE: listUsers, updateUser, deleteUser, changePassword service stubs
 * are not yet implemented. Only getUserById is wired until the stubs are
 * replaced with real logic.
 */
router.use(authenticate);

/** @route GET /api/v1/users/:id – authenticated users can view a profile */
router.get('/:id', userController.getUserById);

module.exports = router;
