# Design Document

## Overview

This design implements a request-based chat system for partial matches and a flexible trade proposal system that accommodates asymmetric book exchanges. The system distinguishes between privileged users (who have desired books) and non-privileged users (who want books but have nothing the other wants).

## Architecture

### High-Level Flow

```
Non-Privileged User → Chat Request → Notification → Privileged User
                                                    ↓
                                              Accept/Reject
                                                    ↓
                                              Chat Created
```

### Components

1. **ChatRequest Model** - New database table for managing chat requests
2. **ChatRequestService** - Business logic for request management
3. **NotificationService** - Enhanced to handle chat request notifications
4. **TradeProposalUI** - New component for flexible book selection
5. **LoadingButton** - Reusable button component with loading states

## Data Models

### ChatRequest

```typescript
model ChatRequest {
  id              String   @id @default(uuid())
  requesterId     String   // User sending the request
  recipientId     String   // User receiving the request
  matchId         String   // Associated match
  status          String   @default("pending") // pending, accepted, rejected
  message         String?  // Optional message from requester
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  requester       User     @relation("ChatRequestsSent", fields: [requesterId], references: [id], onDelete: Cascade)
  recipient       User     @relation("ChatRequestsReceived", fields: [recipientId], references: [id], onDelete: Cascade)

  @@unique([requesterId, recipientId])
  @@index([recipientId, status])
  @@index([requesterId, status])
}
```

### Updated User Model

```typescript
model User {
  // ... existing fields
  chatRequestsSent     ChatRequest[] @relation("ChatRequestsSent")
  chatRequestsReceived ChatRequest[] @relation("ChatRequestsReceived")
}
```

### Updated Notification Model

```typescript
// Add new notification types:
// - 'chat_request_received'
// - 'chat_request_accepted'
// - 'chat_request_rejected'
// - 'chat_initiated'
```

## Components and Interfaces

### Backend API Endpoints

#### Chat Requests

```
POST   /api/chat-requests              - Create chat request
GET    /api/chat-requests              - Get user's chat requests (sent and received)
POST   /api/chat-requests/:id/accept   - Accept a chat request
POST   /api/chat-requests/:id/reject   - Reject a chat request
DELETE /api/chat-requests/:id          - Cancel a chat request
```

#### Enhanced Chat Endpoints

```
POST   /api/chats                      - Create chat (updated logic for partial matches)
GET    /api/chats/status/:userId       - Check chat status (updated for requests)
```

#### Enhanced Trade Endpoints

```
POST   /api/trades                     - Create trade (flexible book selection)
POST   /api/trades/:id/counter         - Counter-propose (updated for partial matches)
```

### Frontend Components

#### ChatRequestButton

```typescript
interface ChatRequestButtonProps {
  matchType: 'perfect' | 'partial_type1' | 'partial_type2';
  matchedUserId: string;
  existingRequestStatus?: 'pending' | 'accepted' | 'rejected';
  onRequestSent: () => void;
}
```

#### TradeProposalModal

```typescript
interface TradeProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  userBooks: Book[];
  matchedUserBooks: Book[];
  onSubmit: (offeredBookIds: string[], requestedBookIds: string[]) => Promise<void>;
}
```

#### LoadingButton

```typescript
interface LoadingButtonProps {
  onClick: () => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
}
```

#### NotificationBadge

```typescript
interface NotificationBadgeProps {
  count: number;
  onClick: () => void;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Chat request uniqueness
*For any* pair of users, there should be at most one pending chat request from user A to user B at any time
**Validates: Requirements 1.6**

### Property 2: Chat request state transitions
*For any* chat request, the status should only transition from pending → accepted OR pending → rejected, never backwards
**Validates: Requirements 1.4, 1.5**

### Property 3: Privileged user direct access
*For any* partial_type2 match, the privileged user should be able to create a chat without a request
**Validates: Requirements 2.1**

### Property 4: Non-privileged user request requirement
*For any* partial_type1 match, attempting to create a chat should create a chat request instead
**Validates: Requirements 1.1**

### Property 5: Perfect match mutual agreement
*For any* perfect match, a chat should only be created when both users have initiated
**Validates: Requirements 3.2**

### Property 6: Trade proposal book selection
*For any* trade proposal, both offeredBookIds and requestedBookIds arrays should be non-empty
**Validates: Requirements 4.2, 8.4**

### Property 7: Book lock consistency
*For any* trade proposal, all books in requestedBookIds should have corresponding active locks
**Validates: Requirements 4.3**

### Property 8: Counter-proposal lock release
*For any* counter-proposal, old locks should be released before new locks are created
**Validates: Requirements 5.3**

### Property 9: Loading state consistency
*For any* button with loading state, it should be disabled while loading is true
**Validates: Requirements 6.2**

### Property 10: Notification creation
*For any* chat request creation, a notification should be created for the recipient
**Validates: Requirements 1.2, 7.1**

## Error Handling

### Chat Request Errors

- **Duplicate Request**: Return 409 Conflict if pending request already exists
- **Invalid Match**: Return 404 if match doesn't exist or is hidden
- **Self Request**: Return 400 if user tries to request chat with themselves
- **Already Chatting**: Return 400 if chat already exists between users

### Trade Proposal Errors

- **No Books Selected**: Return 400 with specific message about which selection is missing
- **Invalid Book Ownership**: Return 403 if user tries to offer books they don't own
- **Book Already Locked**: Return 409 with lock expiration time
- **Insufficient Permissions**: Return 403 for partial match trade restrictions

### Loading State Errors

- **Timeout**: Show error modal after 30 seconds of loading
- **Network Error**: Show retry option in error modal
- **Validation Error**: Show specific field errors inline

## Testing Strategy

### Unit Tests

- ChatRequest model CRUD operations
- Chat initiation logic for each match type
- Trade proposal validation logic
- Loading button state management
- Notification creation for each event type

### Property-Based Tests

- Property 1: Test with random user pairs, verify no duplicate pending requests
- Property 2: Test state transitions with random sequences, verify no invalid transitions
- Property 3: Test with random partial_type2 matches, verify direct chat creation
- Property 4: Test with random partial_type1 matches, verify request creation
- Property 5: Test with random perfect matches, verify mutual agreement requirement
- Property 6: Test with random book selections, verify non-empty arrays
- Property 7: Test with random trade proposals, verify lock existence
- Property 8: Test with random counter-proposals, verify lock cleanup
- Property 9: Test with random button interactions, verify disabled state during loading
- Property 10: Test with random chat requests, verify notification creation

### Integration Tests

- End-to-end chat request flow (create → notify → accept → chat)
- End-to-end trade proposal flow (propose → lock → accept → complete)
- Notification system integration
- Loading states across multiple concurrent operations

## Implementation Notes

### Database Migration

1. Create ChatRequest table
2. Add relations to User model
3. Add new notification types
4. Create indexes for performance

### Backward Compatibility

- Existing chats remain unchanged
- Existing perfect match behavior preserved
- Existing trade proposals continue to work
- Gradual rollout: chat requests first, then trade improvements

### Performance Considerations

- Index on (recipientId, status) for fast pending request queries
- Cache notification counts in Redis
- Debounce loading button clicks
- Lazy load book lists in trade proposal modal

### Security Considerations

- Validate user owns books before creating trade proposals
- Prevent chat request spam (rate limiting)
- Verify match exists before allowing chat request
- Sanitize optional message in chat requests
