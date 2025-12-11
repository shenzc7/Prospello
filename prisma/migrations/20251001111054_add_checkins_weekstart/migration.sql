-- Add notes to initiatives
ALTER TABLE "initiatives" ADD COLUMN "notes" TEXT;

-- Move check-ins to weekStart and Postgres-friendly timestamps
ALTER TABLE "check_ins" DROP COLUMN "at";
ALTER TABLE "check_ins" ADD COLUMN "weekStart" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "check_ins" ALTER COLUMN "weekStart" DROP DEFAULT;
ALTER TABLE "check_ins"
    ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt",
    ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt";

-- Unique composite index for check-ins
CREATE UNIQUE INDEX "check_ins_keyResultId_userId_weekStart_key" ON "check_ins"("keyResultId", "userId", "weekStart");

-- Indexes
CREATE INDEX "initiatives_keyResultId_idx" ON "initiatives"("keyResultId");
CREATE INDEX "objectives_ownerId_cycle_idx" ON "objectives"("ownerId", "cycle");
