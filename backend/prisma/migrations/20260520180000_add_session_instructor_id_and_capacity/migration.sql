-- Add per-session instructor id and per-session capacity
ALTER TABLE "sessions"
ADD COLUMN IF NOT EXISTS "instructor_id" INTEGER,
ADD COLUMN IF NOT EXISTS "max_capacity" INTEGER;

-- Replace unique key that used instructor name with instructor id
ALTER TABLE "sessions"
DROP CONSTRAINT IF EXISTS "sessions_date_start_time_end_time_instructor_key";

ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_date_start_time_end_time_instructor_id_key"
UNIQUE ("date", "start_time", "end_time", "instructor_id");
