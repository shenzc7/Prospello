-- Create teams table
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "teams_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create comments table
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "objectiveId" TEXT,
    "keyResultId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "comments_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "objectives" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "key_results" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Extend objectives for teams/status/scoring and align timestamps
ALTER TABLE "objectives"
    ADD COLUMN "teamId" TEXT,
    ADD COLUMN "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    ADD COLUMN "goalType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    ADD COLUMN "fiscalQuarter" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "score" REAL;

ALTER TABLE "objectives"
    ALTER COLUMN "startAt" TYPE TIMESTAMP USING "startAt",
    ALTER COLUMN "endAt" TYPE TIMESTAMP USING "endAt",
    ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt",
    ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt";

ALTER TABLE "objectives"
    ADD CONSTRAINT "objectives_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "objectives_ownerId_cycle_idx" ON "objectives"("ownerId", "cycle");
CREATE INDEX IF NOT EXISTS "objectives_teamId_idx" ON "objectives"("teamId");
CREATE INDEX IF NOT EXISTS "objectives_status_idx" ON "objectives"("status");
CREATE INDEX IF NOT EXISTS "objectives_fiscalQuarter_idx" ON "objectives"("fiscalQuarter");
CREATE UNIQUE INDEX IF NOT EXISTS "teams_orgId_name_key" ON "teams"("orgId", "name");
