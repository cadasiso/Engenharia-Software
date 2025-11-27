import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import booksRoutes from './routes/books';
import matchesRoutes from './routes/matches';
import chatsRoutes from './routes/chats';
import roomsRoutes from './routes/rooms';
import proposalsRoutes from './routes/proposals';
import tradesRoutes from './routes/trades';
import usersRoutes from './routes/users';
import { connectRedis } from './services/redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/users', usersRoutes);

// Start server
const startServer = async () => {
  try {
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
