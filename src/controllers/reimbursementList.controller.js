'use strict';

const reimbursementListService = require('../services/reimbursementList.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendPaginated } = require('../utils/responseHelper');

/**
 * ReimbursementListController – HTTP layer for reimbursement listing endpoints.
 *
 * SOLID notes:
 *  S – HTTP extraction only; zero visibility logic.
 *  D – Depends only on ReimbursementListService interface.
 *
 * Security:
 *  actorId and actorRole always sourced from JWT (req.user), never from query/body.
 */
class ReimbursementListController {

  /**
   * GET /rest/reimbursements
   *
   * Role-scoped listing:
   *  EMP → own claims
   *  RM  → pending from direct reports
   *  APE → RM-approved queue
   *  CFO → APE-approved queue
   */
  list = asyncHandler(async (req, res) => {
    const actorId   = req.user.id;
    const actorRole = req.user.role;
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const result = await reimbursementListService.listReimbursements(
      actorId, actorRole, { page, limit }
    );

    return sendPaginated(
      res,
      result.data,
      result.total,
      result.page,
      result.limit,
      'Reimbursements fetched successfully.'
    );
  });

  /**
   * GET /rest/reimbursements/:userId
   *
   * Fetch all reimbursements of a specific employee.
   * Restricted to RM; target must be an active direct report.
   */
  listByEmployee = asyncHandler(async (req, res) => {
    const actorId      = req.user.id;
    const actorRole    = req.user.role;
    const targetUserId = req.params.userId;
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const result = await reimbursementListService.listReimbursementsByEmployee(
      actorId, actorRole, targetUserId, { page, limit }
    );

    return sendPaginated(
      res,
      result.data,
      result.total,
      result.page,
      result.limit,
      `Reimbursements for employee "${targetUserId}" fetched successfully.`
    );
  });
}

module.exports = new ReimbursementListController();
