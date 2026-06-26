'use strict';

const { eq, and, asc, sql, inArray } = require('drizzle-orm');
const BaseRepository = require('./base.repository');
const { users, employeeManagers } = require('../db/schema');
const { User } = require('../db/models');

/**
 * EmployeeListRepository – optimised read queries for the GET /rest/employees endpoint.
 */
class EmployeeListRepository extends BaseRepository {
  constructor() {
    super(users, User);
  }

  /**
   * RM – fetch only the employees directly assigned to the requesting RM.
   * @param {string} managerId
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: User[] }>}
   */
  async findDirectReports(managerId, { page = 1, limit = 50 } = {}) {
    const totalCountResult = await this.db.select({ count: sql`count(*)` })
      .from(users)
      .innerJoin(employeeManagers, and(
        eq(employeeManagers.employeeId, users.id),
        eq(employeeManagers.managerId, managerId),
        eq(employeeManagers.isActive, true)
      ))
      .where(eq(users.isActive, true));

    const count = parseInt(totalCountResult[0]?.count || 0, 10);

    const rows = await this.db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      assignedAt: employeeManagers.assignedAt,
      remarks: employeeManagers.remarks,
    })
      .from(users)
      .innerJoin(employeeManagers, and(
        eq(employeeManagers.employeeId, users.id),
        eq(employeeManagers.managerId, managerId),
        eq(employeeManagers.isActive, true)
      ))
      .where(eq(users.isActive, true))
      .orderBy(asc(users.name))
      .limit(limit)
      .offset((page - 1) * limit);

    const mappedRows = rows.map((row) => {
      const user = new User({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      // Expose assignment metadata nested as an array (matches Sequelize include structure)
      user.managerAssignments = [
        {
          assignedAt: row.assignedAt,
          remarks: row.remarks,
        }
      ];
      return user;
    });

    return { count, rows: mappedRows };
  }

  /**
   * APE – fetch all users with role EMP or RM.
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: User[] }>}
   */
  async findEmpAndRmUsers({ page = 1, limit = 50 } = {}) {
    const totalCountResult = await this.db.select({ count: sql`count(*)` })
      .from(users)
      .where(
        and(
          inArray(users.role, ['EMP', 'RM']),
          eq(users.isActive, true)
        )
      );

    const count = parseInt(totalCountResult[0]?.count || 0, 10);

    const rows = await this.db.select().from(users)
      .where(
        and(
          inArray(users.role, ['EMP', 'RM']),
          eq(users.isActive, true)
        )
      )
      .orderBy(asc(users.role), asc(users.name))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      count,
      rows: rows.map((r) => new User(r)),
    };
  }

  /**
   * CFO – fetch every user.
   * @param {{ page?: number, limit?: number }} options
   * @returns {Promise<{ count: number, rows: User[] }>}
   */
  async findAllUsers({ page = 1, limit = 50 } = {}) {
    const totalCountResult = await this.db.select({ count: sql`count(*)` }).from(users);
    const count = parseInt(totalCountResult[0]?.count || 0, 10);

    const rows = await this.db.select().from(users)
      .orderBy(asc(users.role), asc(users.name))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      count,
      rows: rows.map((r) => new User(r)),
    };
  }
}

module.exports = new EmployeeListRepository();
