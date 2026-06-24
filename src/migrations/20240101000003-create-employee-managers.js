'use strict';

const { DataTypes } = require('sequelize');

/**
 * Migration: Create employee_managers table.
 *
 * Records which RM manages which EMP.
 * Supports historical tracking (is_active = false = past assignment).
 * Constraint: only ONE active row per employee at any time (enforced in service layer;
 * a partial unique index is added here as a DB-level safety net).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('employee_managers', {
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
      manager_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'FK → users (role = RM)',
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      remarks: {
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

    // Standard lookup indexes
    await queryInterface.addIndex('employee_managers', ['employee_id'], {
      name: 'em_employee_id_idx',
    });

    await queryInterface.addIndex('employee_managers', ['manager_id'], {
      name: 'em_manager_id_idx',
    });

    await queryInterface.addIndex('employee_managers', ['employee_id', 'is_active'], {
      name: 'em_employee_id_is_active_idx',
    });

    // ── Partial unique index ────────────────────────────────────────────────
    // Ensures only ONE active assignment exists per employee at the DB level.
    // PostgreSQL supports WHERE in CREATE UNIQUE INDEX; Sequelize doesn't expose
    // this directly so we use raw SQL.
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX em_employee_active_unique
        ON employee_managers (employee_id)
        WHERE (is_active = TRUE);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS em_employee_active_unique;'
    );
    await queryInterface.removeIndex('employee_managers', 'em_employee_id_idx');
    await queryInterface.removeIndex('employee_managers', 'em_manager_id_idx');
    await queryInterface.removeIndex('employee_managers', 'em_employee_id_is_active_idx');
    await queryInterface.dropTable('employee_managers');
  },
};
