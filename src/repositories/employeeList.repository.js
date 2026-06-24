'use strict';

const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');
const User = require('../models/user.model');
const EmployeeManager = require('../models/employeeManager.model');

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
   * @returns {Promise<User[]>}  – active direct reports (role = EMP)
   */
  async findDirectReports(managerId) {
    return User.findAll({
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
    });
  }

  /**
   * APE – fetch all users with role EMP or RM.
   *
   * Strategy: simple WHERE clause on the role ENUM column, which is indexed.
   * No join required; expected to be fast even at large user counts.
   *
   * @returns {Promise<User[]>}
   */
  async findEmpAndRmUsers() {
    return User.findAll({
      where: {
        role: { [Op.in]: ['EMP', 'RM'] },
        isActive: true,
      },
      attributes: { exclude: ['password', 'refreshToken', 'passwordChangedAt'] },
      order: [
        ['role', 'ASC'],   // EMP first, then RM
        ['name', 'ASC'],
      ],
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
