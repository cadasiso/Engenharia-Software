import { PrismaClient } from '@prisma/client';
import { afterAll } from 'vitest';
import dotenv from 'dotenv';

dotenv.config();

export const prisma = new PrismaClient();

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
