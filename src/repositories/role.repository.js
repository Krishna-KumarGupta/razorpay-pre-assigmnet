'use strict';

const BaseRepository = require('./base.repository');
const User = require('../models/user.model');

/**
 * RoleRepository – data-access layer for role-assignment operations.
 *
 * Separated from UserRepository (Single Responsibility Principle):
 *  - UserRepository  → auth queries (find by email, refresh token management)
 *  - RoleRepository  → role mutation queries (assign, fetch for role checks)
 *
 * All raw Sequelize calls are confined here so the Service layer stays
 * ORM-agnostic and testable.
 */
class RoleRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find a user by primary key (default scope – no password).
   * Used to confirm the target user exists before mutating their role.
   *
   * @param {string} userId
   * @returns {Promise<User|null>}
   */
  async findById(userId) {
    return this.model.findByPk(userId);
  }

  /**
   * Update the role of a single user.
   *
   * Returns the number of affected rows so the caller can detect
   * "user not found" (0 rows) vs success (1 row).
   *
   * @param {string} userId
   * @param {string} newRole  - One of: EMP | RM | APE | CFO
   * @returns {Promise<[affectedCount: number]>}
   */
  async assignRole(userId, newRole) {
    return this.model.update(
      { role: newRole },
      { where: { id: userId } }
    );
  }
}

// Singleton – one instance shared across the service layer
module.exports = new RoleRepository();
