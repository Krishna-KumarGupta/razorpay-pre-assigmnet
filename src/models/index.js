'use strict';

const { sequelize } = require('../config/database');

/**
 * Central model index.
 * Imports and registers all Sequelize models, then wires up associations.
 *
 * Pattern: Each model file exports a factory function (model) => void that
 * defines the model on the shared sequelize instance.  Associations are
 * declared here to keep individual model files focused on schema definitions.
 */

// ── Model Imports ─────────────────────────────────────────────────────────────
// Add each model here as the project grows:
// const User = require('./user.model');

// ── Export ────────────────────────────────────────────────────────────────────
const db = {
  sequelize,
  Sequelize: require('sequelize'),
  // User,
};

// ── Associations ──────────────────────────────────────────────────────────────
// Define relationships here once all models are loaded, e.g.:
// User.hasMany(db.Session, { foreignKey: 'userId', as: 'sessions' });
// db.Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = db;
