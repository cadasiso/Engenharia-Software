import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

export const prisma = new PrismaClient();

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
