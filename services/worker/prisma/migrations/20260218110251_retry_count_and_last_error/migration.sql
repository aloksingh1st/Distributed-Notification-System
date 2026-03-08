-- AlterTable
ALTER TABLE "outbox_events" ADD COLUMN     "last_error" TEXT,
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0;
