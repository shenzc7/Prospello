/*
  Warnings:

  - You are about to drop the column `at` on the `check_ins` table. All the data in the column will be lost.
  - Added the required column `weekStart` to the `check_ins` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "initiatives" ADD COLUMN "notes" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_check_ins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyResultId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "value" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "check_ins_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "key_results" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_check_ins" ("comment", "createdAt", "id", "keyResultId", "status", "updatedAt", "userId", "value") SELECT "comment", "createdAt", "id", "keyResultId", "status", "updatedAt", "userId", "value" FROM "check_ins";
DROP TABLE "check_ins";
ALTER TABLE "new_check_ins" RENAME TO "check_ins";
CREATE UNIQUE INDEX "check_ins_keyResultId_userId_weekStart_key" ON "check_ins"("keyResultId", "userId", "weekStart");
CREATE TABLE "new_key_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectiveId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "target" REAL NOT NULL,
    "current" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "key_results_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "objectives" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_key_results" ("createdAt", "current", "id", "objectiveId", "target", "title", "unit", "updatedAt", "weight") SELECT "createdAt", "current", "id", "objectiveId", "target", "title", "unit", "updatedAt", "weight" FROM "key_results";
DROP TABLE "key_results";
ALTER TABLE "new_key_results" RENAME TO "key_results";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "initiatives_keyResultId_idx" ON "initiatives"("keyResultId");

-- CreateIndex
CREATE INDEX "objectives_ownerId_cycle_idx" ON "objectives"("ownerId", "cycle");
