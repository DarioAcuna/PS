-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVO', 'INACTIVO');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "first_name" TEXT,
  ADD COLUMN "last_name" TEXT,
  ADD COLUMN "belt" TEXT,
  ADD COLUMN "belt_degree" INTEGER,
  ADD COLUMN "status" "user_status" NOT NULL DEFAULT 'ACTIVO',
  ALTER COLUMN "password" DROP NOT NULL;

-- Backfill basic name split for existing rows when possible
UPDATE "users"
SET
  "first_name" = split_part("name", ' ', 1),
  "last_name" = NULLIF(trim(substr("name", length(split_part("name", ' ', 1)) + 1)), '')
WHERE "first_name" IS NULL;

-- Business constraint: belt degree range 0..4
ALTER TABLE "users"
ADD CONSTRAINT "users_belt_degree_check"
CHECK ("belt_degree" IS NULL OR ("belt_degree" >= 0 AND "belt_degree" <= 4));

