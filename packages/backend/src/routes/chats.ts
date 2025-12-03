import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Check chat status with a user
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

    // Check for pending chat request
    const pendingRequest = await prisma.chatRequest.findFirst({
      where: {
        OR: [
          { requesterId: userId, recipientId: matchedUserId, status: 'pending' },
          { requesterId: matchedUserId, recipientId: userId, status: 'pending' },
        ],
      },
    });

    if (pendingRequest) {
      if (pendingRequest.requesterId === userId) {
        return res.json({ status: 'request_sent', canInitiate: false, requestId: pendingRequest.id });
      } else {
        return res.json({ status: 'request_received', canInitiate: true, requestId: pendingRequest.id });
      }
    }

    // Check match type
    const userMatch = await prisma.match.findFirst({
      where: { userId, matchedUserId, isHidden: false },
    });

    if (!userMatch) {
      return res.json({ status: 'no_match', canInitiate: false });
    }

    const reverseMatch = await prisma.match.findFirst({
      where: { userId: matchedUserId, matchedUserId: userId, isHidden: false },
    });

    if (userMatch.matchType === 'perfect') {
      if (reverseMatch) {
        return res.json({ status: 'both_ready', canInitiate: true, matchType: 'perfect' });
      } else {
        return res.json({ status: 'waiting_for_other', canInitiate: false, matchType: 'perfect' });
      }
    } else if (userMatch.matchType === 'partial_type1') {
      // Non-privileged - must send request
      return res.json({ status: 'can_request', canInitiate: false, matchType: 'partial_type1' });
    } else if (userMatch.matchType === 'partial_type2') {
      // Privileged - can initiate directly
      return res.json({ status: 'can_initiate', canInitiate: true, matchType: 'partial_type2' });
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
    const { status } = req.query; // 'active', 'closed', or undefined for all

    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
        ...(status && { status: status as string }),
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

    // Handle different match types
    if (userMatch.matchType === 'perfect') {
      // For perfect matches, both users must have initiated (mutual agreement)
      if (!reverseMatch) {
        return res.status(403).json({ 
          error: 'Both users must agree to chat for perfect matches',
          requiresRequest: true 
        });
      }
    } else if (userMatch.matchType === 'partial_type1') {
      // Non-privileged user (they have what you want) - must send request
      return res.status(403).json({ 
        error: 'Please send a chat request to this user',
        requiresRequest: true 
      });
    } else if (userMatch.matchType === 'partial_type2') {
      // Privileged user (you have what they want) - can initiate directly
      // Continue to create chat
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

    // Auto-accept any pending chat requests when chat is created
    await prisma.chatRequest.updateMany({
      where: {
        OR: [
          { requesterId: userId, recipientId: matchedUserId, status: 'pending' },
          { requesterId: matchedUserId, recipientId: userId, status: 'pending' },
        ],
      },
      data: { status: 'accepted' },
    });

    // Notify the other user
    await prisma.notification.create({
      data: {
        userId: matchedUserId,
        type: 'chat_initiated',
        title: 'New Chat',
        message: `${chat.participant1.name} started a chat with you`,
        relatedEntityId: chat.id,
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

    // Check if chat is closed
    if (chat.status === 'closed') {
      return res.status(403).json({ error: 'Cannot send messages to a closed chat' });
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

// Close chat
router.post('/:chatId/close', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { chatId } = req.params;

    // Verify user is participant
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        participant1: { select: { id: true, name: true } },
        participant2: { select: { id: true, name: true } },
      },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.status === 'closed') {
      return res.status(400).json({ error: 'Chat is already closed' });
    }

    // Close the chat
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        status: 'closed',
        closedBy: userId,
        closedAt: new Date(),
      },
    });

    // Get the user who closed the chat
    const closerName = chat.participant1.id === userId ? chat.participant1.name : chat.participant2.name;
    const otherUserId = chat.participant1Id === userId ? chat.participant2Id : chat.participant1Id;

    // Create system message
    await prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: `🔒 ${closerName} has closed this chat.`,
      },
    });

    // Create notification for the other user
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'chat_closed',
        title: 'Chat Closed',
        message: `${closerName} has closed your chat conversation.`,
        relatedEntityId: chatId,
      },
    });

    res.json(updatedChat);
  } catch (error) {
    console.error('Close chat error:', error);
    res.status(500).json({ error: 'Failed to close chat' });
  }
});

export default router;
