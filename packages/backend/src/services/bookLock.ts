import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_LOCK_DURATION_HOURS = 48;
const MAX_EXTENSIONS = 2;

export interface CreateLockParams {
  bookId: string;
  ownerId: string;
  lockedForUserId: string;
  chatId: string;
  tradeProposalId: string;
  durationHours?: number;
}

export interface ExtendLockParams {
  lockId: string;
  additionalHours: number;
}

/**
 * Create a lock on a book for a specific trade proposal
 */
export const createBookLock = async (params: CreateLockParams) => {
  const {
    bookId,
    ownerId,
    lockedForUserId,
    chatId,
    tradeProposalId,
    durationHours = DEFAULT_LOCK_DURATION_HOURS,
  } = params;

  // Check if book is already locked
  const existingLock = await getActiveLock(bookId);
  if (existingLock) {
    throw new Error('Book is already locked for another trade');
  }

  // Check if book exists and is available
  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) {
    throw new Error('Book not found');
  }

  if (!book.isAvailable) {
    throw new Error('Book is not available');
  }

  if (book.userId !== ownerId) {
    throw new Error('User does not own this book');
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + durationHours);

  const lock = await prisma.bookLock.create({
    data: {
      bookId,
      ownerId,
      lockedForUserId,
      chatId,
      tradeProposalId,
      durationHours,
      expiresAt,
      extensionHistory: [],
    },
  });

  return lock;
};

/**
 * Get active lock for a book (not expired)
 */
export const getActiveLock = async (bookId: string) => {
  const lock = await prisma.bookLock.findFirst({
    where: {
      bookId,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return lock;
};

/**
 * Extend an existing lock
 */
export const extendBookLock = async (params: ExtendLockParams) => {
  const { lockId, additionalHours } = params;

  const lock = await prisma.bookLock.findUnique({
    where: { id: lockId },
  });

  if (!lock) {
    throw new Error('Lock not found');
  }

  // Check if lock has expired
  if (lock.expiresAt < new Date()) {
    throw new Error('Cannot extend expired lock');
  }

  // Check extension history
  const extensionHistory = (lock.extensionHistory as any[]) || [];
  if (extensionHistory.length >= MAX_EXTENSIONS) {
    throw new Error(`Maximum ${MAX_EXTENSIONS} extensions allowed`);
  }

  const newExpiresAt = new Date(lock.expiresAt);
  newExpiresAt.setHours(newExpiresAt.getHours() + additionalHours);

  const updatedHistory = [
    ...extensionHistory,
    {
      extendedAt: new Date(),
      additionalHours,
      previousExpiresAt: lock.expiresAt,
    },
  ];

  const updatedLock = await prisma.bookLock.update({
    where: { id: lockId },
    data: {
      expiresAt: newExpiresAt,
      extensionHistory: updatedHistory,
    },
  });

  return updatedLock;
};

/**
 * Release a lock (when trade is accepted, rejected, or cancelled)
 */
export const releaseBookLock = async (lockId: string) => {
  await prisma.bookLock.delete({
    where: { id: lockId },
  });
};

/**
 * Release all locks for a trade proposal
 */
export const releaseTradeProposalLocks = async (tradeProposalId: string) => {
  await prisma.bookLock.deleteMany({
    where: { tradeProposalId },
  });
};

/**
 * Get all active locks for a user's books
 */
export const getUserBookLocks = async (userId: string) => {
  const locks = await prisma.bookLock.findMany({
    where: {
      ownerId: userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      expiresAt: 'asc',
    },
  });

  return locks;
};

/**
 * Clean up expired locks (should be run periodically)
 */
export const cleanupExpiredLocks = async () => {
  const result = await prisma.bookLock.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
};

/**
 * Check if a book can be locked
 */
export const canLockBook = async (bookId: string): Promise<boolean> => {
  const activeLock = await getActiveLock(bookId);
  return !activeLock;
};

/**
 * Get competing interests for a book
 */
export const getBookCompetingInterests = async (bookId: string) => {
  const interests = await prisma.bookInterest.findMany({
    where: { bookId },
    include: {
      trade: {
        include: {
          participant1: {
            select: { id: true, name: true },
          },
          participant2: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return interests;
};
