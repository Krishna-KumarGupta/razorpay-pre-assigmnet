'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Seeder: Create the default CFO account.
 *
 * Idempotent – the `up` method checks for an existing row with the target
 * email before inserting, so running `db:seed:all` multiple times is safe.
 *
 * Credentials:
 *   email    : cfo@org.com
 *   password : CFO#ORG@April2026   (stored as bcrypt hash)
 *   role     : CFO
 */

const CFO_EMAIL = 'cfo@org.com';
const CFO_PASSWORD = 'CFO#ORG@April2026';
const SALT_ROUNDS = 12;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ── Duplicate guard ────────────────────────────────────────────────────────
    // Select only the email column so the query is lightweight even if the
    // users table grows very large.
    const [rows] = await queryInterface.sequelize.query(
      `SELECT email FROM users WHERE email = :email LIMIT 1;`,
      {
        replacements: { email: CFO_EMAIL },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    if (rows) {
      // `rows` is the first result object when QueryTypes.SELECT is used
      console.log(`[seeder] CFO account already exists (${CFO_EMAIL}). Skipping.`);
      return;
    }

    // ── Hash password ──────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(CFO_PASSWORD, SALT_ROUNDS);
    const now = new Date();

    // ── Insert ─────────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'CFO',
        email: CFO_EMAIL,
        password: hashedPassword,
        role: 'CFO',
        is_active: true,
        last_login_at: null,
        password_changed_at: null,
        refresh_token: null,
        created_at: now,
        updated_at: now,
      },
    ]);

    console.log(`[seeder] CFO account created successfully (${CFO_EMAIL}).`);
  },

  async down(queryInterface) {
    // Remove only the seeded CFO row — does not touch any other CFO users
    // that may have been created through the application.
    await queryInterface.bulkDelete(
      'users',
      { email: CFO_EMAIL },
      {}
    );

    console.log(`[seeder] CFO account removed (${CFO_EMAIL}).`);
  },
};
