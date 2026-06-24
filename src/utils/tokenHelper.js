'use strict';

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Token utility – wraps jsonwebtoken to enforce consistent algorithm and config.
 */

/**
 * Sign a new access token.
 * @param {object} payload - Data to embed in the token
 * @returns {string} Signed JWT
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: jwtConfig.algorithm,
  });
};

/**
 * Sign a new refresh token.
 * @param {object} payload
 * @returns {string} Signed JWT
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
    algorithm: jwtConfig.algorithm,
  });
};

/**
 * Verify an access token.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtConfig.secret, {
    algorithms: [jwtConfig.algorithm],
  });
};

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, jwtConfig.refreshSecret, {
    algorithms: [jwtConfig.algorithm],
  });
};

/**
 * Decode a token without verification (for inspecting expired tokens).
 * @param {string} token
 * @returns {object|null}
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Set the access token as an HttpOnly cookie on the response.
 * @param {import('express').Response} res
 * @param {string} token
 */
const setAccessTokenCookie = (res, token) => {
  res.cookie('access_token', token, jwtConfig.cookieOptions);
};

/**
 * Set the refresh token as an HttpOnly cookie on the response.
 * @param {import('express').Response} res
 * @param {string} token
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refresh_token', token, jwtConfig.refreshCookieOptions);
};

/**
 * Clear both token cookies (used on logout).
 * @param {import('express').Response} res
 */
const clearTokenCookies = (res) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearTokenCookies,
};
