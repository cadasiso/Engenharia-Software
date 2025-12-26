import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import booksRoutes from './routes/books';
import matchesRoutes from './routes/matches';
import chatsRoutes from './routes/chats';
import chatRequestsRoutes from './routes/chat-requests';
import roomsRoutes from './routes/rooms';
import proposalsRoutes from './routes/proposals';
import tradesRoutes from './routes/trades';
import usersRoutes from './routes/users';
import { connectRedis } from './services/redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://engenharia-software-neon.vercel.app',
  process.env.FRONTEND_URL || '',
  process.env.CORS_ORIGIN || '',
].filter((origin) => origin !== '');

console.log('🌐 Allowed CORS origins:', allowedOrigins);

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
}));
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
app.use('/api/chat-requests', chatRequestsRoutes);
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
