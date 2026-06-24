'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * EmployeeManager – junction that records which RM manages which EMP.
 *
 * Business rules enforced here:
 *  - One EMP belongs to exactly one active RM at any time.
 *  - Historical assignments are preserved (isActive = false) for audit.
 *  - The model does NOT enforce role check at DB level (done in service layer).
 */
class EmployeeManager extends Model {}

EmployeeManager.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Primary key – UUID v4',
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'employee_id',
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'FK → users (role = EMP)',
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'manager_id',
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'FK → users (role = RM)',
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'assigned_at',
      comment: 'Timestamp when this assignment became effective',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
      comment: 'False = historical record; only one active assignment per employee',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional note when assignment changes (e.g. "transfer to new team")',
    },
  },
  {
    sequelize,
    tableName: 'employee_managers',
    modelName: 'EmployeeManager',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['manager_id'] },
      { fields: ['employee_id', 'is_active'] },
    ],
  }
);

module.exports = EmployeeManager;
