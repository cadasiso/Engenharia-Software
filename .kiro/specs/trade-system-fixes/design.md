# Design Document

## Overview

This design addresses three critical issues in the Bookswap trade system:
1. Counter-proposal functionality that doesn't properly fetch or display the other user's books
2. Trade completion that doesn't actually transfer books between users
3. Room book assignment that incorrectly allows wishlist books

The solution involves fixing the TradesPage counter-proposal modal, implementing atomic book transfer logic in the backend, and adding proper filtering for room book assignments.

## Architecture

### Component Updates

```
Backend
├── routes/trades.ts (updated)
│   ├── POST /:id/accept (add book transfer logic)
│   └── POST /:id/counter (fix book fetching)
├── routes/books.ts (updated)
│   └── Add book transfer service functions
└── services/bookTransfer.ts (new)
    ├── transferBooks()
    ├── validateBookOwnership()
    └── createAuditLog()

Frontend
├── pages/TradesPage.tsx (updated)
│   ├── Fix counter-proposal modal book fetching
│   └── Display current trade state
└── pages/RoomDetailPage.tsx (updated)
    └── Filter to inventory books only
```

## Components and Interfaces

### Book Transfer Service

```typescript
interface BookTransferRequest {
  tradeId: string;
  offeredBooks: string[]; // Book IDs from proposer
  requestedBooks: string[]; // Book IDs from recipient
  proposerId: string;
  recipientId: string;
}

interface BookTransferResult {
  success: boolean;
  transferredBooks: {
    toProposer: Book[];
    toRecipient: Book[];
  };
  auditLogIds: string[];
  error?: string;
}

interface BookAuditLog {
  id: string;
  bookId: string;
  fromUserId: string;
  toUserId: string;
  tradeId: string;
  timestamp: Date;
  action: 'transfer';
}
```

### Updated Trade Interfaces

```typescript
interface TradeWithBooks {
  id: string;
  status: string;
  proposerId: string;
  participant1: User;
  participant2: User;
  booksOffered: string[];
  booksRequested: string[];
  offeredBooksDetails: Book[]; // Populated book objects
  requestedBooksDetails: Book[]; // Populated book objects
  createdAt: string;
  updatedAt: string;
}

interface CounterProposalData {
  currentTrade: TradeWithBooks;
  userBooks: Book[]; // Current user's inventory
  otherUserBooks: Book[]; // Other user's inventory
}
```

## Data Models

### New: BookAuditLog Table

```prisma
model BookAuditLog {
  id          String   @id @default(uuid())
  bookId      String
  fromUserId  String
  toUserId    String
  tradeId     String
  action      String   // 'transfer', 'assign_room', 'remove_room'
  metadata    Json?    // Additional context
  createdAt   DateTime @default(now())

  book        Book     @relation(fields: [bookId], references: [id])
  fromUser    User     @relation("AuditLogsFrom", fields: [fromUserId], references: [id])
  toUser      User     @relation("AuditLogsTo", fields: [toUserId], references: [id])
  trade       Trade    @relation(fields: [tradeId], references: [id])

  @@index([bookId])
  @@index([tradeId])
  @@index([fromUserId])
  @@index([toUserId])
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Counter-proposal book visibility
*For any* trade proposal, when a user opens the counter-proposal modal, all inventory books from both users should be fetched and displayed
**Validates: Requirements 1.3, 1.4**

### Property 2: Trade book transfer completeness
*For any* accepted trade, all offered books should be transferred to the recipient AND all requested books should be transferred to the proposer
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Trade transfer atomicity
*For any* trade acceptance attempt, either all books are transferred successfully or no books are transferred (rollback on failure)
**Validates: Requirements 4.1, 4.2, 4.5**

### Property 4: Book ownership update
*For any* completed trade, the userId field of all traded books should be updated to reflect new ownership
**Validates: Requirements 3.3, 3.4, 3.5**

### Property 5: Book availability after trade
*For any* completed trade, all transferred books should be marked as available (isAvailable = true) under their new owners
**Validates: Requirements 3.6, 7.4**

### Property 6: Lock release on trade completion
*For any* completed trade, all book locks associated with that trade should be released
**Validates: Requirements 3.7, 7.3**

### Property 7: Room assignment inventory filter
*For any* user viewing books available for room assignment, only inventory books (listType = 'inventory') should be displayed
**Validates: Requirements 5.1, 5.2, 10.1**

### Property 8: Wishlist book assignment rejection
*For any* attempt to assign a wishlist book to a room, the system should reject the operation with an error
**Validates: Requirements 5.3**

### Property 9: Counter-proposal proposer swap
*For any* counter-proposal, the proposerId should be updated to the user who created the counter-proposal
**Validates: Requirements 8.3**

### Property 10: Counter-proposal lock management
*For any* counter-proposal, old book locks should be released AND new locks should be created for the newly requested books
**Validates: Requirements 8.4, 8.5**

### Property 11: Trade audit log creation
*For any* completed trade, an audit log entry should be created for each transferred book
**Validates: Requirements 6.1**

### Property 12: Book unavailability during pending trades
*For any* book included in a pending trade, the book should be marked as unavailable or locked
**Validates: Requirements 7.1, 7.2**

## Error Handling

### Trade Completion Errors

- **Book Not Found**: If any book in the trade no longer exists, reject the trade and notify users
- **Ownership Mismatch**: If book ownership has changed since proposal, reject and notify
- **Database Transaction Failure**: Roll back all changes and keep trade in pending status
- **Lock Conflict**: If books are locked by another trade, reject and notify

### Counter-Proposal Errors

- **Book Fetch Failure**: Show error modal and allow retry
- **Invalid Book Selection**: Validate on client and server, show specific error messages
- **Lock Creation Failure**: Roll back counter-proposal and notify user

### Room Assignment Errors

- **Wishlist Book Assignment**: Reject with clear error message
- **Book Already Assigned**: Show which room the book is assigned to
- **Book In Active Trade**: Explain the book is locked and cannot be assigned

## Testing Strategy

### Unit Tests

- Book transfer service with various book combinations
- Counter-proposal modal book fetching logic
- Room assignment filtering logic
- Audit log creation
- Lock management during counter-proposals

### Integration Tests

- Complete trade flow from proposal to completion with book transfers
- Counter-proposal flow with lock management
- Room assignment with inventory/wishlist filtering
- Trade rollback on failure scenarios

### Property-Based Tests

Using the testing framework specified in the codebase (likely Vitest with fast-check or similar):

- Property 1: Test with random trades and verify all books are fetched
- Property 2: Test with random book sets and verify complete transfer
- Property 3: Test with simulated failures and verify rollback
- Property 4: Test with random trades and verify ownership updates
- Property 5: Test with random trades and verify availability flags
- Property 6: Test with random trades and verify lock release
- Property 7: Test with random book collections and verify inventory filtering
- Property 8: Test with wishlist books and verify rejection
- Property 9: Test with random counter-proposals and verify proposer swap
- Property 10: Test with random counter-proposals and verify lock management
- Property 11: Test with random trades and verify audit log entries
- Property 12: Test with pending trades and verify book unavailability

## Implementation Notes

### Book Transfer Implementation

The book transfer must be atomic using database transactions:

```typescript
async function transferBooks(request: BookTransferRequest): Promise<BookTransferResult> {
  return await prisma.$transaction(async (tx) => {
    // 1. Validate all books exist and ownership is correct
    // 2. Update userId for offered books
    // 3. Update userId for requested books
    // 4. Mark all books as available
    // 5. Create audit log entries
    // 6. Update trade status to completed
    // 7. Release all locks
    
    // If any step fails, entire transaction rolls back
  });
}
```

### Counter-Proposal Modal Fix

The modal needs to fetch books from the OTHER user, not just show the current trade's books:

```typescript
const openCounterModal = async (trade: Trade) => {
  setSelectedTrade(trade);
  
  // Fetch OTHER user's inventory books
  const otherUserId = getOtherUser(trade).id;
  const otherUserBooksRes = await api.get(`/users/${otherUserId}/inventory`);
  setOtherUserBooks(otherUserBooksRes.data);
  
  // Fetch current user's inventory books
  const myBooksRes = await api.get('/books?listType=inventory&isAvailable=true');
  setAvailableBooks(myBooksRes.data);
  
  // Pre-populate current trade state for reference
  setCurrentOffered(trade.booksOffered);
  setCurrentRequested(trade.booksRequested);
  
  setShowCounterModal(true);
};
```

### Room Assignment Filter

Filter books before displaying in the room assignment UI:

```typescript
const myBooksForRoom = myBooks.filter(book => 
  book.listType === 'inventory' && 
  !book.roomId && 
  book.isAvailable
);
```

## Performance Considerations

- Batch book fetching to reduce API calls
- Cache user inventory books for counter-proposals
- Use database indexes on userId, listType, and isAvailable
- Implement optimistic UI updates for better UX
- Use database transactions for atomic operations

## Security Considerations

- Validate book ownership before any transfer
- Verify user is participant in trade before allowing actions
- Prevent race conditions with proper locking
- Validate all book IDs exist and are accessible
- Audit all book transfers for accountability
- Rate limit trade operations to prevent abuse

## Migration Strategy

### Database Migration

1. Add BookAuditLog table
2. Add indexes for performance
3. Backfill audit logs for existing completed trades (optional)

### Code Deployment

1. Deploy backend changes first (book transfer service)
2. Deploy frontend changes (counter-proposal modal fix)
3. Monitor for errors and rollback if needed
4. Verify trades complete successfully with book transfers

### Rollback Plan

If issues arise:
1. Revert frontend to previous version
2. Revert backend to previous version
3. Investigate and fix issues
4. Redeploy with fixes

## Future Enhancements

- Add book condition verification before trade completion
- Implement dispute resolution system
- Add trade cancellation with mutual consent
- Support partial trade completion (some books transferred)
- Add trade templates for common exchanges
- Implement trade recommendations based on history
