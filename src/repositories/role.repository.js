'use strict';

const { eq } = require('drizzle-orm');
const BaseRepository = require('./base.repository');
const { users } = require('../db/schema');
const { User } = require('../db/models');

/**
 * RoleRepository – data-access layer for role-assignment operations.
 */
class RoleRepository extends BaseRepository {
  constructor() {
    super(users, User);
  }

  /**
   * Find a user by primary key.
   * @param {string} userId
   * @returns {Promise<User|null>}
   */
  async findById(userId) {
    const rows = await this.db.select().from(users).where(eq(users.id, userId));
    return rows[0] ? new User(rows[0]) : null;
  }

  /**
   * Update the role of a single user.
   * @param {string} userId
   * @param {string} newRole
   * @returns {Promise<any>}
   */
  async assignRole(userId, newRole) {
    return this.db.update(users)
      .set({
        role: newRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}

module.exports = new RoleRepository();
