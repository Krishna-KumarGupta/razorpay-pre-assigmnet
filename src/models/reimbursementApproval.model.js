'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ReimbursementApproval – immutable audit log of every approval action.
 *
 * One row is inserted each time an approver (RM / APE / CFO) takes action
 * on a reimbursement.  Rows are never updated or deleted so the complete
 * approval history is always available.
 *
 * Approval levels (matches status flow on Reimbursement):
 *   RM  – Reporting Manager  (1st gate)
 *   APE – Accounts Payable Executive (2nd gate)
 *   CFO – Chief Financial Officer (3rd gate)
 *
 * Actions:
 *   APPROVED – approver accepted the claim
 *   REJECTED – approver rejected the claim (claim becomes terminal)
 *   RETURNED – approver returned to employee for correction
 */
class ReimbursementApproval extends Model {}

ReimbursementApproval.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Primary key – UUID v4',
    },
    reimbursementId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'reimbursement_id',
      references: { model: 'reimbursements', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'FK → reimbursements',
    },
    approverId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'approver_id',
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'FK → users – the user who performed this action (RM / APE / CFO)',
    },
    approvalLevel: {
      type: DataTypes.ENUM('RM', 'APE', 'CFO'),
      allowNull: false,
      field: 'approval_level',
      comment: 'Which approval gate this record belongs to',
    },
    action: {
      type: DataTypes.ENUM('APPROVED', 'REJECTED', 'RETURNED'),
      allowNull: false,
      comment: 'Action taken by the approver',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Comments / justification provided by the approver',
    },
    actionAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'action_at',
      comment: 'Exact timestamp of the approval action',
    },
    previousStatus: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'previous_status',
      comment: 'Reimbursement status before this action – for full audit trail',
    },
    newStatus: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'new_status',
      comment: 'Reimbursement status after this action',
    },
  },
  {
    sequelize,
    tableName: 'reimbursement_approvals',
    modelName: 'ReimbursementApproval',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['reimbursement_id'] },
      { fields: ['approver_id'] },
      { fields: ['approval_level'] },
      { fields: ['action'] },
      { fields: ['reimbursement_id', 'approval_level'] },
      { fields: ['action_at'] },
    ],
  }
);

module.exports = ReimbursementApproval;
