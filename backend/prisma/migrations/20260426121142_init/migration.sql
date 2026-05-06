-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'PROFESOR', 'ALUMNO');

-- AlterTable
ALTER TABLE "announcements" RENAME CONSTRAINT "Anuncio_pkey" TO "announcements_pkey";

-- AlterTable
ALTER TABLE "classes" RENAME CONSTRAINT "Clase_pkey" TO "classes_pkey";

-- AlterTable
ALTER TABLE "schedules" RENAME CONSTRAINT "Horario_pkey" TO "schedules_pkey";

-- AlterTable
ALTER TABLE "sessions" RENAME CONSTRAINT "Sesion_pkey" TO "sessions_pkey";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'ALUMNO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
