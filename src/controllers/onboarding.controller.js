'use strict';

const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/responseHelper');
const {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearTokenCookies,
} = require('../utils/tokenHelper');

/**
 * OnboardingController – HTTP layer for registration, login, and logout.
 *
 * SOLID notes:
 *  S – Single responsibility: extracts from req, delegates to service, writes res.
 *      Zero business logic lives here.
 *  O – Adding new onboarding flows (SSO, magic-link) doesn't touch this class.
 *  D – Depends on AuthService interface, not on any model or ORM directly.
 *
 * Cookie lifecycle ownership:
 *  Cookies are set/cleared HERE (controller) so AuthService stays HTTP-agnostic
 *  and can be unit-tested without Express.
 */
class OnboardingController {
  /**
   * POST /rest/onboardings/register
   *
   * Creates a new user account.
   * Returns 201 with the safe user object (no tokens — user must log in separately).
   */
  register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);

    return sendCreated(res, { user }, 'Account created successfully. Please log in.');
  });

  /**
   * POST /rest/onboardings/login
   *
   * Verifies credentials, issues JWT access + refresh tokens,
   * and sets both as HttpOnly cookies.
   */
  login = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    // Set HttpOnly cookies — inaccessible to JavaScript (XSS protection)
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    return sendSuccess(res, { user }, 'Login successful.');
  });

  /**
   * POST /rest/onboardings/logout
   *
   * Invalidates the server-side session and clears both cookies.
   * Requires a valid access_token cookie (authenticate middleware applied in router).
   */
  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);

    // Clear HttpOnly cookies from the browser
    clearTokenCookies(res);

    return sendSuccess(res, null, 'You have been logged out successfully.');
  });
}

module.exports = new OnboardingController();
