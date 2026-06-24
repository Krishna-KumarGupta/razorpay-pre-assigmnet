'use strict';

const { DataTypes } = require('sequelize');

/**
 * Migration: Create reimbursements table.
 *
 * Stores one reimbursement claim per row.
 * Status column tracks the approval lifecycle.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ── 1. Create ENUM types first (PostgreSQL requires explicit type creation) ──
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_reimbursements_category" AS ENUM (
        'TRAVEL', 'ACCOMMODATION', 'FOOD', 'OFFICE_SUPPLIES',
        'COMMUNICATION', 'TRAINING', 'MEDICAL', 'OTHER'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_reimbursements_status" AS ENUM (
        'DRAFT', 'PENDING',
        'RM_APPROVED', 'RM_REJECTED',
        'APE_APPROVED', 'APE_REJECTED',
        'CFO_APPROVED', 'CFO_REJECTED',
        'PAID', 'CANCELLED'
      );
    `);

    // ── 2. Create the table ───────────────────────────────────────────────────
    await queryInterface.createTable('reimbursements', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'FK → users (role = EMP)',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(
          'TRAVEL', 'ACCOMMODATION', 'FOOD', 'OFFICE_SUPPLIES',
          'COMMUNICATION', 'TRAINING', 'MEDICAL', 'OTHER'
        ),
        allowNull: false,
        defaultValue: 'OTHER',
      },
      status: {
        type: DataTypes.ENUM(
          'DRAFT', 'PENDING',
          'RM_APPROVED', 'RM_REJECTED',
          'APE_APPROVED', 'APE_REJECTED',
          'CFO_APPROVED', 'CFO_REJECTED',
          'PAID', 'CANCELLED'
        ),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      receipt_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expense_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      employee_remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // ── 3. Indexes ────────────────────────────────────────────────────────────
    await queryInterface.addIndex('reimbursements', ['employee_id'], {
      name: 'reimb_employee_id_idx',
    });

    await queryInterface.addIndex('reimbursements', ['status'], {
      name: 'reimb_status_idx',
    });

    await queryInterface.addIndex('reimbursements', ['category'], {
      name: 'reimb_category_idx',
    });

    await queryInterface.addIndex('reimbursements', ['expense_date'], {
      name: 'reimb_expense_date_idx',
    });

    await queryInterface.addIndex('reimbursements', ['employee_id', 'status'], {
      name: 'reimb_employee_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('reimbursements', 'reimb_employee_id_idx');
    await queryInterface.removeIndex('reimbursements', 'reimb_status_idx');
    await queryInterface.removeIndex('reimbursements', 'reimb_category_idx');
    await queryInterface.removeIndex('reimbursements', 'reimb_expense_date_idx');
    await queryInterface.removeIndex('reimbursements', 'reimb_employee_status_idx');
    await queryInterface.dropTable('reimbursements');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_reimbursements_category";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_reimbursements_status";`);
  },
};
