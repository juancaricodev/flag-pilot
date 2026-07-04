-- Drop existing foreign keys before renaming tables/columns
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_flagId_fkey";
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_flagId_fkey";

-- Rename columns in Flag
ALTER TABLE "Flag" RENAME COLUMN "rolloutPct" TO "rollout_pct";
ALTER TABLE "Flag" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "Flag" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename Flag table
ALTER TABLE "Flag" RENAME TO "flags";

-- Rename columns in AuditLog
ALTER TABLE "AuditLog" RENAME COLUMN "flagId" TO "flag_id";
ALTER TABLE "AuditLog" RENAME COLUMN "fromState" TO "from_state";
ALTER TABLE "AuditLog" RENAME COLUMN "toState" TO "to_state";
ALTER TABLE "AuditLog" RENAME COLUMN "createdAt" TO "created_at";

-- Rename AuditLog table
ALTER TABLE "AuditLog" RENAME TO "audit_logs";

-- Rename columns in Evaluation
ALTER TABLE "Evaluation" RENAME COLUMN "flagId" TO "flag_id";
ALTER TABLE "Evaluation" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "Evaluation" RENAME COLUMN "createdAt" TO "created_at";

-- Rename Evaluation table
ALTER TABLE "Evaluation" RENAME TO "evaluations";

-- Rename columns in Admin
ALTER TABLE "Admin" RENAME COLUMN "passwordHash" TO "password_hash";
ALTER TABLE "Admin" RENAME COLUMN "createdAt" TO "created_at";

-- Rename Admin table
ALTER TABLE "Admin" RENAME TO "admins";

-- Recreate foreign keys with updated table/column names
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename indexes for clarity (optional, Prisma uses the unique constraint by logical model)
ALTER INDEX "Flag_name_key" RENAME TO "flags_name_key";
ALTER INDEX "Admin_email_key" RENAME TO "admins_email_key";
ALTER INDEX "Flag_pkey" RENAME TO "flags_pkey";
ALTER INDEX "AuditLog_pkey" RENAME TO "audit_logs_pkey";
ALTER INDEX "Evaluation_pkey" RENAME TO "evaluations_pkey";
ALTER INDEX "Admin_pkey" RENAME TO "admins_pkey";
