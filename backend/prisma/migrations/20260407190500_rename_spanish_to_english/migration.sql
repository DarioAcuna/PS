-- Rename enum type to English
ALTER TYPE "SesionEstado" RENAME TO "session_status";

-- Rename tables to English
ALTER TABLE "Clase" RENAME TO "classes";
ALTER TABLE "Horario" RENAME TO "schedules";
ALTER TABLE "Sesion" RENAME TO "sessions";
ALTER TABLE "Anuncio" RENAME TO "announcements";

-- Rename columns in classes
ALTER TABLE "classes" RENAME COLUMN "nombre" TO "name";
ALTER TABLE "classes" RENAME COLUMN "descripcion" TO "description";
ALTER TABLE "classes" RENAME COLUMN "nivel" TO "level";
ALTER TABLE "classes" RENAME COLUMN "activa" TO "is_active";
ALTER TABLE "classes" RENAME COLUMN "createdAt" TO "created_at";

-- Rename columns in schedules
ALTER TABLE "schedules" RENAME COLUMN "claseId" TO "class_id";
ALTER TABLE "schedules" RENAME COLUMN "diaSemana" TO "day_of_week";
ALTER TABLE "schedules" RENAME COLUMN "horaInicio" TO "start_time";
ALTER TABLE "schedules" RENAME COLUMN "horaFin" TO "end_time";
ALTER TABLE "schedules" RENAME COLUMN "aula" TO "room";
ALTER TABLE "schedules" RENAME COLUMN "activo" TO "is_active";
ALTER TABLE "schedules" RENAME COLUMN "createdAt" TO "created_at";

-- Rename columns in sessions
ALTER TABLE "sessions" RENAME COLUMN "horarioId" TO "schedule_id";
ALTER TABLE "sessions" RENAME COLUMN "fecha" TO "date";
ALTER TABLE "sessions" RENAME COLUMN "horaInicio" TO "start_time";
ALTER TABLE "sessions" RENAME COLUMN "horaFin" TO "end_time";
ALTER TABLE "sessions" RENAME COLUMN "aula" TO "room";
ALTER TABLE "sessions" RENAME COLUMN "observaciones" TO "notes";
ALTER TABLE "sessions" RENAME COLUMN "estado" TO "status";
ALTER TABLE "sessions" RENAME COLUMN "createdAt" TO "created_at";

-- Rename columns in announcements
ALTER TABLE "announcements" RENAME COLUMN "titulo" TO "title";
ALTER TABLE "announcements" RENAME COLUMN "contenido" TO "content";
ALTER TABLE "announcements" RENAME COLUMN "activo" TO "is_active";
ALTER TABLE "announcements" RENAME COLUMN "publicadoEn" TO "published_at";

-- Rename index and constraints to English
ALTER INDEX "Clase_nombre_key" RENAME TO "classes_name_key";
ALTER INDEX "Sesion_horarioId_fecha_key" RENAME TO "sessions_schedule_id_date_key";

ALTER TABLE "schedules"
  RENAME CONSTRAINT "Horario_claseId_fkey" TO "schedules_class_id_fkey";

ALTER TABLE "sessions"
  RENAME CONSTRAINT "Sesion_horarioId_fkey" TO "sessions_schedule_id_fkey";

