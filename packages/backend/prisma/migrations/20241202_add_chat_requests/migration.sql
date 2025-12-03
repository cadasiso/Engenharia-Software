-- Create ChatRequest table
CREATE TABLE "ChatRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRequest_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX "ChatRequest_requesterId_recipientId_key" ON "ChatRequest"("requesterId", "recipientId");

-- Create indexes for performance
CREATE INDEX "ChatRequest_recipientId_status_idx" ON "ChatRequest"("recipientId", "status");
CREATE INDEX "ChatRequest_requesterId_status_idx" ON "ChatRequest"("requesterId", "status");

-- Add foreign key constraints
ALTER TABLE "ChatRequest" ADD CONSTRAINT "ChatRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatRequest" ADD CONSTRAINT "ChatRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
