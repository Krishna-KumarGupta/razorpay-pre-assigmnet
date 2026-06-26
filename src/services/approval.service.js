'use strict';

const { db } = require('../db/db');
const reimbursementRepository = require('../repositories/reimbursement.repository');
const approvalRepository = require('../repositories/approval.repository');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * ApprovalService – state machine for the reimbursement approval workflow.
 *
 * ═══════════════════════════════════════════════════════════
 *  STATUS FLOW
 * ═══════════════════════════════════════════════════════════
 *
 *                   RM acts
 *  PENDING ──────────────────► RM_APPROVED ──────────────────► APE_APPROVED ──────────────────► CFO_APPROVED
 *            │                              APE acts            │              CFO acts
 *            │                                                  │ (= final APPROVED)
 *            └──► RM_REJECTED (terminal)    └──► APE_REJECTED (terminal)      └──► CFO_REJECTED (terminal)
 *
 *  Final APPROVED rule:
 *   RM approved  AND  at least one APE approved  →  CFO gives final approval
 *
 *  Any REJECTED at any level  →  terminal, no further actions allowed.
 *
 * ═══════════════════════════════════════════════════════════
 *  SOLID NOTES
 * ═══════════════════════════════════════════════════════════
 *  S – Solely manages approval state transitions; creation logic is in ReimbursementService.
 *  O – Adding new gates (e.g., LEGAL) extends this class without altering existing methods.
 *  D – Depends on repository abstractions, not Sequelize models directly.
 *
 *  Authorization (RM|APE|CFO only) is enforced upstream by the route middleware.
 *  This service focuses purely on business rules.
 */
class ApprovalService {

  // ─── Gate definitions ─────────────────────────────────────────────────────
  // Maps the actor's role to the gate they own and the resulting statuses.

  static GATES = {
    RM: {
      level:           'RM',
      requiredStatus:  'PENDING',          // claim must be in this state to act
      approvedStatus:  'RM_APPROVED',
      rejectedStatus:  'RM_REJECTED',
    },
    APE: {
      level:           'APE',
      requiredStatus:  'RM_APPROVED',
      approvedStatus:  'APE_APPROVED',
      rejectedStatus:  'APE_REJECTED',
    },
    CFO: {
      level:           'CFO',
      requiredStatus:  'APE_APPROVED',
      approvedStatus:  'CFO_APPROVED',
      rejectedStatus:  'CFO_REJECTED',
    },
  };

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Process an approval or rejection action from an authorised approver.
   *
   * Business rules enforced:
   *  1. Reimbursement must exist.
   *  2. Claim must not already be in a terminal state.
   *  3. Approver's role must match the gate expected for the current status.
   *  4. RM/APE: may not approve the same reimbursement twice at their level.
   *  5. Any REJECTED action locks the claim immediately.
   *  6. CFO_APPROVED is only reachable after RM_APPROVED and at least one APE_APPROVED.
   *
   * All DB writes are wrapped in a transaction to prevent partial state.
   *
   * @param {string} approverId   - req.user.id
   * @param {string} approverRole - req.user.role  ('RM' | 'APE' | 'CFO')
   * @param {string} reimbursementId
   * @param {'APPROVED' | 'REJECTED'} action
   * @param {string} [remarks]
   *
   * @returns {Promise<{
   *   reimbursement: object,
   *   approval: object,
   *   previousStatus: string,
   *   newStatus: string,
   * }>}
   */
  async processApproval(approverId, approverRole, employeeId, action, remarks) {

    // Get the gate definition for this approver's role
    const gate = ApprovalService.GATES[approverRole];
    if (!gate) {
      throw new ForbiddenError(`Role "${approverRole}" is not permitted to approve reimbursements.`);
    }

    // Load the claim matching the employee and required gate status
    const reimbursement = await reimbursementRepository.findPendingByEmployeeAndStatus(employeeId, gate.requiredStatus);
    if (!reimbursement) {
      throw new NotFoundError(
        `Reimbursement for employee "${employeeId}" with status "${gate.requiredStatus}" not found.`
      );
    }

    const reimbursementId = reimbursement.id;
    const currentStatus = reimbursement.status;

    // 2. Reject actions on terminal claims
    const TERMINAL = ['RM_REJECTED', 'APE_REJECTED', 'CFO_REJECTED', 'CFO_APPROVED', 'CANCELLED', 'PAID'];
    if (TERMINAL.includes(currentStatus)) {
      throw new BadRequestError(
        `Reimbursement is already in a terminal state: "${currentStatus}". No further actions are allowed.`,
        'TERMINAL_STATE'
      );
    }

    // 5. Duplicate-approval guard
    //    RM:  may not approve their own reimbursement twice at the RM level.
    //    APE: each individual APE may not act twice, but a *different* APE CAN still
    //         approve — the spec requires "at least one APE approved", not "only one APE".
    //    CFO: no duplicate guard needed (only one CFO in the system).
    if (approverRole !== 'CFO') {
      const alreadyActed = await approvalRepository.findByApproverAndLevel(
        reimbursementId,
        approverId,
        gate.level
      );
      if (alreadyActed) {
        throw new BadRequestError(
          `You have already ${alreadyActed.action.toLowerCase()} this reimbursement. ` +
          `Duplicate actions by the same approver are not allowed.`,
          'DUPLICATE_APPROVAL'
        );
      }
    }

    // 6. Determine new status based on action
    const newStatus = action === 'APPROVED' ? gate.approvedStatus : gate.rejectedStatus;

    // 7. Wrap both DB writes in a transaction
    const result = await db.transaction(async (tx) => {

      // 7a. Update the reimbursement status (atomic with the audit log insert)
      await reimbursementRepository.updateStatus(reimbursementId, newStatus, tx);

      // 7b. Insert immutable approval record (same transaction as 7a)
      const approvalRecord = await approvalRepository.recordApproval({
        reimbursementId,
        approverId,
        approvalLevel:  gate.level,
        action,
        remarks,
        previousStatus: currentStatus,
        newStatus,
      }, tx);

      return approvalRecord;
    });

    logger.info(
      `[ApprovalService] ${approverRole} ${approverId} → ${action} ` +
      `reimbursement ${reimbursementId}: ${currentStatus} → ${newStatus}`
    );

    // Re-fetch updated reimbursement for response
    const updatedReimbursement = await reimbursementRepository.findReimbursementById(reimbursementId);

    return {
      reimbursement: updatedReimbursement,
      approval:      result,
      previousStatus: currentStatus,
      newStatus,
    };
  }

  // ─── History ──────────────────────────────────────────────────────────────

  /**
   * Return the full approval history for a reimbursement.
   *
   * @param {string} reimbursementId
   * @returns {Promise<ReimbursementApproval[]>}
   */
  async getHistory(reimbursementId) {
    const reimbursement = await reimbursementRepository.findReimbursementById(reimbursementId);
    if (!reimbursement) {
      throw new NotFoundError(`Reimbursement "${reimbursementId}" not found.`);
    }
    return approvalRepository.findByReimbursement(reimbursementId);
  }
}

module.exports = new ApprovalService();
