'use strict';

const BaseRepository = require('./base.repository');
const Reimbursement = require('../models/reimbursement.model');

/**
 * ReimbursementRepository – data-access layer for the Reimbursement model.
 *
 * Single Responsibility: all reimbursement table queries live here.
 * Business rules (status transitions, role guards) belong in the service layer.
 */
class ReimbursementRepository extends BaseRepository {
  constructor() {
    super(Reimbursement);
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  /**
   * Persist a new reimbursement record.
   *
   * @param {{
   *   employeeId:      string,
   *   title:           string,
   *   description?:    string,
   *   amount:          number,
   *   category?:       string,
   *   expenseDate:     string,   // YYYY-MM-DD
   *   employeeRemarks?: string,
   *   status:          string,
   * }} data
   * @returns {Promise<Reimbursement>}
   */
  async createReimbursement(data) {
    return this.model.create(data);
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /**
   * Find a reimbursement by its primary key.
   * @param {string} id
   * @returns {Promise<Reimbursement|null>}
   */
  async findReimbursementById(id) {
    return this.model.findByPk(id);
  }

  /**
   * Fetch all reimbursements submitted by a specific employee.
   * Ordered by creation date descending (newest first).
   *
   * @param {string} employeeId
   * @returns {Promise<Reimbursement[]>}
   */
  async findByEmployee(employeeId) {
    return this.model.findAll({
      where: { employeeId },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Fetch all reimbursements with a given status.
   * Useful for approver dashboards.
   *
   * @param {string} status
   * @returns {Promise<Reimbursement[]>}
   */
  async findByStatus(status) {
    return this.model.scope('pending').findAll({
      order: [['submitted_at', 'ASC']],  // oldest first for FIFO review
    });
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /**
   * Update the status of a reimbursement.
   * Returns the number of affected rows so callers can detect missing records.
   *
   * @param {string} reimbursementId
   * @param {string} newStatus
   * @returns {Promise<[affectedCount: number]>}
   */
  async updateStatus(reimbursementId, newStatus) {
    return this.model.update(
      { status: newStatus },
      { where: { id: reimbursementId } }
    );
  }
}

module.exports = new ReimbursementRepository();
