'use strict';

const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated, sendNoContent } = require('../utils/responseHelper');

/**
 * UserController – HTTP layer for user management.
 *
 * Thin controller: delegates all work to UserService.
 */
class UserController {
  /**
   * GET /api/v1/users
   * Admin-only: list all users with pagination.
   */
  listUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, ...filters } = req.query;
    const { users, total } = await userService.listUsers({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      ...filters,
    });
    return sendPaginated(res, users, total, parseInt(page, 10), parseInt(limit, 10));
  });

  /**
   * GET /api/v1/users/:id
   */
  getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, user, 'User fetched successfully');
  });

  /**
   * PATCH /api/v1/users/:id
   */
  updateUser = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    return sendSuccess(res, user, 'User updated successfully');
  });

  /**
   * DELETE /api/v1/users/:id
   * Admin-only
   */
  deleteUser = asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    return sendNoContent(res);
  });

  /**
   * PATCH /api/v1/users/:id/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    await userService.changePassword(req.params.id, req.body);
    return sendSuccess(res, null, 'Password changed successfully');
  });
}

module.exports = new UserController();
