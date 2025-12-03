import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate } from '../middleware/auth';
import * as bookLockService from '../services/bookLock';
import { transferBooks, BookTransferRequest } from '../services/bookTransfer';

const router = Router();
const prisma = new PrismaClient();

// Initiate a trade (create proposal with book locks)
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { matchId, offeredBookIds, requestedBookIds } = req.body;

    if (!matchId || !offeredBookIds || !requestedBookIds) {
      return res.status(400).json({ error: 'matchId, offeredBookIds, and requestedBookIds are required' });
    }

    if (!Array.isArray(offeredBookIds) || !Array.isArray(requestedBookIds)) {
      return res.status(400).json({ error: 'offeredBookIds and requestedBookIds must be arrays' });
    }

    // Verify match exists
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        userId,
      },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const otherUserId = match.matchedUserId;

    // Check if chat exists
    const chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { participant1Id: userId, participant2Id: otherUserId },
          { participant1Id: otherUserId, participant2Id: userId },
        ],
      },
    });

    if (!chat) {
      return res.status(400).json({ error: 'Chat must exist before creating trade' });
    }

    // Verify user owns the offered books
    const offeredBooks = await prisma.book.findMany({
      where: {
        id: { in: offeredBookIds },
        userId,
        isAvailable: true,
      },
    });

    if (offeredBooks.length !== offeredBookIds.length) {
      return res.status(400).json({ error: 'Some offered books are not available or do not belong to you' });
    }

    // Verify requested books belong to other user and are available
    const requestedBooks = await prisma.book.findMany({
      where: {
        id: { in: requestedBookIds },
        userId: otherUserId,
        isAvailable: true,
      },
    });

    if (requestedBooks.length !== requestedBookIds.length) {
      return res.status(400).json({ error: 'Some requested books are not available' });
    }

    // Check if any requested books are already locked
    for (const bookId of requestedBookIds) {
      const canLock = await bookLockService.canLockBook(bookId);
      if (!canLock) {
        const lock = await bookLockService.getActiveLock(bookId);
        return res.status(409).json({
          error: 'One or more requested books are already locked for another trade',
          lockedBookId: bookId,
          lockExpiresAt: lock?.expiresAt,
        });
      }
    }

    // Create trade proposal
    const trade = await prisma.trade.create({
      data: {
        participant1Id: userId,
        participant2Id: otherUserId,
        chatId: chat.id,
        proposerId: userId,
        booksOffered: offeredBookIds,
        booksRequested: requestedBookIds,
        status: 'pending',
      },
      include: {
        participant1: {
          select: { id: true, name: true },
        },
        participant2: {
          select: { id: true, name: true },
        },
      },
    });

    // Create locks for requested books
    const locks = [];
    for (const bookId of requestedBookIds) {
      try {
        const lock = await bookLockService.createBookLock({
          bookId,
          ownerId: otherUserId,
          lockedForUserId: userId,
          chatId: chat.id,
          tradeProposalId: trade.id,
        });
        locks.push(lock);
      } catch (error) {
        // If lock creation fails, clean up created locks and trade
        await bookLockService.releaseTradeProposalLocks(trade.id);
        await prisma.trade.delete({ where: { id: trade.id } });
        throw error;
      }
    }

    // Record book interests
    for (const bookId of requestedBookIds) {
      await prisma.bookInterest.create({
        data: {
          bookId,
          interestedUserId: userId,
          chatId: chat.id,
          tradeId: trade.id,
        },
      });
    }

    res.status(201).json({
      trade,
      locks,
      message: `Trade proposal created with ${locks.length} book(s) locked for 48 hours`,
    });
  } catch (error: any) {
    console.error('Create trade proposal error:', error);
    res.status(500).json({ error: error.message || 'Failed to create trade proposal' });
  }
});

// Get user's trades
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;

    const trades = await prisma.trade.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        participant1: {
          select: { id: true, name: true },
        },
        participant2: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match frontend expectations
    const transformedTrades = trades.map((trade) => {
      const isProposer = trade.proposerId === userId;
      const booksOffered = trade.booksOffered as string[];
      const booksRequested = trade.booksRequested as string[];
      
      return {
        ...trade,
        user1: trade.participant1,
        user2: trade.participant2,
        // If current user is proposer: they offer, they request
        // If current user is receiver: proposer offers (what they receive), proposer requests (what they give)
        user1BookIds: isProposer ? booksOffered : booksRequested,
        user2BookIds: isProposer ? booksRequested : booksOffered,
        user1Confirmed: false, // TODO: Add confirmation tracking
        user2Confirmed: false,
        status: trade.status,
      };
    });

    res.json(transformedTrades);
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Confirm trade
router.post('/:id/confirm', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const trade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.participant1Id !== userId && trade.participant2Id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // For now, simplified: when receiver confirms, trade is completed
    // TODO: Add proper two-way confirmation tracking
    const isReceiver = trade.proposerId !== userId;
    
    if (isReceiver) {
      // Receiver is confirming - complete the trade
      await prisma.trade.update({
        where: { id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Auto-close the chat when trade is completed
      const chat = await prisma.chat.findUnique({
        where: { id: trade.chatId },
      });

      if (chat && chat.status === 'active') {
        await prisma.chat.update({
          where: { id: trade.chatId },
          data: {
            status: 'closed',
            closedBy: 'system',
            closedAt: new Date(),
          },
        });

        // Create system message
        await prisma.message.create({
          data: {
            chatId: trade.chatId,
            senderId: userId,
            content: '✅ Trade completed! This chat has been automatically closed.',
          },
        });
      }
    } else {
      // Proposer is confirming - just acknowledge
      // In a full implementation, we'd track this separately
      return res.json({ message: 'Confirmation recorded, waiting for other party' });
    }

    const updatedTrade = await prisma.trade.findUnique({
      where: { id },
      include: {
        participant1: {
          select: { id: true, name: true },
        },
        participant2: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(updatedTrade);
  } catch (error) {
    console.error('Confirm trade error:', error);
    res.status(500).json({ error: 'Failed to confirm trade' });
  }
});

// Rate a user after trade
router.post('/:id/rate', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const trade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed trades' });
    }

    if (trade.participant1Id !== userId && trade.participant2Id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Determine who is being rated
    const ratedUserId = trade.participant1Id === userId ? trade.participant2Id : trade.participant1Id;

    const ratingRecord = await prisma.rating.create({
      data: {
        tradeId: id,
        fromUserId: userId,
        toUserId: ratedUserId,
        score: rating,
        comment: comment || null,
      },
    });

    res.status(201).json(ratingRecord);
  } catch (error) {
    console.error('Rate trade error:', error);
    res.status(500).json({ error: 'Failed to rate trade' });
  }
});

// Cancel/delete a trade
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const trade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.participant1Id !== userId && trade.participant2Id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (trade.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed trades' });
    }

    await prisma.trade.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json({ message: 'Trade cancelled successfully' });
  } catch (error) {
    console.error('Cancel trade error:', error);
    res.status(500).json({ error: 'Failed to cancel trade' });
  }
});

// Report a user
router.post('/report', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { tradeId, reportedUserId, reason, details } = req.body;

    if (!tradeId || !reportedUserId || !reason || !details) {
      return res.status(400).json({ error: 'tradeId, reportedUserId, reason, and details are required' });
    }

    const report = await prisma.report.create({
      data: {
        tradeId,
        reporterId: userId,
        reportedUserId,
        reason,
        details,
        status: 'pending',
      },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

export default router;

// Accept trade proposal
router.post('/:id/accept', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const trade = await prisma.trade.findUnique({
      where: { id },
      include: {
        participant1: { select: { id: true, name: true } },
        participant2: { select: { id: true, name: true } },
      },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    // Only the receiver (non-proposer) can accept
    if (trade.proposerId === userId) {
      return res.status(403).json({ error: 'Proposer cannot accept their own proposal' });
    }

    if (trade.participant1Id !== userId && trade.participant2Id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ error: 'Trade is not pending' });
    }

    // Determine proposer and recipient
    const proposerId = trade.proposerId;
    const recipientId = trade.participant1.id === proposerId ? trade.participant2.id : trade.participant1.id;

    // Prepare book transfer request
    const transferRequest: BookTransferRequest = {
      tradeId: id,
      offeredBooks: trade.booksOffered as string[],
      requestedBooks: trade.booksRequested as string[],
      proposerId,
      recipientId,
    };

    // Execute book transfer
    const transferResult = await transferBooks(transferRequest);

    if (!transferResult.success) {
      return res.status(400).json({
        error: 'Failed to complete trade',
        details: transferResult.error,
      });
    }

    // TODO: Create notifications for both users when Notification model is added

    // Fetch updated trade
    const updatedTrade = await prisma.trade.findUnique({
      where: { id },
      include: {
        participant1: { select: { id: true, name: true } },
        participant2: { select: { id: true, name: true } },
      },
    });

    res.json({
      trade: updatedTrade,
      transferResult: {
        success: transferResult.success,
        transferredBooks: transferResult.transferredBooks,
        auditLogIds: transferResult.auditLogIds,
      },
    });
  } catch (error) {
    console.error('Accept trade error:', error);
    res.status(500).json({ error: 'Failed to accept trade' });
  }
});

// Reject trade proposal
router.post('/:id/reject', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const trade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    // Only the receiver can reject
    if (trade.proposerId === userId) {
      return res.status(403).json({ error: 'Proposer cannot reject their own proposal. Use cancel instead.' });
    }

    if (trade.participant1Id !== userId && trade.participant2Id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ error: 'Trade is not pending' });
    }

    // Update trade status
    await prisma.trade.update({
      where: { id },
      data: {
        status: 'rejected',
      },
    });

    // Release all locks for this trade
    await bookLockService.releaseTradeProposalLocks(id);

    res.json({
      message: 'Trade rejected and book locks released',
      reason,
    });
  } catch (error) {
    console.error('Reject trade error:', error);
    res.status(500).json({ error: 'Failed to reject trade' });
  }
});

// Counter-propose (modify trade proposal)
router.post('/:id/counter', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { offeredBookIds, requestedBookIds } = req.body;

    if (!offeredBookIds || !requestedBookIds) {
      return res.status(400).json({ error: 'offeredBookIds and requestedBookIds are required' });
    }

    const trade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    // Only the receiver can counter-propose
    if (trade.proposerId === userId) {
      return res.status(403).json({ error: 'Proposer cannot counter their own proposal' });
    }

    if (trade.participant1Id !== userId && trade.participant2Id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ error: 'Can only counter pending trades' });
    }

    const otherUserId = trade.proposerId;

    // Verify user owns the offered books
    const offeredBooks = await prisma.book.findMany({
      where: {
        id: { in: offeredBookIds },
        userId,
        isAvailable: true,
      },
    });

    if (offeredBooks.length !== offeredBookIds.length) {
      return res.status(400).json({ error: 'Some offered books are not available' });
    }

    // Verify requested books belong to other user
    const requestedBooks = await prisma.book.findMany({
      where: {
        id: { in: requestedBookIds },
        userId: otherUserId,
        isAvailable: true,
      },
    });

    if (requestedBooks.length !== requestedBookIds.length) {
      return res.status(400).json({ error: 'Some requested books are not available' });
    }

    // Release old locks
    await bookLockService.releaseTradeProposalLocks(id);

    // Check if new requested books can be locked
    for (const bookId of requestedBookIds) {
      const canLock = await bookLockService.canLockBook(bookId);
      if (!canLock) {
        return res.status(409).json({
          error: 'One or more requested books are already locked',
        });
      }
    }

    // Update trade with new books and swap proposer
    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        proposerId: userId, // Counter-proposer becomes new proposer
        booksOffered: offeredBookIds,
        booksRequested: requestedBookIds,
      },
      include: {
        participant1: { select: { id: true, name: true } },
        participant2: { select: { id: true, name: true } },
      },
    });

    // Create new locks
    const locks = [];
    for (const bookId of requestedBookIds) {
      const lock = await bookLockService.createBookLock({
        bookId,
        ownerId: otherUserId,
        lockedForUserId: userId,
        chatId: trade.chatId,
        tradeProposalId: id,
      });
      locks.push(lock);
    }

    res.json({
      trade: updatedTrade,
      locks,
      message: 'Counter-proposal created with new book locks',
    });
  } catch (error: any) {
    console.error('Counter-propose error:', error);
    res.status(500).json({ error: error.message || 'Failed to create counter-proposal' });
  }
});

// Extend lock on a trade
router.post('/:id/extend-lock', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { additionalHours = 24 } = req.body;

    const trade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.participant1Id !== userId && trade.participant2Id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ error: 'Can only extend locks on pending trades' });
    }

    // Get all locks for this trade
    const locks = await prisma.bookLock.findMany({
      where: { tradeProposalId: id },
    });

    if (locks.length === 0) {
      return res.status(404).json({ error: 'No active locks found for this trade' });
    }

    // Extend all locks
    const extendedLocks = [];
    for (const lock of locks) {
      try {
        const extended = await bookLockService.extendBookLock({
          lockId: lock.id,
          additionalHours,
        });
        extendedLocks.push(extended);
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    }

    res.json({
      message: `Extended ${extendedLocks.length} lock(s) by ${additionalHours} hours`,
      locks: extendedLocks,
    });
  } catch (error) {
    console.error('Extend lock error:', error);
    res.status(500).json({ error: 'Failed to extend locks' });
  }
});

// Get locks for a trade
router.get('/:id/locks', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const trade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.participant1Id !== userId && trade.participant2Id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const locks = await prisma.bookLock.findMany({
      where: { tradeProposalId: id },
    });

    res.json(locks);
  } catch (error) {
    console.error('Get locks error:', error);
    res.status(500).json({ error: 'Failed to fetch locks' });
  }
});

// Get competing interests for user's books
router.get('/interests/my-books', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;

    // Get user's books
    const userBooks = await prisma.book.findMany({
      where: { userId, listType: 'inventory' },
      select: { id: true },
    });

    const bookIds = userBooks.map((b) => b.id);

    // Get all interests in these books
    const interests = await prisma.bookInterest.findMany({
      where: {
        bookId: { in: bookIds },
      },
      include: {
        trade: {
          include: {
            participant1: { select: { id: true, name: true } },
            participant2: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by book
    const interestsByBook: Record<string, any[]> = {};
    for (const interest of interests) {
      if (!interestsByBook[interest.bookId]) {
        interestsByBook[interest.bookId] = [];
      }
      interestsByBook[interest.bookId].push(interest);
    }

    res.json(interestsByBook);
  } catch (error) {
    console.error('Get interests error:', error);
    res.status(500).json({ error: 'Failed to fetch interests' });
  }
});
