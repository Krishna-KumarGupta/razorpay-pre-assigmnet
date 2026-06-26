'use strict';

// Load environment variables
require('dotenv').config();

const app = require('../src/app');
const { connectDatabase } = require('../src/config/database');

// Initialize database connection asynchronously
connectDatabase().catch((err) => {
  console.error('Database connection failed:', err);
});

module.exports = app;
