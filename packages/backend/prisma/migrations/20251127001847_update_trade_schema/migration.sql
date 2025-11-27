/*
  Warnings:

  - You are about to drop the column `books` on the `Trade` table. All the data in the column will be lost.
  - Added the required column `booksOffered` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `booksRequested` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proposerId` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "books",
ADD COLUMN     "booksOffered" JSONB NOT NULL,
ADD COLUMN     "booksRequested" JSONB NOT NULL,
ADD COLUMN     "proposerId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- CreateTable
CREATE TABLE "BookLock" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "lockedForUserId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "tradeProposalId" TEXT NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "extensionHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookInterest" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "interestedUserId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookLock_bookId_idx" ON "BookLock"("bookId");

-- CreateIndex
CREATE INDEX "BookLock_ownerId_idx" ON "BookLock"("ownerId");

-- CreateIndex
CREATE INDEX "BookLock_lockedForUserId_idx" ON "BookLock"("lockedForUserId");

-- CreateIndex
CREATE INDEX "BookLock_expiresAt_idx" ON "BookLock"("expiresAt");

-- CreateIndex
CREATE INDEX "BookInterest_bookId_idx" ON "BookInterest"("bookId");

-- CreateIndex
CREATE INDEX "BookInterest_interestedUserId_idx" ON "BookInterest"("interestedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "BookInterest_bookId_tradeId_key" ON "BookInterest"("bookId", "tradeId");

-- CreateIndex
CREATE INDEX "Trade_chatId_idx" ON "Trade"("chatId");

-- CreateIndex
CREATE INDEX "Trade_status_idx" ON "Trade"("status");

-- AddForeignKey
ALTER TABLE "BookInterest" ADD CONSTRAINT "BookInterest_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
