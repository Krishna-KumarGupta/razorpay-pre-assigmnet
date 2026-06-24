'use strict';

/**
 * Standardised API response helpers.
 * All controllers must use these helpers to ensure a consistent response envelope.
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {*} data        - Payload to return
 * @param {string} message
 * @param {number} statusCode
 * @param {object} meta   - Optional pagination or extra metadata
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a created (201) response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} message
 */
const sendCreated = (res, data = null, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send a paginated list response.
 * @param {import('express').Response} res
 * @param {Array} items
 * @param {number} total   - Total record count
 * @param {number} page
 * @param {number} limit
 * @param {string} message
 */
const sendPaginated = (res, items, total, page, limit, message = 'Success') => {
  return sendSuccess(res, items, message, 200, {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * Send a no-content (204) response.
 * @param {import('express').Response} res
 */
const sendNoContent = (res) => {
  return res.status(204).send();
};

module.exports = { sendSuccess, sendCreated, sendPaginated, sendNoContent };
