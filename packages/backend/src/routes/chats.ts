import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Check chat status with a user (for perfect matches)
router.get('/status/:matchedUserId', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { matchedUserId } = req.params;

    // Check if chat exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        OR: [
          { participant1Id: userId, participant2Id: matchedUserId },
          { participant1Id: matchedUserId, participant2Id: userId },
        ],
      },
    });

    if (existingChat) {
      return res.json({ status: 'active', chatId: existingChat.id });
    }

    // Check if both have matches (for perfect matches)
    const userMatch = await prisma.match.findFirst({
      where: { userId, matchedUserId, isHidden: false },
    });

    const reverseMatch = await prisma.match.findFirst({
      where: { userId: matchedUserId, matchedUserId: userId, isHidden: false },
    });

    if (userMatch?.matchType === 'perfect') {
      if (reverseMatch) {
        return res.json({ status: 'both_ready', canInitiate: true });
      } else {
        return res.json({ status: 'waiting_for_other', canInitiate: false });
      }
    }

    res.json({ status: 'can_initiate', canInitiate: true });
  } catch (error) {
    console.error('Check chat status error:', error);
    res.status(500).json({ error: 'Failed to check chat status' });
  }
});

// Get user's chats
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;

    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        participant1: {
          select: { id: true, name: true, email: true },
        },
        participant2: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Create chat from match
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { matchedUserId } = req.body;

    if (!matchedUserId) {
      return res.status(400).json({ error: 'matchedUserId is required' });
    }

    // Check if match exists for current user
    const userMatch = await prisma.match.findFirst({
      where: {
        userId,
        matchedUserId,
        isHidden: false,
      },
    });

    if (!userMatch) {
      return res.status(403).json({ error: 'Can only chat with matched users' });
    }

    // Check if reverse match exists
    const reverseMatch = await prisma.match.findFirst({
      where: {
        userId: matchedUserId,
        matchedUserId: userId,
        isHidden: false,
      },
    });

    // For perfect matches, both users must have initiated chat
    if (userMatch.matchType === 'perfect') {
      if (!reverseMatch) {
        return res.status(403).json({ error: 'Both users must agree to chat for perfect matches' });
      }
    }

    // For partial matches, only the privileged side can initiate
    // partial_type1: They have what you want (you can initiate)
    // partial_type2: You have what they want (they must initiate)
    if (userMatch.matchType === 'partial_type2') {
      return res.status(403).json({ error: 'Only the user with requested books can initiate chat for partial matches' });
    }

    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        OR: [
          { participant1Id: userId, participant2Id: matchedUserId },
          { participant1Id: matchedUserId, participant2Id: userId },
        ],
      },
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new chat
    const chat = await prisma.chat.create({
      data: {
        participant1Id: userId,
        participant2Id: matchedUserId,
      },
      include: {
        participant1: {
          select: { id: true, name: true, email: true },
        },
        participant2: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { chatId } = req.params;

    // Verify user is participant
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/:chatId/messages', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is participant
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
    });

    // Update chat timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
