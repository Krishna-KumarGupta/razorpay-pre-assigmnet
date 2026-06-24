'use strict';

const { sequelize } = require('../config/database');
const { Sequelize } = require('sequelize');

// ── Model Imports ──────────────────────────────────────────────────────────────
const User = require('./user.model');
const EmployeeManager = require('./employeeManager.model');
const Reimbursement = require('./reimbursement.model');
const ReimbursementApproval = require('./reimbursementApproval.model');

// ─────────────────────────────────────────────────────────────────────────────
// ASSOCIATIONS
// Defined here – after all models are loaded – to avoid circular dependency.
// ─────────────────────────────────────────────────────────────────────────────

// ── EmployeeManager ──────────────────────────────────────────────────────────
//
//  An EMP has one active RM assignment (current manager).
//  A RM can manage many EMPs.
//
//  User (EMP) ─< EmployeeManager >─ User (RM)
//

/**
 * Employee side: a User (EMP) has many EmployeeManager records
 * (one per assignment, including historical ones).
 */
User.hasMany(EmployeeManager, {
  foreignKey: 'employeeId',
  as: 'managerAssignments',        // user.getManagerAssignments()
});

/**
 * EmployeeManager → User (EMP)
 */
EmployeeManager.belongsTo(User, {
  foreignKey: 'employeeId',
  as: 'employee',                  // assignment.getEmployee()
});

/**
 * Manager side: a User (RM) has many employees assigned to them.
 */
User.hasMany(EmployeeManager, {
  foreignKey: 'managerId',
  as: 'managedEmployees',          // user.getManagedEmployees()
});

/**
 * EmployeeManager → User (RM)
 */
EmployeeManager.belongsTo(User, {
  foreignKey: 'managerId',
  as: 'manager',                   // assignment.getManager()
});

// ── Reimbursement ────────────────────────────────────────────────────────────
//
//  A Reimbursement belongs to exactly one User (EMP).
//  A User (EMP) can submit many Reimbursements.
//

User.hasMany(Reimbursement, {
  foreignKey: 'employeeId',
  as: 'reimbursements',            // user.getReimbursements()
  onDelete: 'RESTRICT',
});

Reimbursement.belongsTo(User, {
  foreignKey: 'employeeId',
  as: 'employee',                  // reimbursement.getEmployee()
});

// ── ReimbursementApproval ────────────────────────────────────────────────────
//
//  A Reimbursement has many approval history entries (one per approver action).
//  An approval entry belongs to one Reimbursement.
//  An approval entry belongs to one User (the approver – RM / APE / CFO).
//

Reimbursement.hasMany(ReimbursementApproval, {
  foreignKey: 'reimbursementId',
  as: 'approvalHistory',           // reimbursement.getApprovalHistory()
  onDelete: 'RESTRICT',
});

ReimbursementApproval.belongsTo(Reimbursement, {
  foreignKey: 'reimbursementId',
  as: 'reimbursement',             // approval.getReimbursement()
});

User.hasMany(ReimbursementApproval, {
  foreignKey: 'approverId',
  as: 'approvalActions',           // user.getApprovalActions()
});

ReimbursementApproval.belongsTo(User, {
  foreignKey: 'approverId',
  as: 'approver',                  // approval.getApprover()
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
const db = {
  sequelize,
  Sequelize,
  User,
  EmployeeManager,
  Reimbursement,
  ReimbursementApproval,
};

module.exports = db;
