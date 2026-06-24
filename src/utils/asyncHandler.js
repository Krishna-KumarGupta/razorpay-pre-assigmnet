'use strict';

/**
 * Async handler wrapper.
 * Eliminates repetitive try/catch in every controller by forwarding
 * rejected promises to Express's next(error) handler.
 *
 * @param {Function} fn - Async route handler (req, res, next)
 * @returns {Function} Express-compatible middleware
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await UserService.findAll();
 *   res.json(users);
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
