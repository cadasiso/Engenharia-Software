-- Add status and closedBy fields to Chat model
ALTER TABLE "Chat" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Chat" ADD COLUMN "closedBy" TEXT;
ALTER TABLE "Chat" ADD COLUMN "closedAt" TIMESTAMP(3);

-- Add index for status
CREATE INDEX "Chat_status_idx" ON "Chat"("status");
