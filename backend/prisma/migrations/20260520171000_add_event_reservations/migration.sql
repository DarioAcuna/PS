CREATE TABLE "event_reservations" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reservations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_reservations_event_id_user_id_key" ON "event_reservations"("event_id", "user_id");
CREATE INDEX "event_reservations_event_id_idx" ON "event_reservations"("event_id");
CREATE INDEX "event_reservations_user_id_idx" ON "event_reservations"("user_id");

ALTER TABLE "event_reservations"
ADD CONSTRAINT "event_reservations_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "event_reservations"
ADD CONSTRAINT "event_reservations_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
