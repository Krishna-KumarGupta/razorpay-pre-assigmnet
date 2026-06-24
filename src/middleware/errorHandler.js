'use strict';

const { Sequelize } = require('sequelize');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * 404 Not Found handler.
 * Mounted after all valid routes to catch unmatched paths.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.path}`, 404, 'ROUTE_NOT_FOUND'));
};

/**
 * Global error handler.
 * Must be registered LAST in the middleware chain (after all routes).
 * Express identifies a 4-argument function as an error handler.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // ── Sequelize Validation Error ──────────────────────────────────────────────
  if (err instanceof Sequelize.ValidationError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
  }

  // ── Sequelize Unique Constraint Error ───────────────────────────────────────
  if (err instanceof Sequelize.UniqueConstraintError) {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'A record with the provided data already exists';
    details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Sequelize Foreign Key Constraint Error ──────────────────────────────────
  if (err instanceof Sequelize.ForeignKeyConstraintError) {
    statusCode = 409;
    code = 'FOREIGN_KEY_CONSTRAINT';
    message = 'Operation violates a foreign key constraint';
  }

  // ── JWT Errors ───────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid or malformed authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // ── SyntaxError (malformed JSON body) ───────────────────────────────────────
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON in request body';
  }

  // ── Log ─────────────────────────────────────────────────────────────────────
  if (statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn({
      message: err.message,
      code,
      path: req.path,
      method: req.method,
    });
  }

  // ── Response ─────────────────────────────────────────────────────────────────
  const response = {
    success: false,
    code,
    message,
  };

  if (details) {
    response.details = details;
  }

  // Hide stack traces in production
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = { notFoundHandler, errorHandler };
