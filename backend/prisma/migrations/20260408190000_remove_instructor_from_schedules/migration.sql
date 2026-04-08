-- Remove instructor from schedules
ALTER TABLE "schedules" DROP COLUMN IF EXISTS "instructor";

