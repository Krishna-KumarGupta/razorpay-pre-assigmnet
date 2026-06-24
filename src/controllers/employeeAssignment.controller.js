'use strict';

const employeeAssignmentService = require('../services/employeeAssignment.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/responseHelper');

/**
 * EmployeeAssignmentController – HTTP layer for EMP↔RM assignment management.
 *
 * SOLID notes:
 *  S – Extracts from req, delegates to EmployeeAssignmentService, formats res.
 *      Zero business or data logic lives here.
 *  D – Depends only on the service interface, not the repository or models.
 *
 * Authorization (CFO-only) is applied via requireCFO in the router.
 */
class EmployeeAssignmentController {
  /**
   * POST /rest/employees/assign
   *
   * Assigns an EMP to an RM.
   * Returns 201 Created on a new assignment, 200 OK when already assigned (no-op).
   */
  assign = asyncHandler(async (req, res) => {
    const { employeeId, managerId, remarks } = req.body;

    const result = await employeeAssignmentService.assign({ employeeId, managerId, remarks });

    if (result.created) {
      return sendCreated(
        res,
        result,
        `Employee "${result.employeeEmail}" successfully assigned to manager "${result.managerEmail}".`
      );
    }

    // Idempotent – no change was made
    return sendSuccess(
      res,
      result,
      `Employee "${result.employeeEmail}" is already assigned to manager "${result.managerEmail}". No change made.`
    );
  });

  /**
   * DELETE /rest/employees/assign
   *
   * Removes (soft-deactivates) the active EMP→RM assignment.
   * Body carries employeeId because DELETE with a body is unconventional
   * but correct for this domain (the resource being operated on is the
   * assignment, not the employee or manager individually).
   */
  remove = asyncHandler(async (req, res) => {
    const { employeeId } = req.body;

    const result = await employeeAssignmentService.remove({ employeeId });

    return sendSuccess(
      res,
      result,
      `Assignment removed: employee "${result.employeeEmail}" is no longer assigned to a manager.`
    );
  });
}

module.exports = new EmployeeAssignmentController();
