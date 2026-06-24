'use strict';

const userRepository = require('../repositories/user.repository');
const { NotFoundError } = require('../utils/errors');

/**
 * UserService – orchestrates user management business logic.
 *
 * Stub methods define the public interface.
 * Concrete implementations will be added in subsequent tasks.
 */
class UserService {
  /**
   * List users with pagination.
   * @param {object} query - { page, limit, role, isActive }
   * @returns {Promise<{ users: Array, total: number, page: number, limit: number }>}
   */
  async listUsers(query = {}) {
    // TODO: implement pagination and filtering
    throw new Error('UserService.listUsers not yet implemented');
  }

  /**
   * Get a single user by ID.
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getUserById(userId) {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw new NotFoundError(`User with id "${userId}" not found`);
    return user;
  }

  /**
   * Update a user's profile data.
   * @param {string} userId
   * @param {object} dto  - Fields to update (name, email, …)
   * @returns {Promise<object>} Updated user
   */
  async updateUser(userId, dto) {
    // TODO: implement update logic
    throw new Error('UserService.updateUser not yet implemented');
  }

  /**
   * Soft-delete or deactivate a user.
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    // TODO: implement deletion / deactivation
    throw new Error('UserService.deleteUser not yet implemented');
  }

  /**
   * Change a user's password.
   * @param {string} userId
   * @param {object} dto - { currentPassword, newPassword }
   * @returns {Promise<void>}
   */
  async changePassword(userId, dto) {
    // TODO: implement password change
    throw new Error('UserService.changePassword not yet implemented');
  }
}

module.exports = new UserService();
