'use strict';

const { eq, and } = require('drizzle-orm');
const BaseRepository = require('./base.repository');
const { employeeManagers, users } = require('../db/schema');
const { EmployeeManager, User } = require('../db/models');

/**
 * EmployeeAssignmentRepository – data-access layer for employee→manager assignments.
 */
class EmployeeAssignmentRepository extends BaseRepository {
  constructor() {
    super(employeeManagers, EmployeeManager);
  }

  // ─── User lookups (needed for role validation) ────────────────────────────

  /**
   * Find a user by primary key.
   * @param {string} userId
   * @returns {Promise<User|null>}
   */
  async findUserById(userId) {
    const rows = await this.db.select().from(users).where(eq(users.id, userId));
    return rows[0] ? new User(rows[0]) : null;
  }

  // ─── Assignment queries ───────────────────────────────────────────────────

  /**
   * Find the currently active assignment for an employee.
   * @param {string} employeeId
   * @returns {Promise<EmployeeManager|null>}
   */
  async findActiveAssignment(employeeId) {
    const rows = await this.db.select().from(employeeManagers).where(
      and(eq(employeeManagers.employeeId, employeeId), eq(employeeManagers.isActive, true))
    );
    return rows[0] ? new EmployeeManager(rows[0]) : null;
  }

  /**
   * Find an active assignment by both employeeId and managerId.
   * @param {string} employeeId
   * @param {string} managerId
   * @returns {Promise<EmployeeManager|null>}
   */
  async findActiveAssignmentByPair(employeeId, managerId) {
    const rows = await this.db.select().from(employeeManagers).where(
      and(
        eq(employeeManagers.employeeId, employeeId),
        eq(employeeManagers.managerId, managerId),
        eq(employeeManagers.isActive, true)
      )
    );
    return rows[0] ? new EmployeeManager(rows[0]) : null;
  }

  /**
   * Deactivate the currently active assignment for an employee.
   * @param {string} employeeId
   * @returns {Promise<any>}
   */
  async deactivateActiveAssignment(employeeId) {
    return this.db.update(employeeManagers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(eq(employeeManagers.employeeId, employeeId), eq(employeeManagers.isActive, true))
      );
  }

  /**
   * Create a new active assignment record.
   * @param {object} data
   * @returns {Promise<EmployeeManager>}
   */
  async createAssignment(data) {
    const rows = await this.db.insert(employeeManagers).values({
      employeeId: data.employeeId,
      managerId: data.managerId,
      assignedAt: new Date(),
      isActive: true,
      remarks: data.remarks || null,
    }).returning();
    return new EmployeeManager(rows[0]);
  }

  /**
   * Fetch all active assignments for a given manager.
   * @param {string} managerId
   * @returns {Promise<EmployeeManager[]>}
   */
  async findActiveAssignmentsByManager(managerId) {
    const rows = await this.db.select().from(employeeManagers).where(
      and(eq(employeeManagers.managerId, managerId), eq(employeeManagers.isActive, true))
    );
    return rows.map((r) => new EmployeeManager(r));
  }
}

module.exports = new EmployeeAssignmentRepository();
