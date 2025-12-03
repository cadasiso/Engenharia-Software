import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MatchingBook {
  userBookId?: string;
  matchedUserBookId?: string;
  bookTitle: string;
  bookAuthor: string;
}

// Helper to extract roomId from book description
const getRoomId = (book: any): string | null => {
  try {
    const desc = JSON.parse(book.description || '{}');
    return desc.roomId || null;
  } catch {
    return null;
  }
};

// Helper to check if two books are in the same scope (both global or same room)
const inSameScope = (book1: any, book2: any): boolean => {
  const room1 = getRoomId(book1);
  const room2 = getRoomId(book2);
  
  // Both global
  if (!room1 && !room2) return true;
  
  // Same room
  if (room1 && room2 && room1 === room2) return true;
  
  return false;
};

export const calculateMatches = async (userId: string) => {
  // Get user's location
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  // Get user's inventory and wishlist
  const userInventory = await prisma.book.findMany({
    where: { userId, listType: 'inventory', isAvailable: true },
  });

  const userWishlist = await prisma.book.findMany({
    where: { userId, listType: 'wishlist' },
  });

  // Get other users in the same location who have both inventory and wishlist books
  const otherUsers = await prisma.user.findMany({
    where: {
      location: user.location,
      id: { not: userId },
    },
    include: {
      books: {
        select: {
          listType: true,
        },
      },
    },
  });

  // Filter users who have at least one inventory AND one wishlist book
  const eligibleUsers = otherUsers.filter((u) => {
    const hasInventory = u.books.some((b) => b.listType === 'inventory');
    const hasWishlist = u.books.some((b) => b.listType === 'wishlist');
    return hasInventory && hasWishlist;
  });

  // Clear existing matches for this user (both directions)
  await prisma.match.deleteMany({ where: { userId } });
  await prisma.match.deleteMany({ where: { matchedUserId: userId } });

  // Calculate matches for each eligible user
  for (const otherUser of eligibleUsers) {
    const otherInventory = await prisma.book.findMany({
      where: { userId: otherUser.id, listType: 'inventory', isAvailable: true },
    });

    const otherWishlist = await prisma.book.findMany({
      where: { userId: otherUser.id, listType: 'wishlist' },
    });

    const matchingBooks: MatchingBook[] = [];
    let matchType: 'perfect' | 'partial_type1' | 'partial_type2' | null = null;

    // Check if other user has books I want (respecting room boundaries)
    const booksIWant = otherInventory.filter((otherBook) =>
      userWishlist.some(
        (myWish) =>
          inSameScope(otherBook, myWish) &&
          ((myWish.isbn && otherBook.isbn && myWish.isbn === otherBook.isbn) ||
          (myWish.title.toLowerCase() === otherBook.title.toLowerCase() &&
            myWish.author.toLowerCase() === otherBook.author.toLowerCase()))
      )
    );

    // Check if I have books other user wants (respecting room boundaries)
    const booksTheyWant = userInventory.filter((myBook) =>
      otherWishlist.some(
        (theirWish) =>
          inSameScope(myBook, theirWish) &&
          ((theirWish.isbn && myBook.isbn && theirWish.isbn === myBook.isbn) ||
          (theirWish.title.toLowerCase() === myBook.title.toLowerCase() &&
            theirWish.author.toLowerCase() === myBook.author.toLowerCase()))
      )
    );

    // Determine match type
    if (booksIWant.length > 0 && booksTheyWant.length > 0) {
      matchType = 'perfect';
      // Add books from both directions
      booksIWant.forEach((book) => {
        matchingBooks.push({
          matchedUserBookId: book.id,
          bookTitle: book.title,
          bookAuthor: book.author,
        });
      });
      booksTheyWant.forEach((book) => {
        matchingBooks.push({
          userBookId: book.id,
          bookTitle: book.title,
          bookAuthor: book.author,
        });
      });
    } else if (booksIWant.length > 0) {
      matchType = 'partial_type1';
      booksIWant.forEach((book) => {
        matchingBooks.push({
          matchedUserBookId: book.id,
          bookTitle: book.title,
          bookAuthor: book.author,
        });
      });
    } else if (booksTheyWant.length > 0) {
      matchType = 'partial_type2';
      booksTheyWant.forEach((book) => {
        matchingBooks.push({
          userBookId: book.id,
          bookTitle: book.title,
          bookAuthor: book.author,
        });
      });
    }

    // Create match if there are matching books
    if (matchType && matchingBooks.length > 0) {
      // Create match for current user
      await prisma.match.create({
        data: {
          userId,
          matchedUserId: otherUser.id,
          matchType,
          matchingBooks: matchingBooks as any,
          isHidden: false,
        },
      });

      // Create reciprocal match for the other user
      // Swap the match type for reciprocal perspective
      let reciprocalMatchType = matchType;
      if (matchType === 'partial_type1') {
        // Current user wants books from other user
        // From other user's perspective: they have books current user wants
        reciprocalMatchType = 'partial_type2';
      } else if (matchType === 'partial_type2') {
        // Current user has books other user wants
        // From other user's perspective: they want books from current user
        reciprocalMatchType = 'partial_type1';
      }

      // Check if reciprocal match already exists
      const existingReciprocal = await prisma.match.findFirst({
        where: {
          userId: otherUser.id,
          matchedUserId: userId,
        },
      });

      if (!existingReciprocal) {
        await prisma.match.create({
          data: {
            userId: otherUser.id,
            matchedUserId: userId,
            matchType: reciprocalMatchType,
            matchingBooks: matchingBooks as any,
            isHidden: false,
          },
        });
      }
    }
  }
};

export const getMatches = async (userId: string) => {
  const matches = await prisma.match.findMany({
    where: { userId, isHidden: false },
    include: {
      matchedUser: {
        select: {
          id: true,
          name: true,
          email: true,
          location: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return matches;
};
