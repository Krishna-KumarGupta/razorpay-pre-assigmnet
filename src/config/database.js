'use strict';

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Database configuration object keyed by environment.
 * Reads values from environment variables so nothing sensitive is hardcoded.
 */
const dbConfig = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'razorpay_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
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
    },
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME + '_test' || 'razorpay_db_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,  // Enforce TLS cert validation — never disable in production
      },
    },
  },
};

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

/**
 * Singleton Sequelize instance shared across the application.
 */
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

/**
 * Authenticate and verify the database connection.
 * Called once at server startup.
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  try {
    await sequelize.authenticate();
    logger.info(`✅ PostgreSQL connected: ${config.host}:${config.port}/${config.database}`);

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
