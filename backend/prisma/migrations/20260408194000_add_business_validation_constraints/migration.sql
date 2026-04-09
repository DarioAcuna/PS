-- Classes: allow same name or same level, but not same pair (name, level)
DROP INDEX IF EXISTS "classes_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "classes_name_level_key"
ON "classes"("name", "level");

-- Sessions: the same instructor cannot teach two sessions in the same day/time slot
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_date_start_time_end_time_instructor_key"
ON "sessions"("date", "start_time", "end_time", "instructor");

-- Schedules: at most two classes per exact time slot and weekday
CREATE OR REPLACE FUNCTION "enforce_schedule_slot_limit"()
RETURNS TRIGGER AS $$
DECLARE
  same_slot_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO same_slot_count
  FROM "schedules"
  WHERE "day_of_week" = NEW."day_of_week"
    AND "start_time" = NEW."start_time"
    AND "end_time" = NEW."end_time"
    AND (TG_OP = 'INSERT' OR "id" <> NEW."id");

  IF same_slot_count >= 2 THEN
    RAISE EXCEPTION 'No puede haber mas de 2 horarios en la misma franja';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_schedule_slot_limit" ON "schedules";
CREATE TRIGGER "trg_schedule_slot_limit"
BEFORE INSERT OR UPDATE ON "schedules"
FOR EACH ROW
EXECUTE FUNCTION "enforce_schedule_slot_limit"();

