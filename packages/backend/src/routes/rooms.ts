import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get rooms for user's location
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all rooms for user's location
    const rooms = await prisma.room.findMany({
      where: { location: user.location },
      include: {
        memberships: {
          where: { userId, status: 'member' },
        },
        _count: {
          select: { memberships: { where: { status: 'member' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create location room (auto-created on first user registration)
router.post('/init-location', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if location room exists
    let locationRoom = await prisma.room.findFirst({
      where: { location: user.location, type: 'location' },
    });

    if (!locationRoom) {
      // Create location room
      locationRoom = await prisma.room.create({
        data: {
          name: `${user.location} - General`,
          location: user.location,
          type: 'location',
          adminIds: [],
        },
      });

      // Create genre rooms
      const genres = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy'];
      for (const genre of genres) {
        await prisma.room.create({
          data: {
            name: `${user.location} - ${genre}`,
            location: user.location,
            type: 'public_genre',
            genre,
            adminIds: [],
          },
        });
      }
    }

    // Auto-join user to location room
    const membership = await prisma.roomMembership.findFirst({
      where: { roomId: locationRoom.id, userId },
    });

    if (!membership) {
      await prisma.roomMembership.create({
        data: {
          roomId: locationRoom.id,
          userId,
          status: 'member',
        },
      });
    }

    res.json({ message: 'Location rooms initialized' });
  } catch (error) {
    console.error('Init location error:', error);
    res.status(500).json({ error: 'Failed to initialize location' });
  }
});

// Join a room
router.post('/:roomId/join', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if already a member
    const existing = await prisma.roomMembership.findFirst({
      where: { roomId, userId },
    });

    if (existing) {
      return res.json({ message: 'Already a member' });
    }

    // For public rooms, join immediately
    if (room.type === 'location' || room.type === 'public_genre') {
      await prisma.roomMembership.create({
        data: {
          roomId,
          userId,
          status: 'member',
        },
      });
      return res.json({ message: 'Joined room' });
    }

    // For private rooms, request to join
    await prisma.roomMembership.create({
      data: {
        roomId,
        userId,
        status: 'pending',
      },
    });

    res.json({ message: 'Join request sent' });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Get room messages (simplified - no actual messages for prototype)
router.get('/:roomId/messages', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { roomId } = req.params;

    // Verify membership
    const membership = await prisma.roomMembership.findFirst({
      where: { roomId, userId, status: 'member' },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    // For prototype, return empty array (would implement room messages in full version)
    res.json([]);
  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create private room
router.post('/private', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { name, genre, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create private room
    const room = await prisma.room.create({
      data: {
        name,
        location: user.location,
        type: isPublic ? 'public_custom' : 'private',
        genre: genre || null,
        adminIds: [userId],
      },
    });

    // Auto-join creator as member
    await prisma.roomMembership.create({
      data: {
        roomId: room.id,
        userId,
        status: 'member',
      },
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('Create private room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Search rooms
router.get('/search', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { query } = req.query;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rooms = await prisma.room.findMany({
      where: {
        location: user.location,
        OR: [
          { type: { in: ['location', 'public_genre', 'public_custom'] } },
          { adminIds: { has: userId } },
        ],
        ...(query && { name: { contains: query as string, mode: 'insensitive' } }),
      },
      include: {
        memberships: {
          where: { userId },
        },
        _count: {
          select: { memberships: { where: { status: 'member' } } },
        },
      },
    });

    res.json(rooms);
  } catch (error) {
    console.error('Search rooms error:', error);
    res.status(500).json({ error: 'Failed to search rooms' });
  }
});

// Request to join private room
router.post('/:roomId/request', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.type !== 'private') {
      return res.status(400).json({ error: 'Can only request to join private rooms' });
    }

    // Check if already member or has pending request
    const existing = await prisma.roomMembership.findFirst({
      where: { roomId, userId },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already member or request pending' });
    }

    const membership = await prisma.roomMembership.create({
      data: {
        roomId,
        userId,
        status: 'pending',
      },
    });

    res.status(201).json(membership);
  } catch (error) {
    console.error('Request join error:', error);
    res.status(500).json({ error: 'Failed to request join' });
  }
});

// Approve join request (admin only)
router.post('/:roomId/approve/:userId', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const adminId = req.user!.userId;
    const { roomId, userId } = req.params;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.adminIds.includes(adminId)) {
      return res.status(403).json({ error: 'Only admins can approve requests' });
    }

    const membership = await prisma.roomMembership.findFirst({
      where: { roomId, userId, status: 'pending' },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    const updated = await prisma.roomMembership.update({
      where: { id: membership.id },
      data: { status: 'member' },
    });

    res.json(updated);
  } catch (error) {
    console.error('Approve join error:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// Deny join request (admin only)
router.post('/:roomId/deny/:userId', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const adminId = req.user!.userId;
    const { roomId, userId } = req.params;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.adminIds.includes(adminId)) {
      return res.status(403).json({ error: 'Only admins can deny requests' });
    }

    const membership = await prisma.roomMembership.findFirst({
      where: { roomId, userId, status: 'pending' },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    await prisma.roomMembership.delete({
      where: { id: membership.id },
    });

    res.json({ message: 'Request denied' });
  } catch (error) {
    console.error('Deny join error:', error);
    res.status(500).json({ error: 'Failed to deny request' });
  }
});

// Get pending join requests for a room (admin only)
router.get('/:roomId/requests', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const adminId = req.user!.userId;
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.adminIds.includes(adminId)) {
      return res.status(403).json({ error: 'Only admins can view requests' });
    }

    const requests = await prisma.roomMembership.findMany({
      where: { roomId, status: 'pending' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Remove member from room (admin only)
router.delete('/:roomId/members/:userId', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const adminId = req.user!.userId;
    const { roomId, userId } = req.params;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.adminIds.includes(adminId)) {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    const membership = await prisma.roomMembership.findFirst({
      where: { roomId, userId },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await prisma.roomMembership.delete({
      where: { id: membership.id },
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Toggle room visibility (admin only)
router.patch('/:roomId/visibility', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const adminId = req.user!.userId;
    const { roomId } = req.params;
    const { isPublic } = req.body;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.adminIds.includes(adminId)) {
      return res.status(403).json({ error: 'Only admins can change visibility' });
    }

    if (room.type === 'location' || room.type === 'public_genre') {
      return res.status(400).json({ error: 'Cannot change visibility of system rooms' });
    }

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: { type: isPublic ? 'public_custom' : 'private' },
    });

    res.json(updated);
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ error: 'Failed to toggle visibility' });
  }
});

// Get room details
router.get('/:roomId/details', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { roomId } = req.params;

    // Verify membership
    const membership = await prisma.roomMembership.findFirst({
      where: { roomId, userId, status: 'member' },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room details error:', error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
});

// Get room members
router.get('/:roomId/members', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { roomId } = req.params;

    // Verify membership
    const membership = await prisma.roomMembership.findFirst({
      where: { roomId, userId, status: 'member' },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const members = await prisma.roomMembership.findMany({
      where: { roomId, status: 'member' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    res.json(members);
  } catch (error) {
    console.error('Get room members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

export default router;
