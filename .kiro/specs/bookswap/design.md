# Design Document

## Overview

Bookswap is a full-stack web application built with React (frontend) and Node.js/TypeScript (backend). The system uses a RESTful API architecture with real-time capabilities for chat and notifications via WebSockets. The matching engine runs as a background service that periodically calculates matches based on user inventories and wish lists within the same geographic location.

The application follows a three-tier architecture:
- **Presentation Layer**: React SPA with React Router for navigation, Context API for state management, and Socket.io client for real-time features
- **Application Layer**: Express.js REST API with JWT authentication, business logic services, and Socket.io server for WebSocket connections
- **Data Layer**: PostgreSQL for relational data (users, books, matches, trades) and Redis for session management and caching

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (SPA)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │ Profile  │  │ Matching │  │   Chat   │   │
│  │  Pages   │  │  Pages   │  │  Pages   │  │  Pages   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                          │                                    │
│                    React Router                               │
│                          │                                    │
│              ┌───────────┴───────────┐                       │
│              │                       │                       │
│         HTTP/REST              WebSocket                     │
└──────────────┼───────────────────────┼──────────────────────┘
               │                       │
┌──────────────┼───────────────────────┼──────────────────────┐
│              │                       │                       │
│         ┌────▼─────┐          ┌─────▼──────┐               │
│         │ Express  │          │ Socket.io  │               │
│         │   API    │          │   Server   │               │
│         └────┬─────┘          └─────┬──────┘               │
│              │                      │                       │
│    ┌─────────┴──────────────────────┴─────────┐            │
│    │         Business Logic Layer              │            │
│    │  ┌──────────┐  ┌──────────┐  ┌─────────┐│            │
│    │  │  Auth    │  │ Matching │  │  Trade  ││            │
│    │  │ Service  │  │  Engine  │  │ Service ││            │
│    │  └──────────┘  └──────────┘  └─────────┘│            │
│    └───────────────────┬───────────────────────┘            │
│                        │                                    │
│              Node.js/TypeScript Backend                     │
└────────────────────────┼──────────────────────────────────┘
                         │
┌────────────────────────┼──────────────────────────────────┐
│                        │                                    │
│         ┌──────────────▼──────────────┐                    │
│         │      PostgreSQL Database     │                    │
│         │  ┌────────┐  ┌────────┐     │                    │
│         │  │ Users  │  │ Books  │     │                    │
│         │  │ Rooms  │  │ Trades │     │                    │
│         │  └────────┘  └────────┘     │                    │
│         └──────────────┬──────────────┘                    │
│                        │                                    │
│         ┌──────────────▼──────────────┐                    │
│         │      Redis Cache/Sessions    │                    │
│         └─────────────────────────────┘                    │
│                                                             │
│                    Data Layer                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- React Router v6 for routing
- React Context API + useReducer for state management
- Axios for HTTP requests
- Socket.io-client for WebSocket connections
- React Hook Form for form handling
- TailwindCSS for styling

**Backend:**
- Node.js 18+ with TypeScript
- Express.js for REST API
- Socket.io for WebSocket server
- JWT for authentication
- bcrypt for password hashing
- Multer for file uploads
- node-cron for scheduled matching jobs

**Database:**
- PostgreSQL 14+ for primary data storage
- Redis for session management and caching
- Prisma ORM for database access

**External APIs:**
- Google Books API for book metadata and autocomplete

## Components and Interfaces

### Frontend Components

#### Authentication Components
- `LoginPage`: User login form
- `RegisterPage`: User registration form with location selection
- `PasswordResetPage`: Password reset request and confirmation

#### Profile Components
- `ProfilePage`: View and edit user profile (name, bio, picture, socials)
- `ProfilePictureUpload`: Component for uploading profile images
- `BookInventoryList`: Display user's available books
- `WishListDisplay`: Display user's wanted books
- `AddBookForm`: Form to add books via ISBN or title search with autocomplete

#### Matching Components
- `MatchesDashboard`: Main view showing perfect and partial matches
- `MatchCard`: Individual match display with user info and matching books
- `MatchFilters`: Filter and sort controls for matches
- `BookMatchesView`: View all matches for a specific book

#### Chat Components
- `ChatList`: List of active conversations
- `ChatWindow`: Individual chat conversation view
- `MessageInput`: Text input for sending messages
- `MeetingProposalForm`: Form to create/edit meeting proposals
- `MeetingProposalCard`: Display meeting proposal with accept/reject actions

#### Room Components
- `RoomsList`: Display available public and private rooms
- `RoomView`: View room details and members
- `PrivateRoomAdmin`: Admin interface for managing private room access

#### Trade Components
- `TradeConfirmation`: Interface to confirm trade completion
- `RatingForm`: Form to rate exchange experience
- `ReportForm`: Form to report problematic users

#### Shared Components
- `NotificationBell`: Notification icon with unread count
- `NotificationList`: Dropdown list of notifications
- `BookCard`: Reusable book display component
- `UserAvatar`: User profile picture with fallback

### Backend API Endpoints

#### Authentication Endpoints
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout user
POST   /api/auth/password-reset    - Request password reset
PUT    /api/auth/password-reset    - Confirm password reset
```

#### User Profile Endpoints
```
GET    /api/users/:id              - Get user profile
PUT    /api/users/:id              - Update user profile
POST   /api/users/:id/picture      - Upload profile picture
GET    /api/users/:id/ratings      - Get user ratings
```

#### Book Endpoints
```
GET    /api/books/search           - Search books via Google Books API
POST   /api/books/inventory        - Add book to inventory
DELETE /api/books/inventory/:id    - Remove book from inventory
PATCH  /api/books/inventory/:id    - Update book availability
POST   /api/books/wishlist         - Add book to wishlist
DELETE /api/books/wishlist/:id     - Remove book from wishlist
POST   /api/books/:id/photos       - Upload book photos
```

#### Matching Endpoints
```
GET    /api/matches                - Get user's matches (with filters/sorting)
GET    /api/matches/book/:bookId   - Get matches for specific book
DELETE /api/matches/:matchId       - Remove individual match
DELETE /api/matches                - Remove all matches
POST   /api/matches/refresh        - Manually trigger match recalculation
```

#### Chat Endpoints
```
GET    /api/chats                  - Get user's chat conversations
GET    /api/chats/:id              - Get chat messages
POST   /api/chats                  - Create new chat from match
POST   /api/chats/:id/messages     - Send message (also via WebSocket)
```

#### Meeting Proposal Endpoints
```
POST   /api/proposals              - Create meeting proposal
PUT    /api/proposals/:id          - Update meeting proposal
POST   /api/proposals/:id/accept   - Accept proposal
POST   /api/proposals/:id/reject   - Reject proposal
```

#### Room Endpoints
```
GET    /api/rooms                  - Get available rooms for user's location
GET    /api/rooms/:id              - Get room details
POST   /api/rooms                  - Create private room (admin)
POST   /api/rooms/:id/join         - Request to join private room
POST   /api/rooms/:id/approve      - Approve join request (admin)
POST   /api/rooms/:id/deny         - Deny join request (admin)
DELETE /api/rooms/:id/members/:uid - Remove member (admin)
```

#### Trade Endpoints
```
POST   /api/trades                 - Initiate trade
POST   /api/trades/:id/confirm     - Confirm trade completion
POST   /api/trades/:id/rate        - Rate trade experience
POST   /api/trades/:id/report      - Report user
```

#### Notification Endpoints
```
GET    /api/notifications          - Get user notifications
PATCH  /api/notifications/:id/read - Mark notification as read
PATCH  /api/notifications/read-all - Mark all notifications as read
```

### WebSocket Events

#### Client → Server
```
join_chat         - Join chat room
send_message      - Send chat message
typing            - User is typing indicator
```

#### Server → Client
```
new_message       - New chat message received
new_match         - New match generated
new_notification  - New notification created
proposal_update   - Meeting proposal status changed
```

## Data Models

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  location: string;
  biography?: string;
  profilePictureUrl?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Book
```typescript
interface Book {
  id: string;
  userId: string;
  isbn?: string;
  title: string;
  author: string;
  condition: 'new' | 'nearly_new' | 'used' | 'very_used';
  description?: string;
  photoUrls: string[];
  isAvailable: boolean;
  listType: 'inventory' | 'wishlist';
  createdAt: Date;
  updatedAt: Date;
}
```

### Match
```typescript
interface Match {
  id: string;
  userId: string;              // The user who sees this match
  matchedUserId: string;       // The matched user
  matchType: 'perfect' | 'partial_type1' | 'partial_type2';
  matchingBooks: {
    userBookId?: string;       // Book from user's inventory
    matchedUserBookId?: string; // Book from matched user's inventory
  }[];
  isHidden: boolean;           // User removed this match
  createdAt: Date;
}
```

### Chat
```typescript
interface Chat {
  id: string;
  participants: [string, string]; // Two user IDs
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}
```

### MeetingProposal
```typescript
interface MeetingProposal {
  id: string;
  chatId: string;
  proposerId: string;
  place: string;
  dateTime: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'confirmed';
  createdAt: Date;
  updatedAt: Date;
}
```

### Room
```typescript
interface Room {
  id: string;
  name: string;
  location: string;
  type: 'location' | 'public_genre' | 'private';
  genre?: string;              // For public genre rooms
  adminIds: string[];          // For private rooms
  createdAt: Date;
}

interface RoomMembership {
  id: string;
  roomId: string;
  userId: string;
  status: 'member' | 'pending' | 'denied';
  joinedAt: Date;
}
```

### Trade
```typescript
interface Trade {
  id: string;
  participants: [string, string]; // Two user IDs
  books: {
    fromUserId: string;
    toUserId: string;
    bookId: string;
  }[];
  meetingProposalId: string;
  status: 'proposed' | 'confirmed' | 'completed';
  completedAt?: Date;
  createdAt: Date;
}

interface Rating {
  id: string;
  tradeId: string;
  fromUserId: string;
  toUserId: string;
  score: number;              // 1-5
  comment?: string;
  createdAt: Date;
}

interface Report {
  id: string;
  tradeId: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}
```

### Notification
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'new_match' | 'new_message' | 'meeting_proposal' | 'trade_update';
  title: string;
  message: string;
  relatedEntityId?: string;   // ID of match, chat, proposal, etc.
  isRead: boolean;
  createdAt: Date;
}
```

## Database Schema

### Key Relationships
- User → Books (one-to-many)
- User → Matches (one-to-many, as both userId and matchedUserId)
- User → Chats (many-to-many through participants)
- Chat → Messages (one-to-many)
- Chat → MeetingProposals (one-to-many)
- Room → RoomMemberships (one-to-many)
- User → RoomMemberships (one-to-many)
- Trade → Ratings (one-to-many)
- User → Notifications (one-to-many)

### Indexes
- `books.userId` - Fast lookup of user's books
- `books.isbn` - Fast matching by ISBN
- `books.listType` - Filter by inventory vs wishlist
- `matches.userId` - Fast lookup of user's matches
- `matches.matchedUserId` - Bidirectional match queries
- `matches.createdAt` - Sort matches by date
- `chat.participants` - Fast lookup of chats by user
- `messages.chatId` - Fast message retrieval
- `notifications.userId, notifications.isRead` - Unread notifications query
- `roomMemberships.userId` - User's rooms
- `roomMemberships.roomId` - Room's members


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### User Registration and Profile Properties

**Property 1: Account creation with valid data**
*For any* valid user data (name, password, location), creating an account should result in a user record with those exact fields stored correctly.
**Validates: Requirements 1.1**

**Property 2: Book inventory storage**
*For any* valid book data, adding it to a user's inventory should store the book with listType='inventory' and isAvailable=true.
**Validates: Requirements 1.2**

**Property 3: Wishlist storage**
*For any* valid book data, adding it to a user's wishlist should store the book with listType='wishlist'.
**Validates: Requirements 1.3**

**Property 4: Profile update persistence**
*For any* user and any valid profile update, applying the update should result in the new values being retrievable immediately.
**Validates: Requirements 1.4**

**Property 5: Required field validation**
*For any* registration attempt missing name, password, or location, the system should reject the registration.
**Validates: Requirements 1.5**

**Property 6: Profile picture round-trip**
*For any* valid image file, uploading it as a profile picture should make it retrievable at the stored URL.
**Validates: Requirements 2.1**

**Property 7: Biography persistence**
*For any* biography text, adding it to a profile should make it retrievable when viewing that profile.
**Validates: Requirements 2.2**

**Property 8: Social links storage**
*For any* set of social media links, adding them to a profile should store all provided links correctly.
**Validates: Requirements 2.3**

### Book Management Properties

**Property 9: Book photo upload**
*For any* book and any valid image files, uploading photos should associate them with that book.
**Validates: Requirements 3.1**

**Property 10: Book condition requirement**
*For any* book addition attempt without a condition specified, the system should reject the addition.
**Validates: Requirements 3.2**

**Property 11: Book description storage**
*For any* book description text, adding it should make it retrievable when viewing that book.
**Validates: Requirements 3.3**

**Property 12: Book data completeness**
*For any* book with photos, condition, and description, retrieving that book should return all three fields.
**Validates: Requirements 3.4**

**Property 13: ISBN-based matching**
*For any* two books with the same ISBN but different titles, the matching system should treat them as identical books.
**Validates: Requirements 4.3**

**Property 14: Autocomplete metadata population**
*For any* book selected from autocomplete, the book record should contain metadata (title, author, ISBN) from the API response.
**Validates: Requirements 4.4**

**Property 15: Inventory removal triggers match recalculation**
*For any* user with matches involving a specific book, removing that book from inventory should update all affected matches.
**Validates: Requirements 5.1**

**Property 16: Wishlist removal triggers match recalculation**
*For any* user with matches involving a specific book, removing that book from wishlist should update all affected matches.
**Validates: Requirements 5.2**

**Property 17: Unavailable books excluded from matching**
*For any* book marked as temporarily unavailable, it should not appear in any new matches until marked available again.
**Validates: Requirements 5.3**

**Property 18: Availability toggle round-trip**
*For any* book, marking it unavailable then available should restore its inclusion in the matching system.
**Validates: Requirements 5.4**

**Property 19: Availability changes update matches immediately**
*For any* book's availability status change, all matches involving that book should be recalculated within the next matching cycle.
**Validates: Requirements 5.5**

### Authentication Properties

**Property 20: Valid credentials grant access**
*For any* registered user, providing correct email and password should successfully authenticate and create a session.
**Validates: Requirements 6.1**

**Property 21: Invalid credentials deny access**
*For any* authentication attempt with incorrect credentials, the system should reject access and return an error.
**Validates: Requirements 6.2**

**Property 22: Logout terminates session**
*For any* authenticated user, logging out should invalidate their session token.
**Validates: Requirements 6.3**

**Property 23: Password reset mechanism**
*For any* registered user requesting password reset, the system should provide a secure token that allows password change.
**Validates: Requirements 6.4**

**Property 24: Protected endpoints require authentication**
*For any* request to profile or matching endpoints without valid authentication, the system should return 401 Unauthorized.
**Validates: Requirements 6.5**

### Matching System Properties

**Property 25: Location-based matching constraint**
*For any* user, all matches generated should only include users from the same location.
**Validates: Requirements 7.1**

**Property 26: Perfect match classification**
*For any* two users where User A has a book User B wants AND User B has a book User A wants, the system should classify this as a perfect match.
**Validates: Requirements 7.2**

**Property 27: Partial match type 1 classification**
*For any* two users where User B has a book User A wants but User A has no books User B wants, the system should classify this as partial match type 1 for User A.
**Validates: Requirements 7.3**

**Property 28: Partial match type 2 classification**
*For any* two users where User A has a book User B wants but User B has no books User A wants, the system should classify this as partial match type 2 for User A.
**Validates: Requirements 7.4**

**Property 29: Book-specific inventory matches**
*For any* book in a user's inventory, querying matches for that book should return all users who have that book in their wishlist.
**Validates: Requirements 8.1**

**Property 30: Book-specific wishlist matches**
*For any* book in a user's wishlist, querying matches for that book should return all users who have that book in their inventory.
**Validates: Requirements 8.2**

**Property 31: Match type included in book queries**
*For any* book-specific match query, each result should include the correct match type (perfect, partial type 1, or partial type 2).
**Validates: Requirements 8.3**

**Property 32: Individual match removal**
*For any* match, removing it should hide it from the user's match list without affecting the other user's matches.
**Validates: Requirements 9.1, 9.3**

**Property 33: Bulk match removal**
*For any* user with matches, removing all matches should result in an empty match list for that user.
**Validates: Requirements 9.2**

**Property 34: Match refresh restores hidden matches**
*For any* hidden match, manually refreshing matches should make it reappear in the match list.
**Validates: Requirements 9.4**

**Property 35: Hidden matches persist across sessions**
*For any* match hidden by a user, it should remain hidden after logout and login until manually refreshed.
**Validates: Requirements 9.5**

**Property 36: Book title filter**
*For any* book title filter applied to matches, only matches involving books with that title should be returned.
**Validates: Requirements 10.1**

**Property 37: User name filter**
*For any* user name filter applied to matches, only matches with that specific user should be returned.
**Validates: Requirements 10.2**

**Property 38: Date sorting**
*For any* set of matches sorted by date, they should be ordered from newest to oldest based on creation timestamp.
**Validates: Requirements 10.3**

**Property 39: Common books sorting**
*For any* set of matches sorted by common books, they should be ordered from most to fewest matching books.
**Validates: Requirements 10.4**

**Property 40: Filter composition**
*For any* combination of filters and sorting, applying them should produce results that satisfy all filter criteria in the specified sort order.
**Validates: Requirements 10.5**

### Notification Properties

**Property 41: Match notification creation**
*For any* new match generated, a notification should be created for the user with type='new_match'.
**Validates: Requirements 11.1**

**Property 42: Message notification creation**
*For any* chat message received, a notification should be created for the recipient with type='new_message'.
**Validates: Requirements 11.2**

**Property 43: Proposal notification creation**
*For any* meeting proposal received, a notification should be created for the recipient with type='meeting_proposal'.
**Validates: Requirements 11.3**

**Property 44: Notification read status**
*For any* notification, viewing it should mark it as read (isRead=true).
**Validates: Requirements 11.4**

### Room Management Properties

**Property 45: Automatic location room membership**
*For any* user registration, the user should automatically become a member of their location's room.
**Validates: Requirements 12.1**

**Property 46: Genre room generation**
*For any* new location created, the system should generate public rooms for all predefined book genres.
**Validates: Requirements 12.2**

**Property 47: Public room visibility**
*For any* user, querying available rooms should return all public genre rooms in their location.
**Validates: Requirements 12.3, 12.4**

**Property 48: Private room visibility and restriction**
*For any* private room created, it should be visible in room listings but not joinable without admin approval.
**Validates: Requirements 13.1**

**Property 49: Join request notification**
*For any* join request to a private room, a notification should be created for all room admins.
**Validates: Requirements 13.2**

**Property 50: Join approval grants access**
*For any* approved join request, the user should gain access to the private room.
**Validates: Requirements 13.3**

**Property 51: Join denial prevents access**
*For any* denied join request, the user should not be able to access the private room.
**Validates: Requirements 13.4**

**Property 52: Member removal revokes access**
*For any* room member removed by an admin, that user should immediately lose access to the room.
**Validates: Requirements 13.5**

### Chat and Communication Properties

**Property 53: Chat creation from match**
*For any* match, initiating chat should create a conversation between the two matched users.
**Validates: Requirements 14.1**

**Property 54: Message delivery**
*For any* message sent in a chat, it should be deliverable to the other participant.
**Validates: Requirements 14.2**

**Property 55: Chat listing completeness**
*For any* user, querying their chats should return all conversations they're a participant in.
**Validates: Requirements 14.3**

**Property 56: Chat history persistence**
*For any* message sent, it should be retrievable in the chat history at any later time.
**Validates: Requirements 14.4**

**Property 57: Chat authorization**
*For any* attempt to create a chat without a corresponding match, the system should reject the request.
**Validates: Requirements 14.5**

**Property 58: Proposal creation and delivery**
*For any* meeting proposal created, it should be associated with the chat and visible to both participants.
**Validates: Requirements 15.1**

**Property 59: Proposal acceptance locks details**
*For any* meeting proposal, accepting it should change status to 'confirmed' and prevent further modifications without re-approval.
**Validates: Requirements 15.2**

**Property 60: Proposal rejection allows new proposals**
*For any* rejected meeting proposal, either user should be able to create a new proposal.
**Validates: Requirements 15.3**

**Property 61: Confirmed proposal visibility**
*For any* confirmed meeting proposal, both users should be able to view the locked meeting details.
**Validates: Requirements 15.4**

**Property 62: Proposal modification requires re-approval**
*For any* confirmed meeting proposal that is modified, the status should reset to 'pending' requiring both users to approve again.
**Validates: Requirements 15.5**

### Trade and Rating Properties

**Property 63: Trade completion removes exchanged books**
*For any* trade confirmed by both users, the exchanged books should be removed from each user's inventory.
**Validates: Requirements 16.1**

**Property 64: Trade completion adds received books**
*For any* completed trade, each user should receive the books they were trading for in their inventory.
**Validates: Requirements 16.2**

**Property 65: Trade completion cleans wishlists**
*For any* completed trade, books received should be removed from the recipient's wishlist.
**Validates: Requirements 16.3**

**Property 66: Trade triggers match recalculation**
*For any* completed trade, matches should be recalculated for both users based on their updated inventories.
**Validates: Requirements 16.4**

**Property 67: Trade requires dual confirmation**
*For any* trade, inventory updates should only execute when both users have confirmed completion.
**Validates: Requirements 16.5**

**Property 68: Rating association**
*For any* rating submitted, it should be associated with the rated user's profile and linked to the specific trade.
**Validates: Requirements 17.2**

**Property 69: Rating aggregation**
*For any* user with multiple ratings, viewing their profile should display the correct average rating score.
**Validates: Requirements 17.3**

**Property 70: Report storage**
*For any* report submitted, it should be stored with all provided details (reporter, reported user, reason, details).
**Validates: Requirements 17.4**

**Property 71: Report admin visibility**
*For any* report submitted, it should be queryable by system administrators for review.
**Validates: Requirements 17.5**

## Error Handling

### Authentication Errors
- Invalid credentials: Return 401 with clear error message
- Expired session: Return 401 and prompt re-login
- Missing authentication: Return 401 for protected endpoints
- Password reset token expired: Return 400 with error message

### Validation Errors
- Missing required fields: Return 400 with list of missing fields
- Invalid data format: Return 400 with specific validation errors
- File upload errors: Return 400 with file size/type constraints
- ISBN not found: Return 404 with suggestion to add manually

### Business Logic Errors
- Duplicate book in inventory: Return 409 with error message
- Match not found: Return 404
- Chat creation without match: Return 403 Forbidden
- Room access denied: Return 403 with reason
- Trade confirmation mismatch: Return 400 with current status

### External API Errors
- Google Books API timeout: Fallback to manual entry, log error
- Google Books API rate limit: Cache results, implement exponential backoff
- Image upload service failure: Return 503, allow retry

### Database Errors
- Connection failure: Return 503, implement retry logic
- Constraint violation: Return 409 with user-friendly message
- Transaction failure: Rollback and return 500 with error ID for debugging

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Additional error context
    timestamp: Date;
  }
}
```

## Testing Strategy

### Unit Testing

**Frontend Unit Tests:**
- Component rendering with various props
- Form validation logic
- State management reducers
- Utility functions (date formatting, string manipulation)
- API client error handling

**Backend Unit Tests:**
- Request validation middleware
- Authentication/authorization logic
- Business logic services (matching algorithm, rating aggregation)
- Database query builders
- Error handling middleware

**Testing Framework:** Jest with React Testing Library (frontend), Jest with Supertest (backend)

### Property-Based Testing

**Property-Based Testing Library:** fast-check for TypeScript/JavaScript

**Configuration:** Each property-based test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging:** Each property-based test must include a comment tag in this exact format:
```typescript
// Feature: bookswap, Property {number}: {property_text}
```

**Key Properties to Test:**

1. **Matching Algorithm Properties:**
   - Property 25: Location-based matching constraint
   - Property 26: Perfect match classification
   - Property 27-28: Partial match classification
   - Property 13: ISBN-based matching (books with same ISBN match regardless of title)

2. **Data Persistence Properties:**
   - Property 4: Profile update persistence
   - Property 18: Availability toggle round-trip
   - Property 56: Chat history persistence

3. **Authorization Properties:**
   - Property 24: Protected endpoints require authentication
   - Property 57: Chat authorization (can't create chat without match)

4. **Filtering and Sorting Properties:**
   - Property 40: Filter composition (multiple filters work together correctly)
   - Property 38-39: Sorting properties

5. **State Management Properties:**
   - Property 62: Proposal modification requires re-approval
   - Property 67: Trade requires dual confirmation

**Generator Strategies:**
- Create smart generators that constrain to valid input spaces (e.g., valid ISBNs, realistic user data)
- Use shrinking to find minimal failing cases
- Generate edge cases: empty strings, very long strings, special characters, boundary values

### Integration Testing

**API Integration Tests:**
- End-to-end user registration and login flow
- Complete matching workflow (add books → generate matches → filter/sort)
- Chat creation and message exchange
- Meeting proposal lifecycle (create → accept/reject → modify)
- Trade completion workflow
- Room creation and membership management

**Database Integration Tests:**
- Transaction rollback on errors
- Cascade deletions (user deletion removes books, matches, etc.)
- Index performance on large datasets
- Concurrent access scenarios

**External API Integration Tests:**
- Google Books API integration with mock responses
- File upload service integration
- WebSocket connection handling

### End-to-End Testing

**Framework:** Playwright or Cypress

**Critical User Flows:**
- New user registration → add books → view matches → initiate chat
- Perfect match flow → chat → propose meeting → complete trade → rate
- Private room creation → invite users → approve/deny requests
- Notification flow → receive notification → mark as read

### Performance Testing

**Load Testing:**
- Matching algorithm performance with 10,000+ users
- WebSocket connection handling with 1,000+ concurrent users
- Database query performance with large datasets

**Optimization Targets:**
- API response time < 200ms for 95th percentile
- Matching calculation < 5 seconds for users with 100+ books
- WebSocket message delivery < 100ms

## Security Considerations

### Authentication & Authorization
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens with 24-hour expiration
- Refresh token rotation
- Rate limiting on authentication endpoints (5 attempts per 15 minutes)

### Data Protection
- Input sanitization to prevent XSS attacks
- Parameterized queries to prevent SQL injection
- File upload validation (type, size, content scanning)
- HTTPS only in production
- CORS configuration for allowed origins

### Privacy
- User location stored at city/region level, not exact coordinates
- Chat messages encrypted at rest
- Profile visibility controls
- GDPR compliance: data export and deletion capabilities

### Rate Limiting
- API endpoints: 100 requests per minute per user
- File uploads: 10 per hour per user
- Match refresh: Once per 5 minutes per user
- WebSocket connections: 5 concurrent per user

## Deployment Architecture

### Development Environment
- Local PostgreSQL and Redis instances
- Hot reload for frontend and backend
- Mock external APIs for offline development

### Production Environment
- Frontend: Static hosting (Vercel, Netlify, or AWS S3 + CloudFront)
- Backend: Container deployment (Docker on AWS ECS, Google Cloud Run, or similar)
- Database: Managed PostgreSQL (AWS RDS, Google Cloud SQL)
- Cache: Managed Redis (AWS ElastiCache, Redis Cloud)
- File Storage: Object storage (AWS S3, Google Cloud Storage)
- WebSocket: Sticky sessions with load balancer

### CI/CD Pipeline
1. Run linting and type checking
2. Run unit tests and property-based tests
3. Run integration tests
4. Build Docker images
5. Deploy to staging environment
6. Run E2E tests on staging
7. Deploy to production with blue-green deployment

### Monitoring & Observability
- Application logs: Structured JSON logging
- Error tracking: Sentry or similar
- Performance monitoring: New Relic, DataDog, or similar
- Uptime monitoring: Pingdom or similar
- Database performance: Query analysis and slow query logs

## Matching Engine Implementation

### Matching Algorithm

The matching engine runs as a scheduled job (via node-cron) that periodically calculates matches for all users. The algorithm:

1. **Group users by location** - Only users in the same location can match
2. **For each user:**
   - Get their inventory (available books)
   - Get their wishlist (wanted books)
3. **Find potential matches:**
   - Query users in same location who have books in current user's wishlist
   - Query users in same location who want books in current user's inventory
4. **Classify matches:**
   - Perfect: Bidirectional want (A wants B's book AND B wants A's book)
   - Partial Type 1: Unidirectional want (B has book A wants, but A has nothing B wants)
   - Partial Type 2: Unidirectional want (A has book B wants, but B has nothing A wants)
5. **Store matches** with classification and matching book details
6. **Create notifications** for new matches

### Optimization Strategies

**Caching:**
- Cache user inventories and wishlists in Redis
- Cache match results for 5 minutes
- Invalidate cache on inventory/wishlist changes

**Incremental Updates:**
- Only recalculate matches for users whose inventory/wishlist changed
- Track "dirty" users who need match recalculation
- Run full recalculation daily, incremental updates every 5 minutes

**Database Optimization:**
- Indexes on books.isbn, books.userId, books.listType
- Materialized view for active matches
- Batch insert matches to reduce database round trips

**Scalability:**
- Partition matching job by location (can run in parallel)
- Use message queue (Redis pub/sub or RabbitMQ) for match calculation tasks
- Horizontal scaling of matching workers

## Future Enhancements

### Phase 2 Features
- Mobile app (React Native)
- Book condition verification photos
- In-app messaging with image support
- Calendar integration for meeting proposals
- Multi-book bundle exchanges

### Phase 3 Features
- Reputation system with badges
- Book recommendations based on wishlist
- Social features (follow users, share collections)
- Virtual book clubs within rooms
- Integration with Goodreads API

### Technical Improvements
- GraphQL API for more flexible queries
- Real-time match updates via WebSocket
- Machine learning for better match ranking
- Full-text search for books
- Progressive Web App (PWA) support
