'use strict';

class User {
  constructor(data) {
    if (data) {
      Object.assign(this, data);
    }
  }

  hasRole(role) {
    return this.role === role;
  }

  toSafeObject() {
    const { id, name, email, role, isActive, createdAt, updatedAt } = this;
    return { id, name, email, role, isActive, createdAt, updatedAt };
  }
}

class EmployeeManager {
  constructor(data) {
    if (data) {
      Object.assign(this, data);
      if (data.employee) {
        this.employee = new User(data.employee);
      }
      if (data.manager) {
        this.manager = new User(data.manager);
      }
    }
  }
}

class Reimbursement {
  constructor(data) {
    if (data) {
      Object.assign(this, data);
      if (data.employee) {
        this.employee = new User(data.employee);
      }
    }
  }

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

class ReimbursementApproval {
  constructor(data) {
    if (data) {
      Object.assign(this, data);
      if (data.reimbursement) {
        this.reimbursement = new Reimbursement(data.reimbursement);
      }
      if (data.approver) {
        this.approver = new User(data.approver);
      }
    }
  }
}

module.exports = {
  User,
  EmployeeManager,
  Reimbursement,
  ReimbursementApproval,
};
