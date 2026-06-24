'use strict';

const employeeListRepository = require('../repositories/employeeList.repository');
const { ForbiddenError } = require('../utils/errors');

/**
 * EmployeeListService – business logic for the GET /rest/employees endpoint.
 *
 * SOLID notes:
 *  S – Solely concerns the "which users can see which users" policy.
 *  O – Adding a new role's visibility rule requires only adding a new case here.
 *  D – Depends on EmployeeListRepository abstraction, not Sequelize directly.
 *
 * Visibility policy (enforced here, not in the repository):
 *
 *  Role │ Visible users
 *  ─────┼──────────────────────────────────────────────────────────────────
 *  RM   │ Only employees directly assigned to this RM (active assignments)
 *  APE  │ All users with role EMP or RM (active)
 *  CFO  │ All users regardless of role or active status
 *  EMP  │ Forbidden – enforced at middleware level; unreachable here
 *
 * Authorization (EMP forbidden) is primarily enforced by the route middleware
 * (authorize('RM','APE','CFO')).  The ForbiddenError below is a defence-in-depth
 * guard in case the service is ever called outside the HTTP request cycle.
 */
class EmployeeListService {

  /**
   * Fetch the list of users visible to the requesting actor.
   *
   * @param {string} actorId    – req.user.id
   * @param {string} actorRole  – req.user.role
   * @param {{ page?: number, limit?: number }} paginationOptions
   * @returns {Promise<{
   *   data:  User[],
   *   total: number,
   *   page:  number,
   *   limit: number,
   * }>}
   */
  async listEmployees(actorId, actorRole, { page = 1, limit = 50 } = {}) {

    switch (actorRole) {

      // ── RM: only their own direct reports ──────────────────────────────────
      case 'RM': {
        const users = await employeeListRepository.findDirectReports(actorId);
        return {
          data:  users,
          total: users.length,
          page:  1,
          limit: users.length,
        };
      }

      // ── APE: all EMP and RM users ──────────────────────────────────────────
      case 'APE': {
        const users = await employeeListRepository.findEmpAndRmUsers();
        return {
          data:  users,
          total: users.length,
          page:  1,
          limit: users.length,
        };
      }

      // ── CFO: all users with pagination ────────────────────────────────────
      case 'CFO': {
        const { count, rows } = await employeeListRepository.findAllUsers({ page, limit });
        return {
          data:  rows,
          total: count,
          page,
          limit,
        };
      }

      // ── EMP / unknown: forbidden ──────────────────────────────────────────
      default:
        throw new ForbiddenError(
          `Role "${actorRole}" does not have access to the employee list.`
        );
    }
  }
}

module.exports = new EmployeeListService();
