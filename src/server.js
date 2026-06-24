'use strict';

require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDatabase, sequelize } = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 7002;
let server;

/**
 * Normalize port into a number, string, or false.
 * @param {string|number} val
 * @returns {number|string|boolean}
 */
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;       // named pipe
  if (port >= 0) return port;        // port number
  return false;
}

/**
 * Event listener for HTTP server "error" event.
 * @param {NodeJS.ErrnoException} error
 */
function onError(error) {
  if (error.syscall !== 'listen') throw error;

  const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`🚀 Server listening on ${bind} in ${process.env.NODE_ENV} mode`);
}

async function startServer() {
  try {
    // Initialize database connection
    await connectDatabase();

    const port = normalizePort(PORT);
    app.set('port', port);

    server = http.createServer(app);

    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);

    // Graceful shutdown: close HTTP server first, then close the DB pool.
    // Without closing the pool, the DB server must wait for its idle timeout
    // to reclaim connections after the process exits.
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await sequelize.close();
          logger.info('Database connection pool closed.');
        } catch (err) {
          logger.error('Error closing database pool:', err);
        }
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
