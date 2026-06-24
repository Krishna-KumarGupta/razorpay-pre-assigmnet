'use strict';

const { verifyAccessToken } = require('../utils/tokenHelper');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');

/**
 * authenticate – verifies the JWT stored in the HttpOnly access_token cookie.
 * Attaches the decoded user payload to req.user on success.
 *
 * Usage:
 *   router.get('/protected', authenticate, controller.handler);
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.access_token;

  if (!token) {
    throw new UnauthorizedError('No authentication token provided. Please log in.');
  }

  const decoded = verifyAccessToken(token);    // throws JsonWebTokenError / TokenExpiredError

  req.user = decoded;   // { id, email, role, iat, exp }
  next();
});

/**
 * authorize – role-based access control (RBAC) gate.
 * Must be used AFTER authenticate.
 *
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'user')
 * @returns {Function} Express middleware
 *
 * Usage:
 *   router.delete('/users/:id', authenticate, authorize('admin'), controller.handler);
 */
const authorize = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`
      );
    }

    next();
  });

/**
 * optionalAuthenticate – like authenticate but does NOT fail if no token is present.
 * Useful for routes that behave differently for authenticated vs anonymous users.
 */
const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.access_token;

  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Token invalid or expired – treat as anonymous
      req.user = null;
    }
  }

  next();
});

module.exports = { authenticate, authorize, optionalAuthenticate };
