'use strict';

const BaseRepository = require('./base.repository');
const ReimbursementApproval = require('../models/reimbursementApproval.model');

/**
 * ApprovalRepository – data-access layer for the ReimbursementApproval model.
 *
 * Single Responsibility:
 *  – Inserts immutable approval audit rows.
 *  – Queries approval history to support the state-machine rules in the service.
 *
 * Rows are INSERT-only by convention; never UPDATE or DELETE.
 */
class ApprovalRepository extends BaseRepository {
  constructor() {
    super(ReimbursementApproval);
  }

  // ─── Write ─────────────────────────────────────────────────────────────────

  /**
   * Record a single approval action.
   * Called every time an approver acts on a reimbursement.
   *
   * Accepts an optional Sequelize transaction so that this insert can be
   * bundled atomically with the reimbursement status update in ApprovalService.
   *
   * @param {{
   *   reimbursementId: string,
   *   approverId:      string,
   *   approvalLevel:   'RM' | 'APE' | 'CFO',
   *   action:          'APPROVED' | 'REJECTED',
   *   remarks?:        string,
   *   previousStatus:  string,
   *   newStatus:       string,
   * }} data
   * @param {import('sequelize').Transaction} [transaction]
   * @returns {Promise<ReimbursementApproval>}
   */
  async recordApproval(data, transaction = null) {
    return this.model.create(
      {
        reimbursementId: data.reimbursementId,
        approverId:      data.approverId,
        approvalLevel:   data.approvalLevel,
        action:          data.action,
        remarks:         data.remarks || null,
        actionAt:        new Date(),
        previousStatus:  data.previousStatus,
        newStatus:       data.newStatus,
      },
      transaction ? { transaction } : {}
    );
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /**
   * Get the full approval history for a reimbursement, oldest-first.
   * Used to display audit trail and to compute the current approval state.
   *
   * @param {string} reimbursementId
   * @returns {Promise<ReimbursementApproval[]>}
   */
  async findByReimbursement(reimbursementId) {
    return this.model.findAll({
      where: { reimbursementId },
      order: [['action_at', 'ASC']],
    });
  }

  /**
   * Check whether a specific approval level has already been recorded
   * for a reimbursement.  Used to prevent duplicate approvals from the same level.
   *
   * @param {string} reimbursementId
   * @param {'RM' | 'APE' | 'CFO'} level
   * @param {'APPROVED' | 'REJECTED'} action
   * @returns {Promise<ReimbursementApproval|null>}
   */
  async findApprovalByLevel(reimbursementId, level, action) {
    return this.model.findOne({
      where: { reimbursementId, approvalLevel: level, action },
    });
  }

  /**
   * Check if any approval record at any level has action = REJECTED.
   * Drives the "any rejection → terminal REJECTED" rule.
   *
   * @param {string} reimbursementId
   * @returns {Promise<boolean>}
   */
  async hasAnyRejection(reimbursementId) {
    const record = await this.model.findOne({
      where: { reimbursementId, action: 'REJECTED' },
    });
    return !!record;
  }

  /**
   * Fetch the most recent approval record for a given level.
   *
   * @param {string} reimbursementId
   * @param {'RM' | 'APE' | 'CFO'} level
   * @returns {Promise<ReimbursementApproval|null>}
   */
  async findLatestByLevel(reimbursementId, level) {
    return this.model.findOne({
      where: { reimbursementId, approvalLevel: level },
      order: [['action_at', 'DESC']],
    });
  }
}

module.exports = new ApprovalRepository();
