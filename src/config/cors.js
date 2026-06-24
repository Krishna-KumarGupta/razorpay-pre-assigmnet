'use strict';

/**
 * CORS configuration.
 * Reads allowed origins from the ALLOWED_ORIGINS env variable (comma-separated).
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy: Origin "${origin}" is not allowed.`));
  },
  credentials: true,           // Required for cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page'],
  optionsSuccessStatus: 200,   // Some legacy browsers choke on 204
  maxAge: 86400,               // Preflight cache: 24h
};

module.exports = corsOptions;
