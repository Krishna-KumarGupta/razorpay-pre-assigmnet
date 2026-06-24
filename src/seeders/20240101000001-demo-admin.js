'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const hashedPassword = await bcrypt.hash('Admin@1234', saltRounds);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'Super Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        is_active: true,
        last_login_at: null,
        password_changed_at: null,
        refresh_token: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@example.com' });
  },
};
