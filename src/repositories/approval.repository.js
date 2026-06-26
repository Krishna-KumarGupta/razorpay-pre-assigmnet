'use strict';

const { eq, and, asc, desc } = require('drizzle-orm');
const BaseRepository = require('./base.repository');
const { reimbursementApprovals } = require('../db/schema');
const { ReimbursementApproval } = require('../db/models');

/**
 * ApprovalRepository – data-access layer for the ReimbursementApproval model.
 */
class ApprovalRepository extends BaseRepository {
  constructor() {
    super(reimbursementApprovals, ReimbursementApproval);
  }

  // ─── Write ─────────────────────────────────────────────────────────────────

  /**
   * Record a single approval action.
   * @param {object} data
   * @param {object} [transaction] - Drizzle transaction context (tx)
   * @returns {Promise<ReimbursementApproval>}
   */
  async recordApproval(data, transaction = null) {
    const client = transaction || this.db;
    const rows = await client.insert(reimbursementApprovals).values({
      reimbursementId: data.reimbursementId,
      approverId:      data.approverId,
      approvalLevel:   data.approvalLevel,
      action:          data.action,
      remarks:         data.remarks || null,
      actionAt:        new Date(),
      previousStatus:  data.previousStatus,
      newStatus:       data.newStatus,
    }).returning();
    return new ReimbursementApproval(rows[0]);
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /**
   * Get the full approval history for a reimbursement, oldest-first.
   * @param {string} reimbursementId
   * @returns {Promise<ReimbursementApproval[]>}
   */
  async findByReimbursement(reimbursementId) {
    const rows = await this.db.select().from(reimbursementApprovals)
      .where(eq(reimbursementApprovals.reimbursementId, reimbursementId))
      .orderBy(asc(reimbursementApprovals.actionAt));
    return rows.map((r) => new ReimbursementApproval(r));
  }

  /**
   * Check whether a specific approval level has already been recorded for a reimbursement.
   * @param {string} reimbursementId
   * @param {string} level
   * @param {string} action
   * @returns {Promise<ReimbursementApproval|null>}
   */
  async findApprovalByLevel(reimbursementId, level, action) {
    const rows = await this.db.select().from(reimbursementApprovals)
      .where(
        and(
          eq(reimbursementApprovals.reimbursementId, reimbursementId),
          eq(reimbursementApprovals.approvalLevel, level),
          eq(reimbursementApprovals.action, action)
        )
      );
    return rows[0] ? new ReimbursementApproval(rows[0]) : null;
  }

  /**
   * Check if any approval record at any level has action = REJECTED.
   * @param {string} reimbursementId
   * @returns {Promise<boolean>}
   */
  async hasAnyRejection(reimbursementId) {
    const rows = await this.db.select().from(reimbursementApprovals)
      .where(
        and(
          eq(reimbursementApprovals.reimbursementId, reimbursementId),
          eq(reimbursementApprovals.action, 'REJECTED')
        )
      );
    return rows.length > 0;
  }

  /**
   * Fetch the most recent approval record for a given level.
   * @param {string} reimbursementId
   * @param {string} level
   * @returns {Promise<ReimbursementApproval|null>}
   */
  async findLatestByLevel(reimbursementId, level) {
    const rows = await this.db.select().from(reimbursementApprovals)
      .where(
        and(
          eq(reimbursementApprovals.reimbursementId, reimbursementId),
          eq(reimbursementApprovals.approvalLevel, level)
        )
      )
      .orderBy(desc(reimbursementApprovals.actionAt))
      .limit(1);
    return rows[0] ? new ReimbursementApproval(rows[0]) : null;
  }

  /**
   * Check if a specific approver has already acted on a reimbursement at a given approval level.
   * @param {string} reimbursementId
   * @param {string} approverId
   * @param {string} level
   * @returns {Promise<ReimbursementApproval|null>}
   */
  async findByApproverAndLevel(reimbursementId, approverId, level) {
    const rows = await this.db.select().from(reimbursementApprovals)
      .where(
        and(
          eq(reimbursementApprovals.reimbursementId, reimbursementId),
          eq(reimbursementApprovals.approverId, approverId),
          eq(reimbursementApprovals.approvalLevel, level)
        )
      )
      .orderBy(desc(reimbursementApprovals.actionAt))
      .limit(1);
    return rows[0] ? new ReimbursementApproval(rows[0]) : null;
  }
}

module.exports = new ApprovalRepository();
