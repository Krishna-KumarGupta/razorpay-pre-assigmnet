'use strict';

const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/responseHelper');
const { clearTokenCookies, setAccessTokenCookie, setRefreshTokenCookie } = require('../utils/tokenHelper');

/**
 * AuthController – HTTP layer for authentication.
 *
 * Each method:
 *  1. Extracts data from req (body / cookies)
 *  2. Delegates to AuthService
 *  3. Sets cookies and sends a standardised response
 *
 * No business logic here. Keeping controllers thin (Single Responsibility).
 */
class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    return sendCreated(res, user, 'Account created successfully');
  });

  /**
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    return sendSuccess(res, user, 'Login successful');
  });

  /**
   * POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);
    clearTokenCookies(res);
    return sendSuccess(res, null, 'Logged out successfully');
  });

  /**
   * POST /api/v1/auth/refresh
   * Rotates the access token using the refresh token cookie.
   */
  refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refresh_token;
    const { accessToken } = await authService.refreshAccessToken(refreshToken);
    setAccessTokenCookie(res, accessToken);
    return sendSuccess(res, null, 'Token refreshed successfully');
  });

  /**
   * GET /api/v1/auth/me
   */
  me = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);
    return sendSuccess(res, user, 'Profile fetched successfully');
  });
}

module.exports = new AuthController();
