import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User Property Tests', () => {
  beforeEach(async () => {
    // Clean up users before each test
    await prisma.user.deleteMany();
  });

  /**
   * Feature: bookswap, Property 1: Account creation with valid data
   * Validates: Requirements 1.1
   */
  it('Property 1: Account creation with valid data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          location: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (userData) => {
          // Create user with valid data
          const user = await prisma.user.create({
            data: {
              name: userData.name,
              email: userData.email,
              passwordHash: userData.password, // In real app, this would be hashed
              location: userData.location,
            },
          });

          // Verify the user was created with correct fields
          expect(user.id).toBeDefined();
          expect(user.name).toBe(userData.name);
          expect(user.email).toBe(userData.email);
          expect(user.passwordHash).toBe(userData.password);
          expect(user.location).toBe(userData.location);
          expect(user.createdAt).toBeInstanceOf(Date);
          expect(user.updatedAt).toBeInstanceOf(Date);

          // Clean up
          await prisma.user.delete({ where: { id: user.id } });
        }
      ),
      { numRuns: 100 }
    );
  });
});
