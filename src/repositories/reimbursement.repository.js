'use strict';

const { eq, and, asc, desc, sql, inArray } = require('drizzle-orm');
const BaseRepository = require('./base.repository');
const { reimbursements, users, employeeManagers } = require('../db/schema');
const { Reimbursement } = require('../db/models');

/**
 * ReimbursementRepository – data-access layer for the Reimbursement model.
 */
class ReimbursementRepository extends BaseRepository {
  constructor() {
    super(reimbursements, Reimbursement);
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  /**
   * Persist a new reimbursement record.
   * @param {object} data
   * @returns {Promise<Reimbursement>}
   */
  async createReimbursement(data) {
    const rows = await this.db.insert(reimbursements).values(data).returning();
    return new Reimbursement(rows[0]);
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /**
   * Find a reimbursement by its primary key.
   * @param {string} id
   * @returns {Promise<Reimbursement|null>}
   */
  async findReimbursementById(id) {
    const rows = await this.db.select().from(reimbursements).where(eq(reimbursements.id, id));
    return rows[0] ? new Reimbursement(rows[0]) : null;
  }

  /**
   * Find a reimbursement by employee and status.
   * @param {string} employeeId
   * @param {string} status
   * @returns {Promise<Reimbursement|null>}
   */
  async findPendingByEmployeeAndStatus(employeeId, status) {
    const rows = await this.db.select().from(reimbursements).where(
      and(eq(reimbursements.employeeId, employeeId), eq(reimbursements.status, status))
    );
    return rows[0] ? new Reimbursement(rows[0]) : null;
  }

  /**
   * EMP – own reimbursements, all statuses, newest first.
   * @param {string} employeeId
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: Reimbursement[] }>}
   */
  async findByEmployee(employeeId, { page = 1, limit = 50 } = {}) {
    const totalCountResult = await this.db.select({ count: sql`count(*)` })
      .from(reimbursements)
      .where(eq(reimbursements.employeeId, employeeId));

    const count = parseInt(totalCountResult[0]?.count || 0, 10);

    const rows = await this.db.select({
      reimbursement: reimbursements,
      employee: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      }
    })
      .from(reimbursements)
      .leftJoin(users, eq(reimbursements.employeeId, users.id))
      .where(eq(reimbursements.employeeId, employeeId))
      .orderBy(desc(reimbursements.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const mappedRows = rows.map((r) => {
      return new Reimbursement({
        ...r.reimbursement,
        employee: r.employee,
      });
    });

    return { count, rows: mappedRows };
  }

  /**
   * RM – PENDING reimbursements from direct reports only.
   * @param {string} managerId
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: Reimbursement[] }>}
   */
  async findPendingForManager(managerId, { page = 1, limit = 50 } = {}) {
    // Step 1 – resolve active direct-report IDs
    const assignments = await this.db.select({ employeeId: employeeManagers.employeeId })
      .from(employeeManagers)
      .where(and(eq(employeeManagers.managerId, managerId), eq(employeeManagers.isActive, true)));

    const employeeIds = assignments.map((a) => a.employeeId);

    if (employeeIds.length === 0) {
      return { count: 0, rows: [] };
    }

    // Step 2 – PENDING claims belonging to any of those employees
    const totalCountResult = await this.db.select({ count: sql`count(*)` })
      .from(reimbursements)
      .where(
        and(
          eq(reimbursements.status, 'PENDING'),
          inArray(reimbursements.employeeId, employeeIds)
        )
      );

    const count = parseInt(totalCountResult[0]?.count || 0, 10);

    const rows = await this.db.select({
      reimbursement: reimbursements,
      employee: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      }
    })
      .from(reimbursements)
      .leftJoin(users, eq(reimbursements.employeeId, users.id))
      .where(
        and(
          eq(reimbursements.status, 'PENDING'),
          inArray(reimbursements.employeeId, employeeIds)
        )
      )
      .orderBy(asc(reimbursements.submittedAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const mappedRows = rows.map((r) => {
      return new Reimbursement({
        ...r.reimbursement,
        employee: r.employee,
      });
    });

    return { count, rows: mappedRows };
  }

  /**
   * APE – reimbursements with status RM_APPROVED
   * CFO – reimbursements with status APE_APPROVED
   * @param {string} status
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: Reimbursement[] }>}
   */
  async findByStatus(status, { page = 1, limit = 50 } = {}) {
    const totalCountResult = await this.db.select({ count: sql`count(*)` })
      .from(reimbursements)
      .where(eq(reimbursements.status, status));

    const count = parseInt(totalCountResult[0]?.count || 0, 10);

    const rows = await this.db.select({
      reimbursement: reimbursements,
      employee: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      }
    })
      .from(reimbursements)
      .leftJoin(users, eq(reimbursements.employeeId, users.id))
      .where(eq(reimbursements.status, status))
      .orderBy(asc(reimbursements.submittedAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const mappedRows = rows.map((r) => {
      return new Reimbursement({
        ...r.reimbursement,
        employee: r.employee,
      });
    });

    return { count, rows: mappedRows };
  }

  /**
   * RM – reimbursements for a *specific* direct report.
   * @param {string} managerId
   * @param {string} targetEmployeeId
   * @param {{ page?: number, limit?: number }} opts
   * @returns {Promise<{ count: number, rows: Reimbursement[] } | null>}
   */
  async findByEmployeeForManager(managerId, targetEmployeeId, { page = 1, limit = 50 } = {}) {
    // Step 1 – verify direct-report relationship
    const assignments = await this.db.select({ id: employeeManagers.id })
      .from(employeeManagers)
      .where(
        and(
          eq(employeeManagers.managerId, managerId),
          eq(employeeManagers.employeeId, targetEmployeeId),
          eq(employeeManagers.isActive, true)
        )
      )
      .limit(1);

    if (assignments.length === 0) return null;

    // Step 2 – fetch claims
    const totalCountResult = await this.db.select({ count: sql`count(*)` })
      .from(reimbursements)
      .where(eq(reimbursements.employeeId, targetEmployeeId));

    const count = parseInt(totalCountResult[0]?.count || 0, 10);

    const rows = await this.db.select({
      reimbursement: reimbursements,
      employee: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      }
    })
      .from(reimbursements)
      .leftJoin(users, eq(reimbursements.employeeId, users.id))
      .where(eq(reimbursements.employeeId, targetEmployeeId))
      .orderBy(desc(reimbursements.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const mappedRows = rows.map((r) => {
      return new Reimbursement({
        ...r.reimbursement,
        employee: r.employee,
      });
    });

    return { count, rows: mappedRows };
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /**
   * Update the status of a reimbursement.
   * @param {string} reimbursementId
   * @param {string} newStatus
   * @param {object} [transaction] - Drizzle transaction context (tx)
   * @returns {Promise<any>}
   */
  async updateStatus(reimbursementId, newStatus, transaction = null) {
    const client = transaction || this.db;
    return client.update(reimbursements)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(reimbursements.id, reimbursementId));
  }
}

module.exports = new ReimbursementRepository();
