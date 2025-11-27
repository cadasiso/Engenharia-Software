# Implementation Plan

- [x] 1. Set up project structure and development environment





  - Initialize monorepo with frontend and backend workspaces
  - Configure TypeScript for both frontend and backend
  - Set up ESLint and Prettier for code quality
  - Create Docker Compose file for PostgreSQL and Redis
  - Initialize Prisma ORM and create initial schema
  - Set up environment variable management
  - _Requirements: All (foundational)_

- [x] 2. Implement database schema and models



  - Define Prisma schema for User, Book, Match, Chat, Message, MeetingProposal, Room, RoomMembership, Trade, Rating, Report, Notification models
  - Create database migrations
  - Set up database indexes for performance
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.1, 7.2, 7.3, 7.4, 14.1, 14.2, 15.1, 16.1, 17.2, 17.4_

- [x] 2.1 Write property test for database schema



  - **Property 1: Account creation with valid data**
  - **Validates: Requirements 1.1**

- [x] 2.2 Write property test for book storage

  - **Property 2: Book inventory storage**
  - **Property 3: Wishlist storage**
  - **Validates: Requirements 1.2, 1.3**

- [x] 3. Implement authentication system



  - Create user registration endpoint with password hashing (bcrypt)
  - Implement login endpoint with JWT token generation
  - Create logout endpoint with session invalidation
  - Implement password reset request and confirmation endpoints
  - Create authentication middleware for protected routes
  - Set up Redis for session management
  - _Requirements: 1.1, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3.1 Write property test for authentication


  - **Property 5: Required field validation**
  - **Property 20: Valid credentials grant access**
  - **Property 21: Invalid credentials deny access**
  - **Property 22: Logout terminates session**
  - **Property 24: Protected endpoints require authentication**
  - **Validates: Requirements 1.5, 6.1, 6.2, 6.3, 6.5**

- [x] 3.2 Write property test for password reset



  - **Property 23: Password reset mechanism**
  - **Validates: Requirements 6.4**

- [x] 4. Implement user profile management



  - Create endpoint to get user profile
  - Create endpoint to update user profile (name, location, biography, social links)
  - Implement profile picture upload with Multer
  - Create endpoint to get user ratings
  - Add default placeholder image for profiles without pictures
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 17.3_


- [ ] 4.1 Write property test for profile updates
  - **Property 4: Profile update persistence**
  - **Property 6: Profile picture round-trip**
  - **Property 7: Biography persistence**
  - **Property 8: Social links storage**
  - **Validates: Requirements 1.4, 2.1, 2.2, 2.3**


- [ ] 4.2 Write property test for rating aggregation
  - **Property 69: Rating aggregation**
  - **Validates: Requirements 17.3**

- [x] 5. Implement book management system


  - Create Google Books API integration service for autocomplete
  - Implement endpoint to search books via Google Books API
  - Create endpoint to add book to inventory with photos, condition, and description
  - Create endpoint to add book to wishlist
  - Implement endpoint to remove book from inventory
  - Implement endpoint to remove book from wishlist
  - Create endpoint to update book availability status
  - Implement book photo upload endpoint
  - Add default book cover image for books without photos
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 5.4_

- [x] 5.1 Write property test for book management

  - **Property 9: Book photo upload**
  - **Property 10: Book condition requirement**
  - **Property 11: Book description storage**
  - **Property 12: Book data completeness**
  - **Property 14: Autocomplete metadata population**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 4.4**

- [x] 5.2 Write property test for book removal

  - **Property 15: Inventory removal triggers match recalculation**
  - **Property 16: Wishlist removal triggers match recalculation**
  - **Validates: Requirements 5.1, 5.2**

- [x] 5.3 Write property test for book availability

  - **Property 17: Unavailable books excluded from matching**
  - **Property 18: Availability toggle round-trip**
  - **Property 19: Availability changes update matches immediately**
  - **Validates: Requirements 5.3, 5.4, 5.5**

- [x] 6. Implement matching engine core algorithm


  - Create matching service with location-based filtering
  - Implement perfect match classification logic
  - Implement partial match type 1 classification logic
  - Implement partial match type 2 classification logic
  - Create match storage with book details
  - Implement match recalculation trigger on inventory/wishlist changes
  - Set up node-cron for scheduled matching jobs
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 5.1, 5.2, 5.5, 16.4_


- [ ] 6.1 Write property test for matching algorithm
  - **Property 13: ISBN-based matching**
  - **Property 25: Location-based matching constraint**
  - **Property 26: Perfect match classification**
  - **Property 27: Partial match type 1 classification**
  - **Property 28: Partial match type 2 classification**

  - **Validates: Requirements 4.3, 7.1, 7.2, 7.3, 7.4**


- [ ] 7. Implement match management endpoints
  - Create endpoint to get user's matches with filtering and sorting
  - Implement book title filter
  - Implement user name filter
  - Implement date sorting
  - Implement common books count sorting
  - Create endpoint to get matches for specific book
  - Implement endpoint to remove individual match
  - Implement endpoint to remove all matches

  - Create endpoint to manually refresh matches
  - _Requirements: 7.5, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 7.1 Write property test for match queries
  - **Property 29: Book-specific inventory matches**

  - **Property 30: Book-specific wishlist matches**
  - **Property 31: Match type included in book queries**
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ] 7.2 Write property test for match management
  - **Property 32: Individual match removal**

  - **Property 33: Bulk match removal**
  - **Property 34: Match refresh restores hidden matches**
  - **Property 35: Hidden matches persist across sessions**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 7.3 Write property test for match filtering and sorting
  - **Property 36: Book title filter**
  - **Property 37: User name filter**
  - **Property 38: Date sorting**
  - **Property 39: Common books sorting**
  - **Property 40: Filter composition**
  - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [ ] 8. Implement notification system
  - Create notification service
  - Implement notification creation for new matches
  - Implement notification creation for new messages
  - Implement notification creation for meeting proposals
  - Create endpoint to get user notifications
  - Create endpoint to mark notification as read
  - Create endpoint to mark all notifications as read
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_



- [ ] 8.1 Write property test for notifications
  - **Property 41: Match notification creation**
  - **Property 42: Message notification creation**
  - **Property 43: Proposal notification creation**
  - **Property 44: Notification read status**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [ ] 9. Implement room management system
  - Create location room auto-creation on user registration
  - Implement genre room generation for new locations
  - Create endpoint to get available rooms for user's location

  - Create endpoint to get room details
  - Implement endpoint to create private room
  - Create endpoint to request joining private room
  - Implement endpoint to approve join request (admin)
  - Implement endpoint to deny join request (admin)
  - Create endpoint to remove member from private room (admin)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 9.1 Write property test for room management

  - **Property 45: Automatic location room membership**
  - **Property 46: Genre room generation**
  - **Property 47: Public room visibility**

  - **Property 48: Private room visibility and restriction**
  - **Property 49: Join request notification**
  - **Property 50: Join approval grants access**
  - **Property 51: Join denial prevents access**
  - **Property 52: Member removal revokes access**
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 13.4, 13.5**


- [ ] 10. Implement chat system with WebSocket support
  - Set up Socket.io server
  - Create endpoint to get user's chat conversations
  - Create endpoint to get chat messages
  - Implement endpoint to create new chat from match
  - Add authorization check for chat creation (must have match)
  - Implement WebSocket event handlers for join_chat, send_message, typing
  - Implement WebSocket event emitters for new_message
  - Create message persistence in database
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 10.1 Write property test for chat system
  - **Property 53: Chat creation from match**
  - **Property 54: Message delivery**
  - **Property 55: Chat listing completeness**
  - **Property 56: Chat history persistence**
  - **Property 57: Chat authorization**
  - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

- [x] 11. Implement meeting proposal system



  - Create endpoint to create meeting proposal
  - Implement endpoint to update meeting proposal
  - Create endpoint to accept proposal (locks details, sets status to confirmed)
  - Create endpoint to reject proposal
  - Add logic to reset status to pending when confirmed proposal is modified
  - Implement WebSocket event emitter for proposal_update
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_


- [ ] 11.1 Write property test for meeting proposals
  - **Property 58: Proposal creation and delivery**
  - **Property 59: Proposal acceptance locks details**
  - **Property 60: Proposal rejection allows new proposals**
  - **Property 61: Confirmed proposal visibility**



  - **Property 62: Proposal modification requires re-approval**
  - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

- [ ] 12. Implement trade and rating system
  - Create endpoint to initiate trade
  - Implement endpoint to confirm trade completion (requires both users)
  - Add trade completion logic: remove exchanged books, add received books, remove from wishlists
  - Trigger match recalculation after trade completion
  - Create endpoint to rate trade experience
  - Implement rating association with user profile

  - Create endpoint to report user
  - Implement report storage and admin visibility
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 12.1 Write property test for trade system
  - **Property 63: Trade completion removes exchanged books**
  - **Property 64: Trade completion adds received books**

  - **Property 65: Trade completion cleans wishlists**
  - **Property 66: Trade triggers match recalculation**
  - **Property 67: Trade requires dual confirmation**
  - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**

- [ ] 12.2 Write property test for rating and reporting
  - **Property 68: Rating association**
  - **Property 70: Report storage**
  - **Property 71: Report admin visibility**
  - **Validates: Requirements 17.2, 17.4, 17.5**

- [ ] 13. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Set up React frontend project
  - Initialize React app with TypeScript and Vite
  - Set up React Router v6
  - Configure TailwindCSS
  - Set up Axios for API calls
  - Configure Socket.io client
  - Create React Context for authentication state
  - Create React Context for notification state
  - Set up React Hook Form
  - _Requirements: All (frontend foundation)_

- [x] 15. Implement authentication UI components



  - Create LoginPage component with form validation
  - Create RegisterPage component with location selection
  - Create PasswordResetPage component
  - Implement authentication context and hooks
  - Add protected route wrapper component
  - Create logout functionality
  - _Requirements: 1.1, 1.5, 6.1, 6.2, 6.3, 6.4_

- [x] 15.1 Write unit tests for authentication components

  - Test login form validation
  - Test registration form validation
  - Test authentication context state management
  - _Requirements: 1.1, 1.5, 6.1, 6.2, 6.3_

- [x] 16. Implement profile management UI


  - Create ProfilePage component for viewing and editing profile
  - Implement ProfilePictureUpload component
  - Create form for editing biography and social links
  - Add default placeholder image display
  - Implement user ratings display
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 17.3_

- [ ] 16.1 Write unit tests for profile components
  - Test profile form validation
  - Test profile picture upload
  - Test ratings display
  - _Requirements: 1.4, 2.1, 2.2, 2.3_

- [x] 17. Implement book management UI



  - Create AddBookForm with ISBN input and Google Books autocomplete
  - Implement BookInventoryList component
  - Create WishListDisplay component
  - Add book photo upload functionality
  - Implement book condition selector
  - Create book description input
  - Add book removal functionality
  - Implement availability toggle



  - Add default book cover image display
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 5.4_

- [x] 17.1 Write unit tests for book management components

  - Test book form validation
  - Test autocomplete functionality

  - Test book photo upload
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 4.2, 4.4_


- [ ] 18. Implement matching UI components
  - Create MatchesDashboard with perfect and partial match sections
  - Implement MatchCard component with user info and matching books
  - Create MatchFilters component for filtering and sorting
  - Implement BookMatchesView for book-specific matches
  - Add match removal functionality (individual and bulk)
  - Implement match refresh button

  - Display perfect matches more prominently than partial matches
  - _Requirements: 7.5, 8.1, 8.2, 8.3, 9.1, 9.2, 9.4, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 18.1 Write unit tests for matching components
  - Test match filtering logic
  - Test match sorting logic
  - Test match card rendering
  - _Requirements: 7.5, 8.1, 8.2, 10.1, 10.2, 10.3, 10.4_

- [ ] 19. Implement chat UI with real-time messaging
  - Create ChatList component
  - Implement ChatWindow component
  - Create MessageInput component
  - Set up Socket.io client connection
  - Implement real-time message sending and receiving
  - Add typing indicator
  - Display chat history
  - Add authorization check (can only chat with matches)
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_



- [ ] 19.1 Write unit tests for chat components
  - Test message input validation
  - Test chat list rendering
  - Test message display
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 20. Implement meeting proposal UI
  - Create MeetingProposalForm component
  - Implement MeetingProposalCard with accept/reject actions
  - Add proposal creation functionality

  - Implement proposal acceptance (locks details)
  - Add proposal rejection functionality
  - Display locked meeting details for confirmed proposals
  - Handle proposal modification (requires re-approval)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 20.1 Write unit tests for meeting proposal components
  - Test proposal form validation
  - Test proposal status display
  - Test accept/reject actions
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 21. Implement room management UI
  - Create RoomsList component
  - Implement RoomView component
  - Create PrivateRoomAdmin interface for managing access
  - Add join request functionality
  - Implement approve/deny request actions (admin)
  - Add member removal functionality (admin)
  - Display public genre rooms
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 21.1 Write unit tests for room components
  - Test room list rendering
  - Test join request functionality
  - Test admin actions
  - _Requirements: 12.3, 13.1, 13.2, 13.3, 13.4_

- [ ] 22. Implement trade and rating UI
  - Create TradeConfirmation component
  - Implement RatingForm component
  - Create ReportForm component
  - Add trade initiation functionality
  - Implement dual confirmation for trade completion
  - Add rating submission after trade
  - Implement user reporting functionality
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 17.1, 17.2, 17.4, 17.5_

- [ ] 22.1 Write unit tests for trade components
  - Test trade confirmation flow
  - Test rating form validation
  - Test report form validation
  - _Requirements: 16.5, 17.2, 17.4_

- [ ] 23. Implement notification UI
  - Create NotificationBell component with unread count
  - Implement NotificationList dropdown
  - Add real-time notification updates via WebSocket
  - Implement mark as read functionality
  - Display unread notifications prominently
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 23.1 Write unit tests for notification components
  - Test notification bell rendering
  - Test notification list display
  - Test mark as read functionality
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 24. Implement shared UI components
  - Create BookCard reusable component
  - Implement UserAvatar component with fallback
  - Add loading spinners and error states
  - Create form validation utilities
  - Implement date formatting utilities
  - _Requirements: All (UI foundation)_

- [ ] 24.1 Write unit tests for shared components
  - Test BookCard rendering
  - Test UserAvatar fallback
  - Test utility functions
  - _Requirements: All (UI foundation)_

- [ ] 25. Implement error handling and validation
  - Add global error boundary component
  - Implement API error handling with user-friendly messages
  - Add form validation error displays
  - Create toast notifications for success/error messages
  - Implement retry logic for failed requests
  - _Requirements: All (error handling)_

- [ ] 26. Checkpoint - Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 27. Set up file upload service
  - Configure Multer for file uploads
  - Implement file validation (type, size)
  - Set up file storage (local for dev, S3 for production)
  - Add image optimization/resizing
  - Implement file URL generation
  - _Requirements: 2.1, 3.1_

- [ ] 28. Implement caching and optimization
  - Set up Redis caching for user inventories and wishlists
  - Implement cache invalidation on data changes
  - Add API response caching
  - Optimize database queries with proper indexes
  - Implement pagination for large result sets
  - _Requirements: All (performance)_

- [ ] 29. Implement security measures
  - Add rate limiting middleware
  - Implement input sanitization
  - Add CORS configuration
  - Set up HTTPS redirect middleware
  - Implement file upload security scanning
  - Add SQL injection prevention (parameterized queries)
  - _Requirements: All (security)_

- [ ] 30. Set up deployment configuration
  - Create Dockerfile for backend
  - Create Docker Compose for full stack
  - Set up environment variable configuration for production
  - Create CI/CD pipeline configuration
  - Add health check endpoints
  - Configure logging and monitoring
  - _Requirements: All (deployment)_

- [ ] 31. Final integration testing and bug fixes
  - Run end-to-end tests for critical user flows
  - Test WebSocket connections under load
  - Verify matching algorithm with large datasets
  - Test file uploads and storage
  - Verify all API endpoints with Postman/Insomnia
  - Fix any discovered bugs
  - _Requirements: All_

- [ ] 32. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.
