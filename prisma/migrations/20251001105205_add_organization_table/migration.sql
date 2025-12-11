-- Create organizations table
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- Align key_results weight to integer and defaults
ALTER TABLE "key_results"
    ALTER COLUMN "weight" TYPE INTEGER USING ROUND("weight"),
    ALTER COLUMN "weight" SET DEFAULT 100;

-- Add orgId to users and link to organizations
ALTER TABLE "users"
    ADD COLUMN "orgId" TEXT;

ALTER TABLE "users"
    ADD CONSTRAINT "users_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_orgId_idx" ON "users"("orgId");
