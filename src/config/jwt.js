'use strict';

/**
 * JWT configuration.
 * Centralises all token-related settings so they are read from one place.
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',

  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  algorithm: 'HS256',

  /**
   * HttpOnly cookie options for the access token.
   * sameSite:'strict' prevents CSRF; secure:true ensures HTTPS-only in production.
   */
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE, 10) || 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  },

  /**
   * Separate, longer-lived cookie for the refresh token.
   */
  refreshCookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/api/v1/auth/refresh',      // Scope refresh token to the refresh endpoint only
  },
};

if (!jwtConfig.secret) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!jwtConfig.refreshSecret) {
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
}

module.exports = jwtConfig;
