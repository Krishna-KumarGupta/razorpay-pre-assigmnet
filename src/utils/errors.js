'use strict';

/**
 * Application-wide custom error classes.
 * Extend these in feature modules for domain-specific error semantics.
 */

/**
 * Base application error.
 * All custom errors should extend this class.
 */
class AppError extends Error {
  /**
   * @param {string} message    - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code       - Machine-readable error code (e.g. 'USER_NOT_FOUND')
   * @param {object} details    - Optional extra context (e.g. validation errors)
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;   // Distinguishes known errors from programmer bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 Bad Request */
class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST', details = null) {
    super(message, 400, code, details);
  }
}

/** 401 Unauthorized */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

/** 403 Forbidden */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

/** 404 Not Found */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

/** 409 Conflict */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

/** 422 Unprocessable Entity */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

/** 429 Too Many Requests */
class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests, please try again later.') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

/** 503 Service Unavailable */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  ServiceUnavailableError,
};
