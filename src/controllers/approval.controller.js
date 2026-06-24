'use strict';

const approvalService = require('../services/approval.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHelper');

/**
 * ApprovalController – HTTP layer for reimbursement approval actions.
 *
 * SOLID notes:
 *  S – Extracts from req, delegates to ApprovalService, formats res.
 *      Zero state-machine logic lives here.
 *  D – Depends only on ApprovalService interface.
 *
 * Security:
 *  approverId is read exclusively from req.user.id (JWT-verified).
 *  approverRole is read from req.user.role (JWT-verified).
 *  Both are NEVER accepted from req.body.
 *
 *  Role enforcement (RM | APE | CFO only) is applied via authorize() in the router.
 */
class ApprovalController {
  /**
   * PATCH /rest/reimbursements/:id/approve
   *
   * Process an APPROVED or REJECTED action from an authorised approver.
   */
  approve = asyncHandler(async (req, res) => {
    const approverId   = req.user.id;
    const approverRole = req.user.role;
    const reimbursementId = req.params.id;
    const { action, remarks } = req.body;

    const result = await approvalService.processApproval(
      approverId,
      approverRole,
      reimbursementId,
      action,
      remarks
    );

    const verb = action === 'APPROVED' ? 'approved' : 'rejected';
    return sendSuccess(
      res,
      result,
      `Reimbursement ${verb} successfully. Status: ${result.previousStatus} → ${result.newStatus}`
    );
  });

  /**
   * GET /rest/reimbursements/:id/history
   *
   * Return the complete approval audit trail for a reimbursement.
   * Accessible to RM, APE, and CFO.
   */
  getHistory = asyncHandler(async (req, res) => {
    const history = await approvalService.getHistory(req.params.id);
    return sendSuccess(res, history, 'Approval history fetched successfully.');
  });
}

module.exports = new ApprovalController();
