'use strict';

const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');
const { User, EmployeeManager } = require('../models');

/**
 * EmployeeListRepository – optimised read queries for the GET /rest/employees endpoint.
 *
 * Three distinct query strategies are defined here (SRP / OCP):
 *  - findDirectReports   → RM visibility  (JOIN on employee_managers)
 *  - findEmpAndRmUsers   → APE visibility (WHERE role IN ('EMP','RM'))
 *  - findAllUsers        → CFO visibility (no filter, full table)
 *
 * Each method returns only the fields safe to expose (password excluded via default scope).
 * Callers in the service layer pick the correct method based on the actor's role.
 */
class EmployeeListRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * RM – fetch only the employees directly assigned to the requesting RM.
   *
   * Strategy: single JOIN query between `users` and `employee_managers`.
   * The partial unique index on (employee_id WHERE is_active=TRUE) makes
   * the join O(n) rather than O(n²).
   *
   * @param {string} managerId   – ID of the logged-in RM
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: User[] }>}
   */
  async findDirectReports(managerId, { page = 1, limit = 50 } = {}) {
    return User.findAndCountAll({
      where: { isActive: true },  // Only return active employees (guard against deactivated users whose assignment is still present)
      include: [
        {
          model: EmployeeManager,
          as: 'managerAssignments',
          where: {
            managerId,
            isActive: true,
          },
          attributes: ['assignedAt', 'remarks'],  // expose assignment metadata
          required: true,                          // INNER JOIN – only assigned employees
        },
      ],
      attributes: { exclude: ['password', 'refreshToken', 'passwordChangedAt'] },
      order: [['name', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });
  }

  /**
   * APE – fetch all users with role EMP or RM.
   *
   * Strategy: simple WHERE clause on the role ENUM column, which is indexed.
   * No join required; expected to be fast even at large user counts.
   *
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: User[] }>}
   */
  async findEmpAndRmUsers({ page = 1, limit = 50 } = {}) {
    return User.findAndCountAll({
      where: {
        role: { [Op.in]: ['EMP', 'RM'] },
        isActive: true,
      },
      attributes: { exclude: ['password', 'refreshToken', 'passwordChangedAt'] },
      order: [
        ['role', 'ASC'],   // EMP first, then RM
        ['name', 'ASC'],
      ],
      limit,
      offset: (page - 1) * limit,
    });
  }

  /**
   * CFO – fetch every user (all roles, active and inactive).
   *
   * Strategy: full table scan with no WHERE clause.
   * Appropriate for CFO who has unrestricted visibility.
   *
   * @param {{ page?: number, limit?: number }} options – optional pagination
   * @returns {Promise<{ count: number, rows: User[] }>}
   */
  async findAllUsers({ page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;

    return User.findAndCountAll({
      attributes: { exclude: ['password', 'refreshToken', 'passwordChangedAt'] },
      order: [
        ['role',  'ASC'],
        ['name',  'ASC'],
      ],
      limit,
      offset,
    });
  }
}

module.exports = new EmployeeListRepository();
