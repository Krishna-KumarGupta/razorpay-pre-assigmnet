'use strict';

const { eq, and } = require('drizzle-orm');
const BaseRepository = require('./base.repository');
const { users } = require('../db/schema');
const { User } = require('../db/models');

/**
 * UserRepository – data-access layer for the User model.
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(users, User);
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /**
   * Find a user by email address.
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    const rows = await this.db.select().from(users).where(eq(users.email, email));
    return rows[0] ? new User(rows[0]) : null;
  }

  /**
   * Find a user by email AND include the hashed password column.
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmailWithPassword(email) {
    // Drizzle selects all columns by default
    const rows = await this.db.select().from(users).where(eq(users.email, email));
    return rows[0] ? new User(rows[0]) : null;
  }

  /**
   * Find an active (non-deactivated) user by primary key.
   * @param {string} id
   * @returns {Promise<User|null>}
   */
  async findActiveById(id) {
    const rows = await this.db.select().from(users).where(
      and(eq(users.id, id), eq(users.isActive, true))
    );
    return rows[0] ? new User(rows[0]) : null;
  }

  // ─── Write ─────────────────────────────────────────────────────────────────

  /**
   * Persist the hashed refresh token and update lastLoginAt.
   * @param {string} userId
   * @param {string} hashedRefreshToken
   * @returns {Promise<any>}
   */
  async updateRefreshToken(userId, hashedRefreshToken) {
    return this.db.update(users)
      .set({
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Clear the stored refresh token.
   * @param {string} userId
   * @returns {Promise<any>}
   */
  async clearRefreshToken(userId) {
    return this.db.update(users)
      .set({
        refreshToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Find a user by id and include the stored refresh token.
   * @param {string} userId
   * @returns {Promise<User|null>}
   */
  async findByIdWithRefreshToken(userId) {
    const rows = await this.db.select().from(users).where(eq(users.id, userId));
    return rows[0] ? new User(rows[0]) : null;
  }

  /**
   * Create a new user.
   * @param {object} data
   * @returns {Promise<User>}
   */
  async create(data) {
    const rows = await this.db.insert(users).values(data).returning();
    return new User(rows[0]);
  }
}

module.exports = new UserRepository();
