import { pgTable, uuid, varchar, boolean, timestamp, text, decimal, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ── ENUMS ────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum('enum_users_role', ['EMP', 'RM', 'APE', 'CFO']);

export const categoryEnum = pgEnum('enum_reimbursements_category', [
  'TRAVEL', 'ACCOMMODATION', 'FOOD', 'OFFICE_SUPPLIES',
  'COMMUNICATION', 'TRAINING', 'MEDICAL', 'OTHER'
]);

export const statusEnum = pgEnum('enum_reimbursements_status', [
  'DRAFT', 'PENDING',
  'RM_APPROVED', 'RM_REJECTED',
  'APE_APPROVED', 'APE_REJECTED',
  'CFO_APPROVED', 'CFO_REJECTED',
  'PAID', 'CANCELLED'
]);

export const approvalLevelEnum = pgEnum('enum_reimbursement_approvals_approval_level', ['RM', 'APE', 'CFO']);

export const actionEnum = pgEnum('enum_reimbursement_approvals_action', ['APPROVED', 'REJECTED', 'RETURNED']);

// ── TABLES ───────────────────────────────────────────────────────────────────

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: roleEnum('role').default('EMP').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { mode: 'date' }),
  passwordChangedAt: timestamp('password_changed_at', { mode: 'date' }),
  refreshToken: text('refresh_token'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('users_email_unique').on(table.email),
  index('users_role_idx').on(table.role),
  index('users_is_active_idx').on(table.isActive),
]);

// 2. EmployeeManagers Table
export const employeeManagers = pgTable('employee_managers', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  managerId: uuid('manager_id').notNull().references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  assignedAt: timestamp('assigned_at', { mode: 'date' }).defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  remarks: text('remarks'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('em_employee_id_idx').on(table.employeeId),
  index('em_manager_id_idx').on(table.managerId),
  index('em_employee_id_is_active_idx').on(table.employeeId, table.isActive),
  uniqueIndex('em_employee_active_unique')
    .on(table.employeeId)
    .where(sql`is_active = true`),
]);

// 3. Reimbursements Table
export const reimbursements = pgTable('reimbursements', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  category: categoryEnum('category').default('OTHER').notNull(),
  status: statusEnum('status').default('PENDING').notNull(),
  receiptUrl: text('receipt_url'),
  expenseDate: varchar('expense_date', { length: 10 }).notNull(), // stored as YYYY-MM-DD
  submittedAt: timestamp('submitted_at', { mode: 'date' }),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  employeeRemarks: text('employee_remarks'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('reimb_employee_id_idx').on(table.employeeId),
  index('reimb_status_idx').on(table.status),
  index('reimb_category_idx').on(table.category),
  index('reimb_expense_date_idx').on(table.expenseDate),
  index('reimb_employee_status_idx').on(table.employeeId, table.status),
]);

// 4. ReimbursementApprovals Table
export const reimbursementApprovals = pgTable('reimbursement_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  reimbursementId: uuid('reimbursement_id').notNull().references(() => reimbursements.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  approverId: uuid('approver_id').notNull().references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  approvalLevel: approvalLevelEnum('approval_level').notNull(),
  action: actionEnum('action').notNull(),
  remarks: text('remarks'),
  actionAt: timestamp('action_at', { mode: 'date' }).defaultNow().notNull(),
  previousStatus: varchar('previous_status', { length: 30 }),
  newStatus: varchar('new_status', { length: 30 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('ra_reimbursement_id_idx').on(table.reimbursementId),
  index('ra_approver_id_idx').on(table.approverId),
  index('ra_approval_level_idx').on(table.approvalLevel),
  index('ra_action_idx').on(table.action),
  index('ra_reimbursement_level_idx').on(table.reimbursementId, table.approvalLevel),
  index('ra_action_at_idx').on(table.actionAt),
]);

// ── RELATIONS ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  managerAssignments: many(employeeManagers, { relationName: 'employeeAssignments' }),
  managedEmployees: many(employeeManagers, { relationName: 'managedEmployees' }),
  reimbursements: many(reimbursements),
  approvalActions: many(reimbursementApprovals),
}));

export const employeeManagersRelations = relations(employeeManagers, ({ one }) => ({
  employee: one(users, {
    fields: [employeeManagers.employeeId],
    references: [users.id],
    relationName: 'employeeAssignments',
  }),
  manager: one(users, {
    fields: [employeeManagers.managerId],
    references: [users.id],
    relationName: 'managedEmployees',
  }),
}));

export const reimbursementsRelations = relations(reimbursements, ({ one, many }) => ({
  employee: one(users, {
    fields: [reimbursements.employeeId],
    references: [users.id],
  }),
  approvalHistory: many(reimbursementApprovals),
}));

export const reimbursementApprovalsRelations = relations(reimbursementApprovals, ({ one }) => ({
  reimbursement: one(reimbursements, {
    fields: [reimbursementApprovals.reimbursementId],
    references: [reimbursements.id],
  }),
  approver: one(users, {
    fields: [reimbursementApprovals.approverId],
    references: [users.id],
  }),
}));
