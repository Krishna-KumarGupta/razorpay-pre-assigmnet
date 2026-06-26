CREATE TYPE "public"."enum_reimbursement_approvals_action" AS ENUM('APPROVED', 'REJECTED', 'RETURNED');--> statement-breakpoint
CREATE TYPE "public"."enum_reimbursement_approvals_approval_level" AS ENUM('RM', 'APE', 'CFO');--> statement-breakpoint
CREATE TYPE "public"."enum_reimbursements_category" AS ENUM('TRAVEL', 'ACCOMMODATION', 'FOOD', 'OFFICE_SUPPLIES', 'COMMUNICATION', 'TRAINING', 'MEDICAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."enum_users_role" AS ENUM('EMP', 'RM', 'APE', 'CFO');--> statement-breakpoint
CREATE TYPE "public"."enum_reimbursements_status" AS ENUM('DRAFT', 'PENDING', 'RM_APPROVED', 'RM_REJECTED', 'APE_APPROVED', 'APE_REJECTED', 'CFO_APPROVED', 'CFO_REJECTED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "employee_managers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"manager_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reimbursement_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reimbursement_id" uuid NOT NULL,
	"approver_id" uuid NOT NULL,
	"approval_level" "enum_reimbursement_approvals_approval_level" NOT NULL,
	"action" "enum_reimbursement_approvals_action" NOT NULL,
	"remarks" text,
	"action_at" timestamp DEFAULT now() NOT NULL,
	"previous_status" varchar(30),
	"new_status" varchar(30),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reimbursements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"category" "enum_reimbursements_category" DEFAULT 'OTHER' NOT NULL,
	"status" "enum_reimbursements_status" DEFAULT 'PENDING' NOT NULL,
	"receipt_url" text,
	"expense_date" varchar(10) NOT NULL,
	"submitted_at" timestamp,
	"paid_at" timestamp,
	"employee_remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "enum_users_role" DEFAULT 'EMP' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"password_changed_at" timestamp,
	"refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_managers" ADD CONSTRAINT "employee_managers_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "employee_managers" ADD CONSTRAINT "employee_managers_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reimbursement_approvals" ADD CONSTRAINT "reimbursement_approvals_reimbursement_id_reimbursements_id_fk" FOREIGN KEY ("reimbursement_id") REFERENCES "public"."reimbursements"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reimbursement_approvals" ADD CONSTRAINT "reimbursement_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "em_employee_id_idx" ON "employee_managers" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "em_manager_id_idx" ON "employee_managers" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "em_employee_id_is_active_idx" ON "employee_managers" USING btree ("employee_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "em_employee_active_unique" ON "employee_managers" USING btree ("employee_id") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "ra_reimbursement_id_idx" ON "reimbursement_approvals" USING btree ("reimbursement_id");--> statement-breakpoint
CREATE INDEX "ra_approver_id_idx" ON "reimbursement_approvals" USING btree ("approver_id");--> statement-breakpoint
CREATE INDEX "ra_approval_level_idx" ON "reimbursement_approvals" USING btree ("approval_level");--> statement-breakpoint
CREATE INDEX "ra_action_idx" ON "reimbursement_approvals" USING btree ("action");--> statement-breakpoint
CREATE INDEX "ra_reimbursement_level_idx" ON "reimbursement_approvals" USING btree ("reimbursement_id","approval_level");--> statement-breakpoint
CREATE INDEX "ra_action_at_idx" ON "reimbursement_approvals" USING btree ("action_at");--> statement-breakpoint
CREATE INDEX "reimb_employee_id_idx" ON "reimbursements" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "reimb_status_idx" ON "reimbursements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reimb_category_idx" ON "reimbursements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "reimb_expense_date_idx" ON "reimbursements" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "reimb_employee_status_idx" ON "reimbursements" USING btree ("employee_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");