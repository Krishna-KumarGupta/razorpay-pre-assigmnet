'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * User model – represents any system user.
 *
 * Roles:
 *  EMP  – Employee: submits reimbursements
 *  RM   – Reporting Manager: first-level approver; manages a set of EMPs
 *  APE  – Accounts Payable Executive: second-level approver
 *  CFO  – Chief Financial Officer: final approver
 */
class User extends Model {
  /**
   * Check whether the user has a specific role.
   * @param {string} role - One of EMP | RM | APE | CFO
   * @returns {boolean}
   */
  hasRole(role) {
    return this.role === role;
  }

  /**
   * Return a safe representation of the user (strips sensitive fields).
   * @returns {object}
   */
  toSafeObject() {
    const { id, name, email, role, isActive, createdAt, updatedAt } = this;
    return { id, name, email, role, isActive, createdAt, updatedAt };
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Primary key – UUID v4',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name cannot be empty' },
        len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        name: 'users_email_unique',
        msg: 'An account with this email already exists',
      },
      validate: {
        isEmail: { msg: 'Must be a valid email address' },
        notEmpty: { msg: 'Email cannot be empty' },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password cannot be empty' },
      },
    },
    role: {
      type: DataTypes.ENUM('EMP', 'RM', 'APE', 'CFO'),
      allowNull: false,
      defaultValue: 'EMP',
      comment: 'EMP=Employee | RM=Reporting Manager | APE=Accounts Payable Exec | CFO=Chief Financial Officer',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_changed_at',
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refresh_token',
      comment: 'Hashed refresh token – null when logged out',
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    timestamps: true,
    paranoid: false,
    underscored: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['role'] },
      { fields: ['is_active'] },
    ],
    defaultScope: {
      attributes: { exclude: ['password', 'refreshToken'] },
    },
    scopes: {
      /**
       * Returns the user WITH the password column included.
       * Using exclude:[] explicitly overrides the defaultScope's
       * exclude:['password','refreshToken'] — Sequelize 6 merges scopes and
       * the defaultScope exclude takes precedence over include in named scopes,
       * so we must use a full attribute override here.
       */
      withPassword: {
        attributes: { exclude: ['refreshToken'] },  // All fields except refreshToken
      },
      withRefreshToken: {
        attributes: { exclude: ['password'] },       // All fields except password
      },
      active: { where: { isActive: true } },
      employees: { where: { role: 'EMP' } },
      managers: { where: { role: 'RM' } },
    },
  }
);

module.exports = User;
