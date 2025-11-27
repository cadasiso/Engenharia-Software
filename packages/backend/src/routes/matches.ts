import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate } from '../middleware/auth';
import { calculateMatches, getMatches } from '../services/matching';

const router = Router();
const prisma = new PrismaClient();

// Get user's matches
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { roomId, scope } = req.query;
    
    let matches = await getMatches(userId);
    
    // Filter matches by room if specified
    if (scope === 'global') {
      matches = matches.filter((match: any) => {
        const books = match.matchingBooks || [];
        return books.every((book: any) => {
          // Check if book is global (no roomId in description)
          try {
            const userBookDesc = book.userBookId ? JSON.parse(book.userBookDescription || '{}') : {};
            const matchedBookDesc = book.matchedUserBookId ? JSON.parse(book.matchedUserBookDescription || '{}') : {};
            return !userBookDesc.roomId && !matchedBookDesc.roomId;
          } catch {
            return true;
          }
        });
      });
    } else if (roomId) {
      matches = matches.filter((match: any) => {
        const books = match.matchingBooks || [];
        return books.some((book: any) => {
          try {
            const userBookDesc = book.userBookId ? JSON.parse(book.userBookDescription || '{}') : {};
            const matchedBookDesc = book.matchedUserBookId ? JSON.parse(book.matchedUserBookDescription || '{}') : {};
            return userBookDesc.roomId === roomId || matchedBookDesc.roomId === roomId;
          } catch {
            return false;
          }
        });
      });
    }
    
    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Manually refresh matches
router.post('/refresh', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    await calculateMatches(userId);
    const matches = await getMatches(userId);
    res.json({ message: 'Matches refreshed', matches });
  } catch (error) {
    console.error('Refresh matches error:', error);
    res.status(500).json({ error: 'Failed to refresh matches' });
  }
});

// Hide individual match
router.delete('/:matchId', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { matchId } = req.params;

    const match = await prisma.match.findFirst({
      where: { id: matchId, userId },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { isHidden: true },
    });

    res.json({ message: 'Match hidden' });
  } catch (error) {
    console.error('Hide match error:', error);
    res.status(500).json({ error: 'Failed to hide match' });
  }
});

// Hide all matches
router.delete('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;

    await prisma.match.updateMany({
      where: { userId },
      data: { isHidden: true },
    });

    res.json({ message: 'All matches hidden' });
  } catch (error) {
    console.error('Hide all matches error:', error);
    res.status(500).json({ error: 'Failed to hide matches' });
  }
});

// Get matches for a specific book
router.get('/book/:bookId', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { bookId } = req.params;

    // Get the book to check if it exists and belongs to user
    const book = await prisma.book.findFirst({
      where: { id: bookId, userId },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Get all matches for this user
    const allMatches = await prisma.match.findMany({
      where: { userId, isHidden: false },
      include: {
        matchedUser: {
          select: { id: true, name: true, email: true, location: true },
        },
      },
    });

    // Filter matches that involve this specific book
    const bookMatches = allMatches.filter((match) => {
      const matchingBooks = match.matchingBooks as any[];
      return matchingBooks.some(
        (mb) =>
          mb.userBookId === bookId ||
          mb.matchedUserBookId === bookId ||
          (mb.bookTitle === book.title && mb.bookAuthor === book.author)
      );
    });

    res.json(bookMatches);
  } catch (error) {
    console.error('Get book matches error:', error);
    res.status(500).json({ error: 'Failed to fetch book matches' });
  }
});

export default router;
