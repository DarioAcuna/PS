-- Replace CANCELED statuses before tightening enum
UPDATE "sessions"
SET "status" = 'MODIFIED'
WHERE "status" = 'CANCELED';

-- Recreate enum without CANCELED
ALTER TYPE "session_status" RENAME TO "session_status_old";

CREATE TYPE "session_status" AS ENUM ('SCHEDULED', 'MODIFIED');

ALTER TABLE "sessions"
ALTER COLUMN "status" TYPE "session_status"
USING ("status"::text::"session_status");

DROP TYPE "session_status_old";

