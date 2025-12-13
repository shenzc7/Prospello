-- Align notifications table name with Prisma mapping
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Notification'
  ) THEN
    EXECUTE 'ALTER TABLE "Notification" RENAME TO "notifications"';
  END IF;
END $$;
