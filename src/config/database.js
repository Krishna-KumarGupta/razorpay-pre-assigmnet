'use strict';

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const isLocal = process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'));

const sslConfig = isLocal
  ? false
  : {
      require: true,
      rejectUnauthorized: false,
    };

/**
 * Database configuration object keyed by environment.
 * Reads values from environment variables so nothing sensitive is hardcoded.
 */
const dbConfig = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      connectTimeout: 20000,
      ...(sslConfig ? { ssl: sslConfig } : {}),
    },
  },
  test: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    dialectOptions: {
      ...(sslConfig ? { ssl: sslConfig } : {}),
    },
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ...(sslConfig ? { ssl: sslConfig } : {}),
    },
  },
};

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

if (!process.env.DATABASE_URL) {
  logger.error('❌ DATABASE_URL environment variable is not defined!');
}

/**
 * Singleton Sequelize instance shared across the application.
 */
const sequelize = new Sequelize(process.env.DATABASE_URL || '', config);

/**
 * Authenticate and verify the database connection.
 * Called once at server startup.
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  try {
    await sequelize.authenticate();
    let connectionInfo = 'Supabase PostgreSQL';
    if (process.env.DATABASE_URL) {
      try {
        const parsedUrl = new URL(process.env.DATABASE_URL);
        connectionInfo = `${parsedUrl.host}${parsedUrl.pathname}`;
      } catch (e) {
        // ignore
      }
    }
    logger.info(`✅ PostgreSQL connected: ${connectionInfo}`);

    if (process.env.NODE_ENV === 'development') {
      // Sync models in development (alter: true is safe for dev, never use in production)
      // await sequelize.sync({ alter: true });
    }
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  connectDatabase,
  ...dbConfig,           // Sequelize CLI reads this export for migrations
};
