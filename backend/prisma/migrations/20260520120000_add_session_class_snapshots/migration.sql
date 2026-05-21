-- Add class snapshot fields to sessions
ALTER TABLE "sessions" ADD COLUMN "class_name" TEXT;
ALTER TABLE "sessions" ADD COLUMN "class_level" TEXT;

-- Backfill snapshots for existing sessions
UPDATE "sessions" s
SET "class_name" = c."name",
    "class_level" = c."level"
FROM "schedules" sc
JOIN "classes" c ON c."id" = sc."class_id"
WHERE s."schedule_id" = sc."id";

ALTER TABLE "sessions" ALTER COLUMN "class_name" SET NOT NULL;

