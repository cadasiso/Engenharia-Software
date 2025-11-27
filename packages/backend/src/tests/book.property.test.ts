import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Book Property Tests', () => {
  let testUser: { id: string };

  beforeEach(async () => {
    // Clean up books and users
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user for book operations
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashedpassword',
        location: 'Test Location',
      },
    });
  });

  afterAll(async () => {
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  /**
   * Feature: bookswap, Property 2: Book inventory storage
   * Validates: Requirements 1.2
   */
  it('Property 2: Book inventory storage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          author: fc.string({ minLength: 1, maxLength: 100 }),
          isbn: fc.option(fc.string({ minLength: 10, maxLength: 13 }), { nil: undefined }),
          condition: fc.constantFrom('new', 'nearly_new', 'used', 'very_used'),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        }),
        async (bookData) => {
          // Add book to inventory
          const book = await prisma.book.create({
            data: {
              userId: testUser.id,
              title: bookData.title,
              author: bookData.author,
              isbn: bookData.isbn,
              condition: bookData.condition,
              description: bookData.description,
              photoUrls: [],
              isAvailable: true,
              listType: 'inventory',
            },
          });

          // Verify the book was stored correctly
          expect(book.id).toBeDefined();
          expect(book.userId).toBe(testUser.id);
          expect(book.listType).toBe('inventory');
          expect(book.isAvailable).toBe(true);
          expect(book.title).toBe(bookData.title);
          expect(book.author).toBe(bookData.author);
          // Prisma converts undefined to null in the database
          expect(book.isbn).toBe(bookData.isbn ?? null);
          expect(book.condition).toBe(bookData.condition);
          expect(book.description).toBe(bookData.description ?? null);

          // Clean up
          await prisma.book.delete({ where: { id: book.id } });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: bookswap, Property 3: Wishlist storage
   * Validates: Requirements 1.3
   */
  it('Property 3: Wishlist storage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          author: fc.string({ minLength: 1, maxLength: 100 }),
          isbn: fc.option(fc.string({ minLength: 10, maxLength: 13 }), { nil: undefined }),
        }),
        async (bookData) => {
          // Add book to wishlist
          const book = await prisma.book.create({
            data: {
              userId: testUser.id,
              title: bookData.title,
              author: bookData.author,
              isbn: bookData.isbn,
              condition: 'new', // Condition is required but not relevant for wishlist
              photoUrls: [],
              isAvailable: true,
              listType: 'wishlist',
            },
          });

          // Verify the book was stored correctly
          expect(book.id).toBeDefined();
          expect(book.userId).toBe(testUser.id);
          expect(book.listType).toBe('wishlist');
          expect(book.title).toBe(bookData.title);
          expect(book.author).toBe(bookData.author);
          // Prisma converts undefined to null in the database
          expect(book.isbn).toBe(bookData.isbn ?? null);

          // Clean up
          await prisma.book.delete({ where: { id: book.id } });
        }
      ),
      { numRuns: 100 }
    );
  });
});
