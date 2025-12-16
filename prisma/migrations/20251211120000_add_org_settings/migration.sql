-- Add organization settings JSON column for locale/calendar/scoring prefs
ALTER TABLE "organizations"
ADD COLUMN IF NOT EXISTS "settings" JSONB;











