import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { storeSession, deleteSession } from '../services/redis';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Register
router.post('/register', async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const { name, email, password, location } = req.body;

    // Basic validation
    if (!name || !email || !password || !location) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        location,
      },
    });

    // Initialize location rooms if they don't exist
    let locationRoom = await prisma.room.findFirst({
      where: { location, type: 'location' },
    });

    if (!locationRoom) {
      // Create location room
      locationRoom = await prisma.room.create({
        data: {
          name: `${location} - General`,
          location,
          type: 'location',
          adminIds: [],
        },
      });

      // Create genre rooms
      const genres = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy'];
      for (const genre of genres) {
        await prisma.room.create({
          data: {
            name: `${location} - ${genre}`,
            location,
            type: 'public_genre',
            genre,
            adminIds: [],
          },
        });
      }
    }

    // Auto-join user to location room
    await prisma.roomMembership.create({
      data: {
        roomId: locationRoom.id,
        userId: user.id,
        status: 'member',
      },
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Store session
    await storeSession(user.id, token);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        location: user.location,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Store session
    await storeSession(user.id, token);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        location: user.location,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user) {
      await deleteSession(req.user.userId);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Password reset request (simplified for prototype)
router.post('/password-reset', async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // In a real app, send email with reset token
    // For prototype, just return success
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Password reset confirmation (simplified for prototype)
router.put('/password-reset', async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate session
    await deleteSession(user.id);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

export default router;
