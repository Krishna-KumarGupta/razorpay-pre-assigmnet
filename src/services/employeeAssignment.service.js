'use strict';

const employeeAssignmentRepository = require('../repositories/employeeAssignment.repository');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * EmployeeAssignmentService – business logic for assigning/removing EMPs from RMs.
 *
 * SOLID notes:
 *  S – Solely manages the EMP↔RM relationship lifecycle.
 *  O – Role rules (EMP/RM checks) are encapsulated here; adding new role
 *      constraints doesn't touch repository or controller.
 *  D – Depends on the repository abstraction, not Sequelize models directly.
 *
 * Authorization (CFO-only) is handled upstream by the requireCFO middleware.
 *
 * Assignment lifecycle:
 *  POST  → deactivate existing active row (keeps history) + create new active row
 *  DELETE→ deactivate existing active row (keeps history) — no hard delete
 */
class EmployeeAssignmentService {

  // ─── Assign ────────────────────────────────────────────────────────────────

  /**
   * Assign an EMP to an RM.
   *
   * Business rules:
   *  1. Both users must exist.
   *  2. The first user must have role EMP.
   *  3. The second user must have role RM.
   *  4. If the exact same pairing is already active → idempotent no-op (no error).
   *  5. If the employee has a different active RM → deactivate old, create new.
   *
   * @param {{ employeeId: string, managerId: string, remarks?: string }} dto
   * @returns {Promise<object>} New assignment record with before/after context
   */
  async assign(dto) {
    const { employeeId, managerId, remarks } = dto;

    // 1. Verify both users exist
    const [employee, manager] = await Promise.all([
      employeeAssignmentRepository.findUserById(employeeId),
      employeeAssignmentRepository.findUserById(managerId),
    ]);

    if (!employee) {
      throw new NotFoundError(`Employee with id "${employeeId}" was not found.`);
    }
    if (!manager) {
      throw new NotFoundError(`Manager with id "${managerId}" was not found.`);
    }

    // 2. Validate roles
    if (employee.role !== 'EMP') {
      throw new BadRequestError(
        `User "${employeeId}" has role "${employee.role}". Only users with role EMP can be assigned to a manager.`,
        'INVALID_EMPLOYEE_ROLE'
      );
    }
    if (manager.role !== 'RM') {
      throw new BadRequestError(
        `User "${managerId}" has role "${manager.role}". Only users with role RM can be assigned as a manager.`,
        'INVALID_MANAGER_ROLE'
      );
    }

    // 3. Idempotency check — exact pairing already active
    const exactPair = await employeeAssignmentRepository.findActiveAssignmentByPair(
      employeeId,
      managerId
    );
    if (exactPair) {
      logger.info(
        `[EmployeeAssignmentService] assign no-op: ${employee.email} already reports to ${manager.email}`
      );
      return this._formatAssignment(exactPair, employee, manager, false);
    }

    // 4. Deactivate any existing active assignment (different RM)
    const existingAssignment = await employeeAssignmentRepository.findActiveAssignment(employeeId);
    if (existingAssignment) {
      await employeeAssignmentRepository.deactivateActiveAssignment(employeeId);
      logger.info(
        `[EmployeeAssignmentService] Deactivated previous assignment: ` +
        `${employee.email} → manager ${existingAssignment.managerId}`
      );
    }

    // 5. Create new active assignment
    const newAssignment = await employeeAssignmentRepository.createAssignment({
      employeeId,
      managerId,
      remarks,
    });

    logger.info(
      `[EmployeeAssignmentService] Assigned: ${employee.email} (EMP) → ${manager.email} (RM)`
    );

    return this._formatAssignment(newAssignment, employee, manager, true);
  }

  // ─── Remove ────────────────────────────────────────────────────────────────

  /**
   * Remove (soft-deactivate) the active EMP→RM assignment.
   *
   * Business rules:
   *  1. The target user must exist.
   *  2. The target user must have role EMP.
   *  3. An active assignment must exist to remove.
   *
   * Rows are NOT hard-deleted; isActive is set to false for the audit trail.
   *
   * @param {{ employeeId: string }} dto
   * @returns {Promise<object>} Details of the deactivated assignment
   */
  async remove(dto) {
    const { employeeId } = dto;

    // 1. User must exist
    const employee = await employeeAssignmentRepository.findUserById(employeeId);
    if (!employee) {
      throw new NotFoundError(`Employee with id "${employeeId}" was not found.`);
    }

    // 2. Must be EMP
    if (employee.role !== 'EMP') {
      throw new BadRequestError(
        `User "${employeeId}" has role "${employee.role}". Only EMP users can have assignments removed.`,
        'INVALID_EMPLOYEE_ROLE'
      );
    }

    // 3. Active assignment must exist
    const activeAssignment = await employeeAssignmentRepository.findActiveAssignment(employeeId);
    if (!activeAssignment) {
      throw new NotFoundError(
        `No active manager assignment found for employee "${employeeId}".`
      );
    }

    // 4. Soft-deactivate
    await employeeAssignmentRepository.deactivateActiveAssignment(employeeId);

    logger.info(
      `[EmployeeAssignmentService] Removed assignment: ${employee.email} (EMP) ` +
      `unassigned from manager ${activeAssignment.managerId}`
    );

    return {
      employeeId,
      employeeName: employee.name,
      employeeEmail: employee.email,
      previousManagerId: activeAssignment.managerId,
      removedAt: new Date().toISOString(),
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Format a consistent response shape for assignment operations.
   * @private
   */
  _formatAssignment(assignment, employee, manager, created) {
    return {
      id: assignment.id,
      created,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      managerId: manager.id,
      managerName: manager.name,
      managerEmail: manager.email,
      assignedAt: assignment.assignedAt,
      remarks: assignment.remarks,
    };
  }
}

module.exports = new EmployeeAssignmentService();
