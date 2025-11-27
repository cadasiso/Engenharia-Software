import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Get user profile
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
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
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;
    const { name, location, biography, socialLinks } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(biography !== undefined && { biography }),
        ...(socialLinks && { socialLinks }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        biography: true,
        profilePictureUrl: true,
        socialLinks: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile picture
router.post(
  '/picture',
  authenticate,
  upload.single('picture'),
  async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
      const userId = req.user!.userId;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Delete old profile picture if exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { profilePictureUrl: true },
      });

      if (user?.profilePictureUrl) {
        const oldFilePath = path.join(__dirname, '../../', user.profilePictureUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update user with new profile picture URL
      const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePictureUrl },
        select: {
          id: true,
          name: true,
          email: true,
          location: true,
          biography: true,
          profilePictureUrl: true,
          socialLinks: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  }
);

// Get user ratings
router.get('/ratings', authenticate, async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user!.userId;

    const ratings = await prisma.rating.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
          },
        },
        trade: {
          select: {
            id: true,
            createdAt: true,
          },
        },
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
        rater: r.fromUser,
        trade: r.trade,
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length,
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

export default router;
