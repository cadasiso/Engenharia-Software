import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interfaces for book transfer operations
export interface BookTransferRequest {
  tradeId: string;
  offeredBooks: string[]; // Book IDs from proposer
  requestedBooks: string[]; // Book IDs from recipient
  proposerId: string;
  recipientId: string;
}

export interface BookTransferResult {
  success: boolean;
  transferredBooks: {
    toProposer: any[];
    toRecipient: any[];
  };
  auditLogIds: string[];
  error?: string;
}

/**
 * Validates that all books exist and have correct ownership
 */
export async function validateBookOwnership(
  offeredBooks: string[],
  requestedBooks: string[],
  proposerId: string,
  recipientId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check offered books belong to proposer
    const offeredBooksData = await prisma.book.findMany({
      where: {
        id: { in: offeredBooks },
        userId: proposerId,
      },
    });

    if (offeredBooksData.length !== offeredBooks.length) {
      return {
        valid: false,
        error: 'Some offered books do not belong to the proposer or do not exist',
      };
    }

    // Check requested books belong to recipient
    const requestedBooksData = await prisma.book.findMany({
      where: {
        id: { in: requestedBooks },
        userId: recipientId,
      },
    });

    if (requestedBooksData.length !== requestedBooks.length) {
      return {
        valid: false,
        error: 'Some requested books do not belong to the recipient or do not exist',
      };
    }

    // Check all books are available (not locked)
    const allBooks = [...offeredBooksData, ...requestedBooksData];
    const unavailableBooks = allBooks.filter((book) => !book.isAvailable);

    if (unavailableBooks.length > 0) {
      return {
        valid: false,
        error: `Some books are not available: ${unavailableBooks.map((b) => b.title).join(', ')}`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating book ownership:', error);
    return {
      valid: false,
      error: 'Failed to validate book ownership',
    };
  }
}

/**
 * Transfers books between users atomically using database transaction
 */
export async function transferBooks(request: BookTransferRequest): Promise<BookTransferResult> {
  try {
    // First validate ownership
    const validation = await validateBookOwnership(
      request.offeredBooks,
      request.requestedBooks,
      request.proposerId,
      request.recipientId
    );

    if (!validation.valid) {
      return {
        success: false,
        transferredBooks: { toProposer: [], toRecipient: [] },
        auditLogIds: [],
        error: validation.error,
      };
    }

    // Perform atomic transfer using transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update ownership of offered books (proposer -> recipient)
      await tx.book.updateMany({
        where: {
          id: { in: request.offeredBooks },
          userId: request.proposerId,
        },
        data: {
          userId: request.recipientId,
          isAvailable: true, // Mark as available under new ownership
        },
      });

      // 2. Update ownership of requested books (recipient -> proposer)
      await tx.book.updateMany({
        where: {
          id: { in: request.requestedBooks },
          userId: request.recipientId,
        },
        data: {
          userId: request.proposerId,
          isAvailable: true, // Mark as available under new ownership
        },
      });

      // 3. Create audit log entries for offered books
      const offeredAuditLogs = await Promise.all(
        request.offeredBooks.map((bookId) =>
          tx.bookAuditLog.create({
            data: {
              bookId,
              fromUserId: request.proposerId,
              toUserId: request.recipientId,
              tradeId: request.tradeId,
              action: 'transfer',
              metadata: {
                transferType: 'offered',
                timestamp: new Date().toISOString(),
              },
            },
          })
        )
      );

      // 4. Create audit log entries for requested books
      const requestedAuditLogs = await Promise.all(
        request.requestedBooks.map((bookId) =>
          tx.bookAuditLog.create({
            data: {
              bookId,
              fromUserId: request.recipientId,
              toUserId: request.proposerId,
              tradeId: request.tradeId,
              action: 'transfer',
              metadata: {
                transferType: 'requested',
                timestamp: new Date().toISOString(),
              },
            },
          })
        )
      );

      // 5. Release all book locks associated with this trade
      await tx.bookLock.deleteMany({
        where: {
          tradeProposalId: request.tradeId,
        },
      });

      // 6. Update trade status to completed
      await tx.trade.update({
        where: { id: request.tradeId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // 7. Fetch the transferred books for response
      const offeredBooksData = await tx.book.findMany({
        where: { id: { in: request.offeredBooks } },
      });

      const requestedBooksData = await tx.book.findMany({
        where: { id: { in: request.requestedBooks } },
      });

      return {
        transferredToRecipient: offeredBooksData,
        transferredToProposer: requestedBooksData,
        auditLogs: [...offeredAuditLogs, ...requestedAuditLogs],
      };
    });

    return {
      success: true,
      transferredBooks: {
        toProposer: result.transferredToProposer,
        toRecipient: result.transferredToRecipient,
      },
      auditLogIds: result.auditLogs.map((log) => log.id),
    };
  } catch (error) {
    console.error('Error transferring books:', error);
    return {
      success: false,
      transferredBooks: { toProposer: [], toRecipient: [] },
      auditLogIds: [],
      error: 'Failed to transfer books. Transaction rolled back.',
    };
  }
}

/**
 * Gets audit history for a book
 */
export async function getBookAuditHistory(bookId: string) {
  try {
    return await prisma.bookAuditLog.findMany({
      where: { bookId },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching book audit history:', error);
    throw new Error('Failed to fetch audit history');
  }
}

/**
 * Gets audit history for a trade
 */
export async function getTradeAuditHistory(tradeId: string) {
  try {
    return await prisma.bookAuditLog.findMany({
      where: { tradeId },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching trade audit history:', error);
    throw new Error('Failed to fetch trade audit history');
  }
}
