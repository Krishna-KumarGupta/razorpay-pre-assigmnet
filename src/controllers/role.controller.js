'use strict';

const roleService = require('../services/role.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHelper');

/**
 * RoleController – HTTP layer for role management.
 *
 * SOLID notes:
 *  S – Extracts from req, delegates to RoleService, formats res. No business logic.
 *  D – Depends only on RoleService interface, not on any model or ORM.
 *
 * RBAC enforcement:
 *  Authorization (CFO-only) is applied in the router via the requireCFO middleware,
 *  NOT here.  The controller trusts that req.user is a verified CFO by the time
 *  its methods are invoked.
 */
class RoleController {
  /**
   * POST /rest/roles/assign
   *
   * Assigns a new role to the specified user.
   *
   * req.user is populated by the authenticate middleware.
   * req.user.role === 'CFO' is guaranteed by the requireCFO middleware.
   *
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   */
  assignRole = asyncHandler(async (req, res) => {
    const actorId = req.user.id;                    // CFO performing the action
    const { userId: targetUserId, role: newRole } = req.body;

    const result = await roleService.assignRole(actorId, targetUserId, newRole);

    const message = result.changed
      ? `Role updated: ${result.previousRole} → ${result.newRole}`
      : `No change: user already has role "${result.newRole}"`;

    return sendSuccess(res, result, message);
  });
}

module.exports = new RoleController();
