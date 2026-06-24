'use strict';

/**
 * BaseRepository – generic CRUD abstraction over a Sequelize model.
 *
 * Concrete repositories extend this class and call super(Model) in their constructor.
 * This satisfies the Open/Closed Principle: new repositories add behaviour without
 * modifying this base class.
 *
 * All database errors bubble up to the service layer; the repository does NOT
 * swallow or transform errors.
 */
class BaseRepository {
  /**
   * @param {import('sequelize').ModelStatic<import('sequelize').Model>} model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Find all records matching optional conditions.
   * @param {object} options - Sequelize find options (where, include, order, limit, offset…)
   * @returns {Promise<Array>}
   */
  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  /**
   * Find one record by primary key.
   * @param {string|number} id
   * @param {object} options
   * @returns {Promise<import('sequelize').Model|null>}
   */
  async findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  /**
   * Find one record matching conditions.
   * @param {object} options
   * @returns {Promise<import('sequelize').Model|null>}
   */
  async findOne(options = {}) {
    return this.model.findOne(options);
  }

  /**
   * Count records matching conditions.
   * @param {object} options
   * @returns {Promise<number>}
   */
  async count(options = {}) {
    return this.model.count(options);
  }

  /**
   * Find and count all – useful for paginated responses.
   * @param {object} options
   * @returns {Promise<{ count: number, rows: Array }>}
   */
  async findAndCountAll(options = {}) {
    return this.model.findAndCountAll(options);
  }

  /**
   * Create a new record.
   * @param {object} data
   * @param {object} options - Sequelize create options (transaction, returning…)
   * @returns {Promise<import('sequelize').Model>}
   */
  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  /**
   * Bulk create records.
   * @param {Array<object>} records
   * @param {object} options
   * @returns {Promise<Array>}
   */
  async bulkCreate(records, options = {}) {
    return this.model.bulkCreate(records, options);
  }

  /**
   * Update records matching conditions.
   * @param {object} data    - Fields to update
   * @param {object} options - Must include a `where` clause
   * @returns {Promise<[number]>} Number of affected rows
   */
  async update(data, options = {}) {
    return this.model.update(data, options);
  }

  /**
   * Delete records matching conditions.
   * @param {object} options - Must include a `where` clause
   * @returns {Promise<number>} Number of destroyed rows
   */
  async destroy(options = {}) {
    return this.model.destroy(options);
  }

  /**
   * Find or create a record.
   * @param {object} options - Must include `where` and optionally `defaults`
   * @returns {Promise<[import('sequelize').Model, boolean]>}
   */
  async findOrCreate(options = {}) {
    return this.model.findOrCreate(options);
  }
}

module.exports = BaseRepository;
