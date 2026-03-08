/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `outbox_events` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `outbox_events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "outbox_events" ADD COLUMN     "idempotencyKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_idempotencyKey_key" ON "outbox_events"("idempotencyKey");
