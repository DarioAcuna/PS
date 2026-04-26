-- CreateEnum
CREATE TYPE "member_type" AS ENUM ('ALUMNO', 'PROFESOR');

-- CreateEnum
CREATE TYPE "member_status" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateTable
CREATE TABLE "members" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "belt" TEXT NOT NULL,
    "belt_degree" INTEGER NOT NULL DEFAULT 0,
    "member_type" "member_type" NOT NULL DEFAULT 'ALUMNO',
    "status" "member_status" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- Business constraint: belt degree range 0..4
ALTER TABLE "members"
ADD CONSTRAINT "members_belt_degree_check"
CHECK ("belt_degree" >= 0 AND "belt_degree" <= 4);

