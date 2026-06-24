'use strict';

const BaseRepository = require('./base.repository');
const { User } = require('../models');

/**
 * UserRepository – data-access layer for the User model.
 *
 * Only query-building logic lives here.
 * Business rules (hashing, token rotation, etc.) belong in the Service layer.
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /**
   * Find a user by email address.
   * Uses the default scope – password field is excluded.
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    return this.model.findOne({ where: { email } });
  }

  /**
   * Find a user by email AND include the hashed password column.
   * Should be called ONLY during credential verification (login).
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmailWithPassword(email) {
    return this.model.scope('withPassword').findOne({ where: { email } });
  }

  /**
   * Find an active (non-deactivated) user by primary key.
   * @param {string} id
   * @returns {Promise<User|null>}
   */
  async findActiveById(id) {
    return this.model.scope('active').findByPk(id);
  }

  // ─── Write ─────────────────────────────────────────────────────────────────

  /**
   * Persist the hashed refresh token and update lastLoginAt.
   * Called after a successful login to bind the session to this device.
   *
   * @param {string} userId
   * @param {string} hashedRefreshToken  - bcrypt hash of the raw refresh token
   * @returns {Promise<[number]>}
   */
  async updateRefreshToken(userId, hashedRefreshToken) {
    return this.model.update(
      {
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date(),
      },
      { where: { id: userId } }
    );
  }

  /**
   * Clear the stored refresh token (logout / token rotation invalidation).
   * @param {string} userId
   * @returns {Promise<[number]>}
   */
  async clearRefreshToken(userId) {
    return this.model.update(
      { refreshToken: null },
      { where: { id: userId } }
    );
  }

  /**
   * Find a user by id and include the stored refresh token.
   * Used during token rotation to verify the incoming refresh token matches.
   * @param {string} userId
   * @returns {Promise<User|null>}
   */
  async findByIdWithRefreshToken(userId) {
    return this.model.scope('withRefreshToken').findByPk(userId);
  }
}

// Export singleton – avoids multiple instantiations across the app
module.exports = new UserRepository();
