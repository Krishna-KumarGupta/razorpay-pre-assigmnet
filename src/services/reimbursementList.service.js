'use strict';

const reimbursementRepository = require('../repositories/reimbursement.repository');
const { ForbiddenError, NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * ReimbursementListService – role-scoped visibility logic for reimbursement listings.
 *
 * SOLID notes:
 *  S – Only concerns "which reimbursements can this role see". No HTTP, no ORM.
 *  O – New role visibility rules extend this class via a new case.
 *  D – Depends on ReimbursementRepository abstraction.
 *
 * Visibility policy:
 *
 *  Role │ GET /reimbursements                      │ GET /reimbursements/:userId
 *  ─────┼─────────────────────────────────────────┼──────────────────────────────────────
 *  EMP  │ Own claims (any status)                  │ Forbidden
 *  RM   │ PENDING claims from direct reports only  │ All claims of a direct report only
 *  APE  │ Claims with status RM_APPROVED           │ Forbidden
 *  CFO  │ Claims with status APE_APPROVED          │ Forbidden
 */
class ReimbursementListService {

  // ─── GET /rest/reimbursements ─────────────────────────────────────────────

  /**
   * Fetch reimbursements visible to the requesting actor.
   *
   * @param {string} actorId
   * @param {string} actorRole
   * @param {{ page?: number, limit?: number }} pagination
   * @returns {Promise<{ data: Reimbursement[], total: number, page: number, limit: number }>}
   */
  async listReimbursements(actorId, actorRole, { page = 1, limit = 50 } = {}) {

    switch (actorRole) {

      // EMP: own reimbursements, all statuses
      case 'EMP': {
        const { count, rows } = await reimbursementRepository.findByEmployee(
          actorId, { page, limit }
        );
        return { data: rows, total: count, page, limit };
      }

      // RM: PENDING claims from direct reports only
      case 'RM': {
        const { count, rows } = await reimbursementRepository.findPendingForManager(
          actorId, { page, limit }
        );
        return { data: rows, total: count, page, limit };
      }

      // APE: claims that RM approved (awaiting APE action)
      case 'APE': {
        const { count, rows } = await reimbursementRepository.findByStatus(
          'RM_APPROVED', { page, limit }
        );
        return { data: rows, total: count, page, limit };
      }

      // CFO: claims that APE approved (awaiting CFO final approval)
      case 'CFO': {
        const { count, rows } = await reimbursementRepository.findByStatus(
          'APE_APPROVED', { page, limit }
        );
        return { data: rows, total: count, page, limit };
      }

      default:
        throw new ForbiddenError(
          `Role "${actorRole}" does not have access to reimbursement listings.`
        );
    }
  }

  // ─── GET /rest/reimbursements/:userId ─────────────────────────────────────

  /**
   * Fetch all reimbursements for a specific employee.
   *
   * Rules:
   *  – Only RM can call this endpoint.
   *  – The target employee must be an active direct report of the requesting RM.
   *  – All statuses are returned (the RM should see the full history of their team).
   *
   * @param {string} actorId    – req.user.id (must be RM)
   * @param {string} actorRole  – req.user.role
   * @param {string} targetUserId – req.params.userId
   * @param {{ page?: number, limit?: number }} pagination
   * @returns {Promise<{ data: Reimbursement[], total: number, page: number, limit: number }>}
   */
  async listReimbursementsByEmployee(actorId, actorRole, targetUserId, { page = 1, limit = 50 } = {}) {

    // Only RM can access this endpoint
    if (actorRole !== 'RM') {
      throw new ForbiddenError(
        `Only RMs can view reimbursements for a specific employee. Your role: "${actorRole}".`
      );
    }

    // Attempt the repository call, which verifies the direct-report relationship internally
    const result = await reimbursementRepository.findByEmployeeForManager(
      actorId, targetUserId, { page, limit }
    );

    // Repository returns null when the employee is not a direct report
    if (result === null) {
      throw new ForbiddenError(
        `Employee "${targetUserId}" is not a direct report of your RM account. Access denied.`
      );
    }

    const { count, rows } = result;
    return { data: rows, total: count, page, limit };
  }
}

module.exports = new ReimbursementListService();
