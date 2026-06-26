'use strict';

// Load environment variables
require('dotenv').config();

const app = require('../src/app');
const { db } = require('../src/db/db');
const { sql } = require('drizzle-orm');

// Initialize database connection asynchronously
db.execute(sql`SELECT 1`)
  .then(() => {
    console.log('✅ PostgreSQL connected successfully via Drizzle (Vercel serverless)');
  })
  .catch((err) => {
    console.error('❌ Database connection failed (Vercel serverless):', err);
  });

module.exports = app;
