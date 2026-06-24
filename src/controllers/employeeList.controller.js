'use strict';

const employeeListService = require('../services/employeeList.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/responseHelper');

/**
 * EmployeeListController – HTTP layer for GET /rest/employees.
 *
 * SOLID notes:
 *  S – Extracts from req, delegates to service, formats response.
 *  D – Depends only on EmployeeListService interface.
 *
 * Pagination:
 *  CFO receives paginated results (page/limit from query string).
 *  RM and APE receive their full (bounded) list in a standard success envelope.
 */
class EmployeeListController {
  /**
   * GET /rest/employees
   *
   * Visibility is role-driven entirely within the service.
   * The controller only handles HTTP concerns: query parsing + response shape.
   */
  list = asyncHandler(async (req, res) => {
    const actorId   = req.user.id;
    const actorRole = req.user.role;

    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const result = await employeeListService.listEmployees(actorId, actorRole, { page, limit });

    const users = result.data.map(u => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));

    return res.status(200).json({
      status: 'success',
      data: { users },
    });
  });
}

module.exports = new EmployeeListController();
