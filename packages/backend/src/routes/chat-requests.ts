import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Create chat request
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { recipientId, matchId, message } = req.body;

    if (!recipientId || !matchId) {
      return res.status(400).json({ error: 'recipientId and matchId are required' });
    }

    // Prevent self-requests
    if (userId === recipientId) {
      return res.status(400).json({ error: 'Cannot send chat request to yourself' });
    }

    // Verify match exists and user is non-privileged (partial_type1)
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        userId,
        matchedUserId: recipientId,
        isHidden: false,
      },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Only partial_type1 (non-privileged) users should send requests
    if (match.matchType !== 'partial_type1' && match.matchType !== 'perfect') {
      return res.status(403).json({ 
        error: 'You can initiate chat directly for this match type' 
      });
    }

    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        OR: [
          { participant1Id: userId, participant2Id: recipientId },
          { participant1Id: recipientId, participant2Id: userId },
        ],
      },
    });

    if (existingChat) {
      return res.status(400).json({ error: 'Chat already exists with this user' });
    }

    // Check for existing pending request
    const existingRequest = await prisma.chatRequest.findFirst({
      where: {
        requesterId: userId,
        recipientId,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return res.status(409).json({ error: 'You already have a pending chat request with this user' });
    }

    // Create chat request
    const chatRequest = await prisma.chatRequest.create({
      data: {
        requesterId: userId,
        recipientId,
        matchId,
        message: message || null,
        status: 'pending',
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        recipient: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'chat_request_received',
        title: 'New Chat Request',
        message: `${chatRequest.requester.name} wants to chat with you`,
        relatedEntityId: chatRequest.id,
      },
    });

    res.status(201).json(chatRequest);
  } catch (error) {
    console.error('Create chat request error:', error);
    res.status(500).json({ error: 'Failed to create chat request' });
  }
});

// Reject chat request
router.post('/:id/reject', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Find the request
    const chatRequest = await prisma.chatRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
      },
    });

    if (!chatRequest) {
      return res.status(404).json({ error: 'Chat request not found' });
    }

    // Verify user is the recipient
    if (chatRequest.recipientId !== userId) {
      return res.status(403).json({ error: 'Only the recipient can reject this request' });
    }

    if (chatRequest.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }

    // Update request status
    const updatedRequest = await prisma.chatRequest.update({
      where: { id },
      data: { status: 'rejected' },
    });

    // Create notification for requester
    await prisma.notification.create({
      data: {
        userId: chatRequest.requesterId,
        type: 'chat_request_rejected',
        title: 'Chat Request Declined',
        message: `${chatRequest.recipient.name} declined your chat request`,
        relatedEntityId: id,
      },
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error('Reject chat request error:', error);
    res.status(500).json({ error: 'Failed to reject chat request' });
  }
});

// Accept chat request
router.post('/:id/accept', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Find the request
    const chatRequest = await prisma.chatRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
      },
    });

    if (!chatRequest) {
      return res.status(404).json({ error: 'Chat request not found' });
    }

    // Verify user is the recipient
    if (chatRequest.recipientId !== userId) {
      return res.status(403).json({ error: 'Only the recipient can accept this request' });
    }

    if (chatRequest.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }

    // Create chat
    const chat = await prisma.chat.create({
      data: {
        participant1Id: chatRequest.requesterId,
        participant2Id: chatRequest.recipientId,
      },
      include: {
        participant1: { select: { id: true, name: true, email: true } },
        participant2: { select: { id: true, name: true, email: true } },
      },
    });

    // Update request status
    await prisma.chatRequest.update({
      where: { id },
      data: { status: 'accepted' },
    });

    // Create notification for requester
    await prisma.notification.create({
      data: {
        userId: chatRequest.requesterId,
        type: 'chat_request_accepted',
        title: 'Chat Request Accepted',
        message: `${chatRequest.recipient.name} accepted your chat request`,
        relatedEntityId: chat.id,
      },
    });

    res.json({ chat, chatRequest });
  } catch (error) {
    console.error('Accept chat request error:', error);
    res.status(500).json({ error: 'Failed to accept chat request' });
  }
});

// Get user's chat requests (sent and received)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { status } = req.query;

    const whereClause: any = {
      OR: [
        { requesterId: userId },
        { recipientId: userId },
      ],
    };

    if (status) {
      whereClause.status = status as string;
    }

    const chatRequests = await prisma.chatRequest.findMany({
      where: whereClause,
      include: {
        requester: {
          select: { id: true, name: true, email: true, location: true },
        },
        recipient: {
          select: { id: true, name: true, email: true, location: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Separate into sent and received
    const sent = chatRequests.filter((r) => r.requesterId === userId);
    const received = chatRequests.filter((r) => r.recipientId === userId);

    res.json({ sent, received });
  } catch (error) {
    console.error('Get chat requests error:', error);
    res.status(500).json({ error: 'Failed to fetch chat requests' });
  }
});

export default router;
