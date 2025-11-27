import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate } from '../middleware/auth';
import { calculateMatches } from '../services/matching';

const router = Router();
const prisma = new PrismaClient();

// Get user's books (inventory and wishlist)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { listType, roomId, scope } = req.query;

    const where: any = { userId };
    if (listType === 'inventory' || listType === 'wishlist') {
      where.listType = listType;
    }

    const books = await prisma.book.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Filter by room scope if specified
    // We store room info in description as JSON: {"roomId": "xxx", "text": "actual description"}
    let filteredBooks = books;
    if (scope === 'global') {
      filteredBooks = books.filter(book => {
        try {
          const desc = JSON.parse(book.description || '{}');
          return !desc.roomId;
        } catch {
          return true; // If not JSON, it's global
        }
      });
    } else if (scope === 'not-room' && roomId) {
      // Get books that are NOT in this specific room (for room detail page)
      filteredBooks = books.filter(book => {
        try {
          const desc = JSON.parse(book.description || '{}');
          return desc.roomId !== roomId;
        } catch {
          return true; // If not JSON, it's available
        }
      });
    } else if (roomId) {
      filteredBooks = books.filter(book => {
        try {
          const desc = JSON.parse(book.description || '{}');
          return desc.roomId === roomId;
        } catch {
          return false;
        }
      });
    }

    res.json(filteredBooks);
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Get single book by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// Add book to inventory
router.post('/inventory', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { title, author, isbn, condition, description, photoUrls, roomId } = req.body;

    if (!title || !author || !condition) {
      return res.status(400).json({ error: 'Title, author, and condition are required' });
    }

    // Store room info in description as JSON if roomId provided
    let finalDescription = description || '';
    if (roomId) {
      finalDescription = JSON.stringify({ roomId, text: description || '' });
    }

    const book = await prisma.book.create({
      data: {
        userId,
        title,
        author,
        isbn: isbn || null,
        condition,
        description: finalDescription,
        photoUrls: photoUrls || [],
        isAvailable: true,
        listType: 'inventory',
      },
    });

    // Auto-refresh matches when inventory changes
    calculateMatches(userId).catch((err) => console.error('Match calculation error:', err));

    res.status(201).json(book);
  } catch (error) {
    console.error('Add book to inventory error:', error);
    res.status(500).json({ error: 'Failed to add book to inventory' });
  }
});

// Add book to wishlist
router.post('/wishlist', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { title, author, isbn, roomId } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required' });
    }

    // Store room info in description as JSON if roomId provided
    let finalDescription = '';
    if (roomId) {
      finalDescription = JSON.stringify({ roomId, text: '' });
    }

    const book = await prisma.book.create({
      data: {
        userId,
        title,
        author,
        isbn: isbn || null,
        condition: 'new', // Not relevant for wishlist but required by schema
        description: finalDescription || null,
        photoUrls: [],
        isAvailable: true,
        listType: 'wishlist',
      },
    });

    // Auto-refresh matches when wishlist changes
    calculateMatches(userId).catch((err) => console.error('Match calculation error:', err));

    res.status(201).json(book);
  } catch (error) {
    console.error('Add book to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add book to wishlist' });
  }
});

// Remove book from inventory
router.delete('/inventory/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const book = await prisma.book.findFirst({
      where: { id, userId, listType: 'inventory' },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await prisma.book.delete({ where: { id } });

    // Auto-refresh matches when inventory changes
    calculateMatches(userId).catch((err) => console.error('Match calculation error:', err));

    res.json({ message: 'Book removed from inventory' });
  } catch (error) {
    console.error('Remove book from inventory error:', error);
    res.status(500).json({ error: 'Failed to remove book' });
  }
});

// Remove book from wishlist
router.delete('/wishlist/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const book = await prisma.book.findFirst({
      where: { id, userId, listType: 'wishlist' },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await prisma.book.delete({ where: { id } });

    // Auto-refresh matches when wishlist changes
    calculateMatches(userId).catch((err) => console.error('Match calculation error:', err));

    res.json({ message: 'Book removed from wishlist' });
  } catch (error) {
    console.error('Remove book from wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove book' });
  }
});

// Update book availability
router.patch('/inventory/:id/availability', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ error: 'isAvailable must be a boolean' });
    }

    const book = await prisma.book.findFirst({
      where: { id, userId, listType: 'inventory' },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: { isAvailable },
    });

    // Auto-refresh matches when availability changes
    calculateMatches(userId).catch((err) => console.error('Match calculation error:', err));

    res.json(updatedBook);
  } catch (error) {
    console.error('Update book availability error:', error);
    res.status(500).json({ error: 'Failed to update book availability' });
  }
});

// Update inventory book (room assignment, description, etc.)
router.patch('/inventory/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { roomId, description } = req.body;

    console.log('PATCH /inventory/:id - roomId:', roomId, 'description:', description);

    const book = await prisma.book.findFirst({
      where: { id, userId, listType: 'inventory' },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    console.log('Current book description:', book.description);

    // Parse existing description to preserve text
    let existingText = '';
    try {
      const parsed = JSON.parse(book.description || '{}');
      existingText = parsed.text || '';
      if (!existingText) {
        // If no text field, the whole description might be plain text
        existingText = book.description || '';
      }
    } catch {
      // Not JSON, use as-is
      existingText = book.description || '';
    }

    // Update description with room info
    let finalDescription: string;
    if (roomId !== null && roomId !== undefined && roomId !== '') {
      // Assigning to a room
      finalDescription = JSON.stringify({ roomId, text: description !== undefined ? description : existingText });
    } else {
      // Removing from room - use plain text (description can be empty string)
      finalDescription = description !== undefined ? description : existingText;
    }

    console.log('Final description to save:', finalDescription);

    const updatedBook = await prisma.book.update({
      where: { id },
      data: { description: finalDescription },
    });

    // Auto-refresh matches when room assignment changes
    calculateMatches(userId).catch((err) => console.error('Match calculation error:', err));

    res.json(updatedBook);
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Update wishlist book (room assignment)
router.patch('/wishlist/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { roomId, description } = req.body;

    console.log('PATCH /wishlist/:id - roomId:', roomId, 'description:', description);

    const book = await prisma.book.findFirst({
      where: { id, userId, listType: 'wishlist' },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    console.log('Current book description:', book.description);

    // Parse existing description to preserve text
    let existingText = '';
    try {
      const parsed = JSON.parse(book.description || '{}');
      existingText = parsed.text || '';
      if (!existingText) {
        existingText = book.description || '';
      }
    } catch {
      existingText = book.description || '';
    }

    // Update description with room info
    let finalDescription: string;
    if (roomId !== null && roomId !== undefined && roomId !== '') {
      // Assigning to a room
      finalDescription = JSON.stringify({ roomId, text: description !== undefined ? description : existingText });
    } else {
      // Removing from room - use plain text (description can be empty string)
      finalDescription = description !== undefined ? description : existingText;
    }

    console.log('Final description to save:', finalDescription);

    const updatedBook = await prisma.book.update({
      where: { id },
      data: { description: finalDescription },
    });

    // Auto-refresh matches when room assignment changes
    calculateMatches(userId).catch((err) => console.error('Match calculation error:', err));

    res.json(updatedBook);
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

export default router;
