'use strict';

const userRepository = require('../repositories/user.repository');
const { NotFoundError, ConflictError, UnauthorizedError } = require('../utils/errors');
const {
  signAccessToken,
  signRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearTokenCookies,
  verifyRefreshToken,
} = require('../utils/tokenHelper');
const logger = require('../utils/logger');

/**
 * AuthService – orchestrates authentication business logic.
 *
 * Depends on UserRepository (injected via import) and token utilities.
 * Never touches Express req/res – that is the controller's responsibility.
 *
 * NOTE: Business logic (bcrypt hashing, DB writes) will be added in
 * subsequent tasks. Stub methods are provided to define the public interface.
 */
class AuthService {
  /**
   * Register a new user.
   * @param {object} dto  - { name, email, password, role? }
   * @returns {Promise<User>} Created user (safe object, no password)
   */
  async register(dto) {
    // TODO: implement registration logic
    // 1. Check for existing email
    // 2. Hash password with bcrypt
    // 3. Create user record
    // 4. Return safe user object
    throw new Error('AuthService.register not yet implemented');
  }

  /**
   * Authenticate a user and return signed tokens.
   * @param {object} dto  - { email, password }
   * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
   */
  async login(dto) {
    // TODO: implement login logic
    // 1. Find user by email with password
    // 2. Compare password with bcrypt
    // 3. Update lastLoginAt
    // 4. Sign access + refresh tokens
    // 5. Store hashed refresh token on user record
    throw new Error('AuthService.login not yet implemented');
  }

  /**
   * Rotate the access token using a valid refresh token.
   * @param {string} refreshToken - Raw refresh token from cookie
   * @returns {Promise<{ accessToken: string }>}
   */
  async refreshAccessToken(refreshToken) {
    // TODO: implement token rotation
    // 1. Verify refresh token
    // 2. Find user and compare stored hashed refresh token
    // 3. Sign new access token
    throw new Error('AuthService.refreshAccessToken not yet implemented');
  }

  /**
   * Invalidate the user session (clear refresh token in DB).
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async logout(userId) {
    // TODO: implement logout
    // 1. Nullify refresh_token in DB
    throw new Error('AuthService.logout not yet implemented');
  }

  /**
   * Return the currently authenticated user profile.
   * @param {string} userId
   * @returns {Promise<User>}
   */
  async getProfile(userId) {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw new NotFoundError('User not found');
    return user.toSafeObject ? user.toSafeObject() : user;
  }
}

module.exports = new AuthService();
