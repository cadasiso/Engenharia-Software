import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Search users
router.get('/search', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const { query, location } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          ...(location ? [{ location: location as string }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        location: true,
        biography: true,
        profilePictureUrl: true,
        socialLinks: true,
        createdAt: true,
      },
      take: 20,
    });

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user by ID (public profile)
router.get('/:userId', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        location: true,
        biography: true,
        profilePictureUrl: true,
        socialLinks: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user's inventory
router.get('/:userId/inventory', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const { userId } = req.params;

    const books = await prisma.book.findMany({
      where: {
        userId,
        listType: 'inventory',
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(books);
  } catch (error) {
    console.error('Get user inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get user's wishlist
router.get('/:userId/wishlist', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const { userId } = req.params;

    const books = await prisma.book.findMany({
      where: {
        userId,
        listType: 'wishlist',
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(books);
  } catch (error) {
    console.error('Get user wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Get user's ratings
router.get('/:userId/ratings', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const { userId } = req.params;

    const ratings = await prisma.rating.findMany({
      where: { toUserId: userId },
      select: {
        id: true,
        score: true,
        comment: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average rating
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : 0;

    res.json({
      ratings: ratings.map((r) => ({
        id: r.id,
        rating: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length,
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

export default router;
