'use strict';

const BaseRepository = require('./base.repository');
const { EmployeeManager, User } = require('../models');

/**
 * EmployeeAssignmentRepository – data-access layer for employee→manager assignments.
 *
 * Responsibilities (Single Responsibility Principle):
 *  - All EmployeeManager table queries live here.
 *  - User lookup for role verification lives here (reuses User model directly).
 *  - No business logic, no HTTP awareness.
 *
 * The model's partial unique index (only one active row per employee_id)
 * is the DB-level safety net; the service layer implements the soft-deactivation
 * flow to maintain the audit trail.
 */
class EmployeeAssignmentRepository extends BaseRepository {
  constructor() {
    super(EmployeeManager);
  }

  // ─── User lookups (needed for role validation) ────────────────────────────

  /**
   * Find a user by primary key.
   * Returns null if not found.
   * @param {string} userId
   * @returns {Promise<User|null>}
   */
  async findUserById(userId) {
    return User.findByPk(userId);
  }

  // ─── Assignment queries ───────────────────────────────────────────────────

  /**
   * Find the currently active assignment for an employee.
   * At most one row can be active (enforced by partial unique index in migration).
   *
   * @param {string} employeeId
   * @returns {Promise<EmployeeManager|null>}
   */
  async findActiveAssignment(employeeId) {
    return this.model.findOne({
      where: { employeeId, isActive: true },
    });
  }

  /**
   * Find an active assignment by both employeeId and managerId.
   * Used to check whether the exact pairing already exists.
   *
   * @param {string} employeeId
   * @param {string} managerId
   * @returns {Promise<EmployeeManager|null>}
   */
  async findActiveAssignmentByPair(employeeId, managerId) {
    return this.model.findOne({
      where: { employeeId, managerId, isActive: true },
    });
  }

  /**
   * Deactivate the currently active assignment for an employee.
   * Preserves the row for audit history (soft approach).
   *
   * @param {string} employeeId
   * @returns {Promise<[affectedCount: number]>}
   */
  async deactivateActiveAssignment(employeeId) {
    return this.model.update(
      { isActive: false },
      { where: { employeeId, isActive: true } }
    );
  }

  /**
   * Create a new active assignment record.
   *
   * @param {{ employeeId: string, managerId: string, remarks?: string }} data
   * @returns {Promise<EmployeeManager>}
   */
  async createAssignment(data) {
    return this.model.create({
      employeeId: data.employeeId,
      managerId: data.managerId,
      assignedAt: new Date(),
      isActive: true,
      remarks: data.remarks || null,
    });
  }

  /**
   * Fetch all active assignments for a given manager.
   * Useful for listing a manager's current team.
   *
   * @param {string} managerId
   * @returns {Promise<EmployeeManager[]>}
   */
  async findActiveAssignmentsByManager(managerId) {
    return this.model.findAll({
      where: { managerId, isActive: true },
    });
  }
}

module.exports = new EmployeeAssignmentRepository();
