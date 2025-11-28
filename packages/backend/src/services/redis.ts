import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({ url: REDIS_URL });

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('✅ Redis connected');
    }
  } catch (error) {
    console.warn('⚠️  Redis connection failed - running without Redis:', error);
    // Continue without Redis - sessions will use JWT only
  }
};

export const disconnectRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
};

// Session management
export const storeSession = async (userId: string, token: string) => {
  try {
    if (redisClient.isOpen) {
      await redisClient.set(`session:${userId}`, token, { EX: 7 * 24 * 60 * 60 }); // 7 days
    }
  } catch (error) {
    console.warn('Redis storeSession failed:', error);
  }
};

export const getSession = async (userId: string): Promise<string | null> => {
  try {
    if (redisClient.isOpen) {
      return await redisClient.get(`session:${userId}`);
    }
  } catch (error) {
    console.warn('Redis getSession failed:', error);
  }
  return null;
};

export const deleteSession = async (userId: string) => {
  try {
    if (redisClient.isOpen) {
      await redisClient.del(`session:${userId}`);
    }
  } catch (error) {
    console.warn('Redis deleteSession failed:', error);
  }
};
