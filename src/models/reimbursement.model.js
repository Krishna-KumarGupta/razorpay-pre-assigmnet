'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Reimbursement – a claim submitted by an EMP.
 *
 * Lifecycle (status):
 *   DRAFT       → saved but not yet submitted
 *   PENDING     → submitted, awaiting RM review
 *   RM_APPROVED → approved by the reporting manager; now awaiting APE
 *   RM_REJECTED → rejected at RM stage (terminal)
 *   APE_APPROVED→ approved by Accounts Payable; now awaiting CFO
 *   APE_REJECTED→ rejected at APE stage (terminal)
 *   CFO_APPROVED→ approved by CFO; cleared for payment
 *   CFO_REJECTED→ rejected at CFO stage (terminal)
 *   PAID        → payment released (terminal)
 *   CANCELLED   → withdrawn by employee before first approval (terminal)
 */
class Reimbursement extends Model {
  /**
   * Convenience check: is the claim still in flight (not yet in a terminal state)?
   *
   * Terminal states are those from which no further transitions are possible:
   *  – All *_REJECTED statuses
   *  – CFO_APPROVED  (fully approved; cleared for payment)
   *  – PAID           (payment released)
   *  – CANCELLED      (withdrawn by employee)
   */
  isPending() {
    return ![
      'RM_REJECTED',
      'APE_REJECTED',
      'CFO_REJECTED',
      'CFO_APPROVED',
      'PAID',
      'CANCELLED',
    ].includes(this.status);
  }
}

Reimbursement.init(
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Title cannot be empty' },
        len: { args: [3, 200], msg: 'Title must be between 3 and 200 characters' },
      },
      comment: 'Short descriptive title of the expense',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed description of the expense',
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: { args: [0.01], msg: 'Amount must be greater than 0' },
      },
      comment: 'Claimed amount in INR (stored with 2 decimal precision)',
    },
    category: {
      type: DataTypes.ENUM(
        'TRAVEL',
        'ACCOMMODATION',
        'FOOD',
        'OFFICE_SUPPLIES',
        'COMMUNICATION',
        'TRAINING',
        'MEDICAL',
        'OTHER'
      ),
      allowNull: false,
      defaultValue: 'OTHER',
      comment: 'Expense category for reporting',
    },
    status: {
      type: DataTypes.ENUM(
        'DRAFT',
        'PENDING',
        'RM_APPROVED',
        'RM_REJECTED',
        'APE_APPROVED',
        'APE_REJECTED',
        'CFO_APPROVED',
        'CFO_REJECTED',
        'PAID',
        'CANCELLED'
      ),
      allowNull: false,
      defaultValue: 'PENDING',  // Spec: newly created claims are immediately PENDING
      comment: 'Current lifecycle state of the reimbursement',
    },
    receiptUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'receipt_url',
      comment: 'URL / path to the uploaded receipt document',
    },
    expenseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'expense_date',
      comment: 'Date on which the expense was incurred',
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at',
      comment: 'Timestamp when the employee submitted the claim (status → PENDING)',
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at',
      comment: 'Timestamp when payment was released',
    },
    employeeRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'employee_remarks',
      comment: 'Notes added by the employee',
    },
  },
  {
    sequelize,
    tableName: 'reimbursements',
    modelName: 'Reimbursement',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['status'] },
      { fields: ['category'] },
      { fields: ['expense_date'] },
      { fields: ['employee_id', 'status'] },
    ],
    scopes: {
      pending: { where: { status: 'PENDING' } },
      approved: { where: { status: 'CFO_APPROVED' } },
      paid: { where: { status: 'PAID' } },
    },
  }
);

module.exports = Reimbursement;
