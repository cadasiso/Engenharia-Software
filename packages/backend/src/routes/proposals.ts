import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get proposals for a chat
router.get('/chat/:chatId', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
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

    const proposals = await prisma.meetingProposal.findMany({
      where: { chatId },
      include: {
        proposer: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(proposals);
  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Create meeting proposal
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { chatId, place, dateTime } = req.body;

    if (!chatId || !place || !dateTime) {
      return res.status(400).json({ error: 'chatId, place, and dateTime are required' });
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

    const proposal = await prisma.meetingProposal.create({
      data: {
        chatId,
        proposerId: userId,
        place,
        dateTime: new Date(dateTime),
        status: 'pending',
      },
      include: {
        proposer: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json(proposal);
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

// Accept proposal
router.post('/:id/accept', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const proposal = await prisma.meetingProposal.findUnique({
      where: { id },
      include: { chat: true },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Verify user is participant (not the proposer)
    const isParticipant =
      proposal.chat.participant1Id === userId || proposal.chat.participant2Id === userId;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedProposal = await prisma.meetingProposal.update({
      where: { id },
      data: { status: 'confirmed' },
      include: {
        proposer: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(updatedProposal);
  } catch (error) {
    console.error('Accept proposal error:', error);
    res.status(500).json({ error: 'Failed to accept proposal' });
  }
});

// Reject proposal
router.post('/:id/reject', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const proposal = await prisma.meetingProposal.findUnique({
      where: { id },
      include: { chat: true },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Verify user is participant
    const isParticipant =
      proposal.chat.participant1Id === userId || proposal.chat.participant2Id === userId;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedProposal = await prisma.meetingProposal.update({
      where: { id },
      data: { status: 'rejected' },
      include: {
        proposer: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(updatedProposal);
  } catch (error) {
    console.error('Reject proposal error:', error);
    res.status(500).json({ error: 'Failed to reject proposal' });
  }
});

// Update proposal
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { place, dateTime } = req.body;

    const proposal = await prisma.meetingProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.proposerId !== userId) {
      return res.status(403).json({ error: 'Only proposer can update' });
    }

    // If confirmed, reset to pending when modified
    const newStatus = proposal.status === 'confirmed' ? 'pending' : proposal.status;

    const updatedProposal = await prisma.meetingProposal.update({
      where: { id },
      data: {
        ...(place && { place }),
        ...(dateTime && { dateTime: new Date(dateTime) }),
        status: newStatus,
      },
      include: {
        proposer: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(updatedProposal);
  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

export default router;
