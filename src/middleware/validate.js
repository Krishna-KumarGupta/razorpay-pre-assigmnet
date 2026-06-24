'use strict';

const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * validate – middleware to run after express-validator check/body chains.
 * Collects all validation errors and throws a 422 ValidationError if any exist.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 *
 * Usage:
 *   router.post('/register', [...registerSchema, validate], AuthController.register);
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    throw new ValidationError('Input validation failed', details);
  }

  next();
};

module.exports = validate;
