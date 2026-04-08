-- Remove deprecated columns
ALTER TABLE "classes" DROP COLUMN IF EXISTS "description";
ALTER TABLE "schedules" DROP COLUMN IF EXISTS "room";
ALTER TABLE "schedules" DROP COLUMN IF EXISTS "is_active";
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "room";
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "notes";

-- Rename enum values to English
ALTER TYPE "session_status" RENAME VALUE 'PROGRAMADA' TO 'SCHEDULED';
ALTER TYPE "session_status" RENAME VALUE 'MODIFICADA' TO 'MODIFIED';
ALTER TYPE "session_status" RENAME VALUE 'CANCELADA' TO 'CANCELED';

