-- PRD compliance migration
-- 1) Add objective weight/priority fields
-- 2) Ensure indexes to support alignment queries

ALTER TABLE "objectives"
ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS "weight" INTEGER NOT NULL DEFAULT 0;

-- Index for goalType filtering in alignment cascades
CREATE INDEX IF NOT EXISTS "objectives_goalType_idx" ON "objectives" ("goalType");





