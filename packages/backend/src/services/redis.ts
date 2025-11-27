import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({ url: REDIS_URL });

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Redis connected');
  }
};

export const disconnectRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
};

// Session management
export const storeSession = async (userId: string, token: string) => {
  await redisClient.set(`session:${userId}`, token, { EX: 7 * 24 * 60 * 60 }); // 7 days
};

export const getSession = async (userId: string): Promise<string | null> => {
  return await redisClient.get(`session:${userId}`);
};

export const deleteSession = async (userId: string) => {
  await redisClient.del(`session:${userId}`);
};
