'use strict';

const { DataTypes } = require('sequelize');

/**
 * Migration: Create reimbursement_approvals table.
 *
 * Immutable audit log – rows are INSERT-only.
 * Every approver action (approve / reject / return) produces one row.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ── 1. ENUM types ─────────────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_reimbursement_approvals_approval_level" AS ENUM ('RM', 'APE', 'CFO');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_reimbursement_approvals_action" AS ENUM ('APPROVED', 'REJECTED', 'RETURNED');
    `);

    // ── 2. Table ──────────────────────────────────────────────────────────────
    await queryInterface.createTable('reimbursement_approvals', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      reimbursement_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'reimbursements', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'FK → reimbursements',
      },
      approver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'FK → users (the person who took this action)',
      },
      approval_level: {
        type: DataTypes.ENUM('RM', 'APE', 'CFO'),
        allowNull: false,
        comment: 'Which gate: RM (1st), APE (2nd), CFO (3rd)',
      },
      action: {
        type: DataTypes.ENUM('APPROVED', 'REJECTED', 'RETURNED'),
        allowNull: false,
        comment: 'Action taken',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Approver\'s comments',
      },
      action_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Exact timestamp of this action',
      },
      previous_status: {
        type: DataTypes.STRING(30),
        allowNull: true,
        comment: 'Reimbursement.status before this action',
      },
      new_status: {
        type: DataTypes.STRING(30),
        allowNull: true,
        comment: 'Reimbursement.status after this action',
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
    await queryInterface.addIndex('reimbursement_approvals', ['reimbursement_id'], {
      name: 'ra_reimbursement_id_idx',
    });

    await queryInterface.addIndex('reimbursement_approvals', ['approver_id'], {
      name: 'ra_approver_id_idx',
    });

    await queryInterface.addIndex('reimbursement_approvals', ['approval_level'], {
      name: 'ra_approval_level_idx',
    });

    await queryInterface.addIndex('reimbursement_approvals', ['action'], {
      name: 'ra_action_idx',
    });

    await queryInterface.addIndex(
      'reimbursement_approvals',
      ['reimbursement_id', 'approval_level'],
      { name: 'ra_reimbursement_level_idx' }
    );

    await queryInterface.addIndex('reimbursement_approvals', ['action_at'], {
      name: 'ra_action_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('reimbursement_approvals', 'ra_reimbursement_id_idx');
    await queryInterface.removeIndex('reimbursement_approvals', 'ra_approver_id_idx');
    await queryInterface.removeIndex('reimbursement_approvals', 'ra_approval_level_idx');
    await queryInterface.removeIndex('reimbursement_approvals', 'ra_action_idx');
    await queryInterface.removeIndex('reimbursement_approvals', 'ra_reimbursement_level_idx');
    await queryInterface.removeIndex('reimbursement_approvals', 'ra_action_at_idx');
    await queryInterface.dropTable('reimbursement_approvals');
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_reimbursement_approvals_approval_level";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_reimbursement_approvals_action";`
    );
  },
};
