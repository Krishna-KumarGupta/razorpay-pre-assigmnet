'use strict';

const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');
const { Reimbursement, EmployeeManager, User } = require('../models');

/**
 * ReimbursementRepository – data-access layer for the Reimbursement model.
 *
 * Single Responsibility: all reimbursement table queries live here.
 * Business rules (status transitions, role guards) belong in the service layer.
 *
 * Query methods added for role-scoped listing:
 *  findByEmployee          – EMP: own reimbursements (any status)
 *  findPendingForManager   – RM:  PENDING claims from direct reports (JOIN)
 *  findByStatus            – APE: RM_APPROVED claims | CFO: APE_APPROVED claims
 *  findByEmployeeForManager– RM:  reimbursements of a specific direct report
 *  verifyDirectReport      – guard: confirm employee is a direct report of manager
 */
class ReimbursementRepository extends BaseRepository {
  constructor() {
    super(Reimbursement);
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  /**
   * Persist a new reimbursement record.
   * @param {object} data
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
   * Find a reimbursement by employee and status.
   * @param {string} employeeId
   * @param {string} status
   * @returns {Promise<Reimbursement|null>}
   */
  async findPendingByEmployeeAndStatus(employeeId, status) {
    return this.model.findOne({
      where: { employeeId, status }
    });
  }

  /**
   * EMP – own reimbursements, all statuses, newest first.
   * Index used: reimbursements.employee_id
   *
   * Includes the submitting employee's basic info so the response shape
   * is consistent with RM / APE / CFO listing queries.
   *
   * @param {string} employeeId
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: Reimbursement[] }>}
   */
  async findByEmployee(employeeId, { page = 1, limit = 50 } = {}) {
    return this.model.findAndCountAll({
      where: { employeeId },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'role'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });
  }

  /**
   * RM – PENDING reimbursements from direct reports only.
   *
   * Strategy (two-step to avoid a broken cross-model JOIN alias):
   *
   *  Step 1 – Pull active direct-report IDs from employee_managers.
   *           Uses the composite index (manager_id, is_active).
   *
   *  Step 2 – Fetch PENDING reimbursements WHERE employee_id IN (ids).
   *           Uses the composite index (employee_id, status) on reimbursements.
   *
   * Returning early with an empty result when the manager has no direct
   * reports avoids the IN () syntax which is invalid SQL in some engines.
   *
   * @param {string} managerId
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: Reimbursement[] }>}
   */
  async findPendingForManager(managerId, { page = 1, limit = 50 } = {}) {
    // Step 1 – resolve active direct-report IDs (cheap indexed lookup)
    const assignments = await EmployeeManager.findAll({
      where: { managerId, isActive: true },
      attributes: ['employeeId'],
    });

    const employeeIds = assignments.map((a) => a.employeeId);

    // Short-circuit: manager has no direct reports → empty result set
    if (employeeIds.length === 0) {
      return { count: 0, rows: [] };
    }

    // Step 2 – PENDING claims belonging to any of those employees
    return this.model.findAndCountAll({
      where: {
        status: 'PENDING',
        employeeId: { [Op.in]: employeeIds },
      },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'role'],
          required: false,
        },
      ],
      order: [['submitted_at', 'ASC']],   // FIFO review queue
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });
  }

  /**
   * APE – reimbursements with status RM_APPROVED (awaiting APE review).
   * CFO – reimbursements with status APE_APPROVED (awaiting CFO review).
   *
   * Strategy: simple WHERE on the indexed status column.
   *
   * @param {string} status  – 'RM_APPROVED' | 'APE_APPROVED'
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: Reimbursement[] }>}
   */
  async findByStatus(status, { page = 1, limit = 50 } = {}) {
    return this.model.findAndCountAll({
      where: { status },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'role'],
          required: false,
        },
      ],
      order: [['submitted_at', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });
  }

  /**
   * RM – reimbursements for a *specific* direct report.
   *
   * Guard step: confirms the target employee is indeed a direct report
   * before fetching their reimbursements (done in one query via EXISTS-style JOIN).
   *
   * Returns null if the employee is NOT a direct report of this manager
   * so the service can throw a 403 without a second DB round-trip.
   *
   * @param {string} managerId
   * @param {string} targetEmployeeId
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: Reimbursement[] } | null>}
   */
  async findByEmployeeForManager(managerId, targetEmployeeId, { page = 1, limit = 50 } = {}) {
    // Step 1 – verify direct-report relationship (cheap indexed lookup)
    const assignment = await EmployeeManager.findOne({
      where: { managerId, employeeId: targetEmployeeId, isActive: true },
      attributes: ['id'],
    });

    // Caller receives null → not a direct report
    if (!assignment) return null;

    // Step 2 – fetch claims (indexed on employee_id)
    return this.model.findAndCountAll({
      where: { employeeId: targetEmployeeId },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'role'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /**
   * Update the status of a reimbursement.
   *
   * Accepts an optional Sequelize transaction so that callers in
   * ApprovalService can wrap this write together with the audit-log
   * insert in a single atomic transaction.
   *
   * @param {string} reimbursementId
   * @param {string} newStatus
   * @param {import('sequelize').Transaction} [transaction]
   * @returns {Promise<[affectedCount: number]>}
   */
  async updateStatus(reimbursementId, newStatus, transaction = null) {
    return this.model.update(
      { status: newStatus },
      {
        where: { id: reimbursementId },
        ...(transaction ? { transaction } : {}),
      }
    );
  }
}

module.exports = new ReimbursementRepository();
