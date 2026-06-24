'use strict';

const reimbursementService = require('../services/reimbursement.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendCreated } = require('../utils/responseHelper');

/**
 * ReimbursementController – HTTP layer for reimbursement operations.
 *
 * SOLID notes:
 *  S – Extracts from req, delegates to service, formats res. Zero business logic.
 *  D – Depends only on ReimbursementService interface.
 *
 * Security:
 *  employeeId is read exclusively from req.user.id (populated by authenticate).
 *  It is never accepted from req.body to prevent impersonation.
 *
 *  Role enforcement (EMP-only) is applied via authorize('EMP') in the router.
 */
class ReimbursementController {
  /**
   * POST /rest/reimbursements
   *
   * Creates a new reimbursement claim.
   * Returns 201 Created with the persisted reimbursement object.
   */
  create = asyncHandler(async (req, res) => {
    // employeeId is sourced from the verified JWT — never from the request body
    const employeeId = req.user.id;
    const { title, description, amount, category, expenseDate, employeeRemarks } = req.body;

    const reimbursement = await reimbursementService.createReimbursement(employeeId, {
      title,
      description,
      amount,
      category,
      expenseDate,
      employeeRemarks,
    });

    return sendCreated(
      res,
      reimbursement,
      'Reimbursement claim submitted successfully.'
    );
  });
}

module.exports = new ReimbursementController();
