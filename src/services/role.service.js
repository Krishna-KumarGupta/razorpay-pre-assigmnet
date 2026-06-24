'use strict';

const roleRepository = require('../repositories/role.repository');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * RoleService – business logic for role assignment.
 *
 * SOLID notes:
 *  S – Single responsibility: this class only manages role mutations.
 *  O – New role-related operations (revoke, audit) are added here, not in AuthService.
 *  D – Depends on RoleRepository abstraction, not Sequelize directly.
 *
 * Authorization (CFO-only gate) is handled by the requireCFO middleware
 * in the route layer, keeping this service HTTP-agnostic and testable.
 */
class RoleService {
  /**
   * Assign a new role to an existing user.
   *
   * Business rules enforced here:
   *  1. Target user must exist and be active.
   *  2. A CFO cannot downgrade their own role
   *     (prevents accidental CFO lockout; at least one CFO must always remain).
   *  3. The new role must be in the allowed set (enforced by validation layer,
   *     but guarded here as a defence-in-depth check).
   *
   * @param {string} actorId   - ID of the CFO performing the assignment (from req.user)
   * @param {string} targetUserId - ID of the user whose role is being changed
   * @param {string} newRole   - One of: EMP | RM | APE | CFO
   * @returns {Promise<{ userId: string, previousRole: string, newRole: string }>}
   * @throws {NotFoundError}  if the target user does not exist
   * @throws {BadRequestError} if the CFO tries to change their own role away from CFO
   */
  async assignRole(actorId, targetUserId, newRole) {
    const ALLOWED_ROLES = ['EMP', 'RM', 'APE', 'CFO'];

    // Defence-in-depth: role value guard (validation layer is the primary check)
    if (!ALLOWED_ROLES.includes(newRole)) {
      throw new BadRequestError(
        `Invalid role "${newRole}". Allowed values: ${ALLOWED_ROLES.join(', ')}.`,
        'INVALID_ROLE'
      );
    }

    // 1. Verify the target user exists
    const targetUser = await roleRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError(`User with id "${targetUserId}" was not found.`);
    }

    // 2. Guard: CFO cannot remove their own CFO role (self-lockout prevention)
    if (actorId === targetUserId && newRole !== 'CFO') {
      throw new BadRequestError(
        'A CFO cannot change their own role. Contact another CFO to perform this action.',
        'SELF_ROLE_CHANGE_FORBIDDEN'
      );
    }

    const previousRole = targetUser.role;

    // 3. No-op check: role is already what was requested
    if (previousRole === newRole) {
      logger.info(
        `[RoleService] assignRole no-op: user ${targetUserId} already has role ${newRole}`
      );
      return {
        userId: targetUserId,
        name: targetUser.name,
        email: targetUser.email,
        previousRole,
        newRole,
        changed: false,
      };
    }

    // 4. Persist the change
    await roleRepository.assignRole(targetUserId, newRole);

    logger.info(
      `[RoleService] Role changed by CFO ${actorId}: ` +
      `user ${targetUserId} (${targetUser.email}) ${previousRole} → ${newRole}`
    );

    return {
      userId: targetUserId,
      name: targetUser.name,
      email: targetUser.email,
      previousRole,
      newRole,
      changed: true,
    };
  }
}

module.exports = new RoleService();
