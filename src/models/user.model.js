'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * User model – represents an application user.
 *
 * Follows the class-based Sequelize v6 pattern for full TypeScript-style clarity.
 * Business logic (hashing, validation) lives in the Service layer, NOT here.
 * The model only defines the schema and database-level constraints.
 */
class User extends Model {
  /**
   * Check whether the user has a specific role.
   * @param {string} role
   * @returns {boolean}
   */
  hasRole(role) {
    return this.role === role;
  }

  /**
   * Return a safe representation of the user (strips sensitive fields).
   * Called automatically by JSON.stringify via toJSON override.
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
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
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
    timestamps: true,                 // Adds createdAt / updatedAt
    paranoid: false,                  // Set to true to enable soft-deletes (deletedAt)
    underscored: true,                // Maps camelCase fields to snake_case columns
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['role'] },
      { fields: ['is_active'] },
    ],
    defaultScope: {
      attributes: { exclude: ['password', 'refreshToken'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] },
      },
      withRefreshToken: {
        attributes: { include: ['refreshToken'] },
      },
      active: {
        where: { isActive: true },
      },
    },
  }
);

module.exports = User;
