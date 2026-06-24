'use strict';

const winston = require('winston');

const { combine, timestamp, errors, printf, colorize, json } = winston.format;

/**
 * Custom log format for development – human-readable with colours.
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);

/**
 * Production format – structured JSON for log aggregators (e.g. Datadog, ELK).
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const transports = [
  new winston.transports.Console(),
];

if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5_242_880,   // 5 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10_485_760,  // 10 MB
      maxFiles: 10,
    })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports,
  exitOnError: false,
});

module.exports = logger;
