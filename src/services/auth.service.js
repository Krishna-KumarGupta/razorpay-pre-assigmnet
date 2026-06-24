'use strict';

const bcrypt = require('bcryptjs');

const userRepository = require('../repositories/user.repository');
const {
  signAccessToken,
  signRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearTokenCookies,
  verifyRefreshToken,
} = require('../utils/tokenHelper');
const { ConflictError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

/**
 * AuthService – all authentication business logic.
 *
 * SOLID notes:
 *  S – Single responsibility: this class only handles auth, nothing else.
 *  O – Open/closed: new auth strategies (OAuth, etc.) extend without change.
 *  D – Dependency inversion: depends on userRepository abstraction, not Sequelize directly.
 *
 * Deliberately cookie-free: cookie operations happen in the controller so
 * this service stays HTTP-agnostic and is testable without Express.
 */
class AuthService {
  // ─── Register ───────────────────────────────────────────────────────────────

  /**
   * Create a new user account.
   *
   * Steps:
   *  1. Guard: reject duplicate email.
   *  2. Hash the plain-text password with bcrypt.
   *  3. Persist the user record.
   *  4. Return a safe (password-free) view of the new user.
   *
   * @param {{ name: string, email: string, password: string, role?: string }} dto
   * @returns {Promise<object>} Safe user object
   * @throws {ConflictError} if email is already registered
   */
  async register(dto) {
    const { name, email, password } = dto;

    // Role is always EMP on registration.
    // Elevation to RM / APE / CFO requires POST /rest/roles/assign (CFO-gated).
    const role = 'EMP';

    // 1. Duplicate check
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError(
        `An account with the email "${email}" already exists.`,
        'EMAIL_TAKEN'
      );
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Persist
    const user = await userRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    logger.info(`[AuthService] New user registered: ${user.id} (${email})`);

    // 4. Return safe object (no password)
    return user.toSafeObject();
  }

  // ─── Login ──────────────────────────────────────────────────────────────────

  /**
   * Authenticate credentials and issue JWT tokens.
   *
   * Steps:
   *  1. Look up the user by email, including the stored password hash.
   *  2. Verify the plain-text password against the hash.
   *  3. Sign an access token and a refresh token.
   *  4. Store a bcrypt hash of the refresh token in the DB (stateful refresh).
   *  5. Return both tokens + safe user object.
   *
   * @param {{ email: string, password: string }} dto
   * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
   * @throws {UnauthorizedError} on bad credentials or inactive account
   */
  async login(dto) {
    const { email, password } = dto;

    // 1. Fetch user with password
    const user = await userRepository.findByEmailWithPassword(email);

    // Use a generic error to avoid user-enumeration attacks
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Contact support.');
    }

    // 2. Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // 3. Sign tokens
    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ id: user.id });

    // 4. Persist hashed refresh token (prevents token reuse if DB is compromised)
    const hashedRefreshToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await userRepository.updateRefreshToken(user.id, hashedRefreshToken);

    logger.info(`[AuthService] User logged in: ${user.id} (${email})`);

    // 5. Return tokens + safe user (caller sets cookies)
    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    };
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  /**
   * Invalidate the current session by clearing the stored refresh token.
   * The access token will expire naturally; cookies are cleared by the controller.
   *
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async logout(userId) {
    await userRepository.clearRefreshToken(userId);
    logger.info(`[AuthService] User logged out: ${userId}`);
  }

  // ─── Token Refresh ──────────────────────────────────────────────────────────

  /**
   * Issue a new access token given a valid, unexpired refresh token.
   *
   * Steps:
   *  1. Verify the refresh token signature and expiry.
   *  2. Load the user and their stored hashed refresh token.
   *  3. Compare the incoming raw token against the stored hash.
   *  4. Sign a new access token and return it.
   *
   * @param {string} rawRefreshToken - From the HttpOnly cookie
   * @returns {Promise<{ accessToken: string }>}
   * @throws {UnauthorizedError} on any mismatch or expired token
   */
  async refreshAccessToken(rawRefreshToken) {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token is missing.');
    }

    // 1. Verify signature (throws TokenExpiredError / JsonWebTokenError)
    const decoded = verifyRefreshToken(rawRefreshToken);

    // 2. Load user + stored hash
    const user = await userRepository.findByIdWithRefreshToken(decoded.id);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedError('Session expired. Please log in again.');
    }

    // 3. Compare raw token against stored bcrypt hash
    const tokenMatch = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!tokenMatch) {
      throw new UnauthorizedError('Invalid refresh token. Please log in again.');
    }

    // 4. Issue new access token
    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info(`[AuthService] Access token refreshed for user: ${user.id}`);

    return { accessToken };
  }

  // ─── Profile ────────────────────────────────────────────────────────────────

  /**
   * Return the currently authenticated user's profile.
   * @param {string} userId
   * @returns {Promise<object>}
   * @throws {NotFoundError}
   */
  async getProfile(userId) {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw new NotFoundError('User not found.');
    return user.toSafeObject();
  }
}

module.exports = new AuthService();
