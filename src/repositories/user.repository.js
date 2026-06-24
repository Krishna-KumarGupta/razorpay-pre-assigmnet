'use strict';

const BaseRepository = require('./base.repository');
const User = require('../models/user.model');

/**
 * UserRepository – data-access layer for the User model.
 *
 * Only query-building logic lives here.
 * Business rules (hashing, token rotation, etc.) belong in UserService.
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find a user by email address (default scope – no password).
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    return this.model.findOne({ where: { email } });
  }

  /**
   * Find a user by email and include the hashed password field.
   * Used only during authentication.
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmailWithPassword(email) {
    return this.model.scope('withPassword').findOne({ where: { email } });
  }

  /**
   * Find an active user by primary key.
   * @param {string} id
   * @returns {Promise<User|null>}
   */
  async findActiveById(id) {
    return this.model.scope('active').findByPk(id);
  }
}

// Export singleton – avoids multiple instantiations across the app
module.exports = new UserRepository();
