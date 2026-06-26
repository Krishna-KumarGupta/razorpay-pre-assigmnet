'use strict';

const { db } = require('../db/db');

/**
 * BaseRepository - base class for all repositories.
 * Concrete repositories inherit from this class and can use this.db.
 */
class BaseRepository {
  constructor(table, modelClass) {
    this.table = table;
    this.modelClass = modelClass;
    this.db = db;
  }
}

module.exports = BaseRepository;
