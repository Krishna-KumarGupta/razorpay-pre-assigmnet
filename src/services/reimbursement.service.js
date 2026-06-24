'use strict';

const reimbursementRepository = require('../repositories/reimbursement.repository');
const { BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * ReimbursementService – business logic for reimbursement lifecycle.
 *
 * SOLID notes:
 *  S – Solely manages reimbursement creation and status flow. No HTTP, no ORM.
 *  O – Adding new operations (approve, reject, cancel) extends this class.
 *  D – Depends on ReimbursementRepository abstraction, not Sequelize directly.
 *
 * Authorization (EMP-only for creation) is enforced upstream by the
 * authorize('EMP') middleware; this service trusts the authenticated user
 * passed in is a valid EMP.
 */
class ReimbursementService {

  /**
   * Create a new reimbursement claim for an EMP.
   *
   * Business rules:
   *  1. Status is always set to PENDING on creation (regardless of any value
   *     that may be passed in the request body).
   *  2. submittedAt is recorded at creation time.
   *  3. expenseDate defaults to today if not supplied by the client.
   *  4. amount is rounded to 2 decimal places (monetary precision).
   *
   * @param {string} employeeId   - Comes from req.user.id (JWT); never from the body
   * @param {{
   *   title:            string,
   *   description?:     string,
   *   amount:           number,
   *   category?:        string,
   *   expenseDate?:     string,    // YYYY-MM-DD; defaults to today
   *   employeeRemarks?: string,
   * }} dto
   * @returns {Promise<object>} Created reimbursement record
   */
  async createReimbursement(employeeId, dto) {
    const {
      title,
      description,
      amount,
      category = 'OTHER',
      expenseDate,
      employeeRemarks,
    } = dto;

    // Rule 4: monetary precision guard
    const roundedAmount = Math.round(parseFloat(amount) * 100) / 100;
    if (roundedAmount <= 0) {
      throw new BadRequestError('Amount must be greater than zero.', 'INVALID_AMOUNT');
    }

    const now = new Date();

    const reimbursement = await reimbursementRepository.createReimbursement({
      employeeId,
      title: title.trim(),
      description: description ? description.trim() : null,
      amount: roundedAmount,
      category,
      // Rule 3: default expenseDate to today
      expenseDate: expenseDate || now.toISOString().split('T')[0],
      // Rule 1: status always PENDING on creation
      status: 'PENDING',
      // Rule 2: submittedAt = now
      submittedAt: now,
      employeeRemarks: employeeRemarks ? employeeRemarks.trim() : null,
    });

    logger.info(
      `[ReimbursementService] Created reimbursement ${reimbursement.id} ` +
      `for employee ${employeeId} — amount: ${roundedAmount}, status: PENDING`
    );

    return reimbursement;
  }
}

module.exports = new ReimbursementService();
