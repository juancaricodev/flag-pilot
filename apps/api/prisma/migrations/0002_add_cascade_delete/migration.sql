-- Drop existing foreign key constraints
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_flagId_fkey";
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_flagId_fkey";

-- Re-add with ON DELETE CASCADE
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "Flag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "Flag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
