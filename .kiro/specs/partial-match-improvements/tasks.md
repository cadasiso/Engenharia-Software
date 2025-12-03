# Implementation Plan

- [x] 1. Database schema and migrations


  - Create ChatRequest model with all fields
  - Add relations to User model
  - Create database migration file
  - Run migration on development database
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_





- [ ] 2. Backend: Chat request API endpoints
  - [ ] 2.1 Create POST /api/chat-requests endpoint
    - Validate match exists and user is non-privileged
    - Check for existing pending requests


    - Create chat request record
    - Create notification for recipient
    - _Requirements: 1.1, 1.2, 1.6_



  - [ ] 2.2 Create GET /api/chat-requests endpoint
    - Return sent and received requests
    - Filter by status (pending, accepted, rejected)
    - Include user and match information
    - _Requirements: 1.3_



  - [ ] 2.3 Create POST /api/chat-requests/:id/accept endpoint
    - Verify user is recipient
    - Create chat between users
    - Update request status to accepted
    - Create notification for requester
    - _Requirements: 1.4_

  - [ ] 2.4 Create POST /api/chat-requests/:id/reject endpoint
    - Verify user is recipient
    - Update request status to rejected
    - Create notification for requester
    - _Requirements: 1.5_

  - [ ]* 2.5 Write property test for chat request uniqueness
    - **Property 1: Chat request uniqueness**
    - **Validates: Requirements 1.6**

  - [ ]* 2.6 Write property test for state transitions
    - **Property 2: Chat request state transitions**
    - **Validates: Requirements 1.4, 1.5**

- [ ] 3. Backend: Update chat creation logic
  - [ ] 3.1 Update POST /api/chats endpoint
    - Check match type (perfect, partial_type1, partial_type2)
    - For partial_type1: return error directing to chat requests
    - For partial_type2: create chat directly
    - For perfect: check mutual initiation
    - Auto-accept pending requests when chat is created
    - _Requirements: 1.1, 2.1, 2.3, 3.1, 3.2_

  - [ ] 3.2 Update GET /api/chats/status/:userId endpoint
    - Include pending chat request status
    - Return appropriate status for each match type
    - _Requirements: 1.6, 3.3_

  - [ ]* 3.3 Write property test for privileged user direct access
    - **Property 3: Privileged user direct access**
    - **Validates: Requirements 2.1**

  - [ ]* 3.4 Write property test for non-privileged user request requirement
    - **Property 4: Non-privileged user request requirement**
    - **Validates: Requirements 1.1**

  - [ ]* 3.5 Write property test for perfect match mutual agreement
    - **Property 5: Perfect match mutual agreement**
    - **Validates: Requirements 3.2**

- [ ] 4. Backend: Flexible trade proposal system
  - [ ] 4.1 Update POST /api/trades endpoint
    - Remove restriction on book selection for privileged users
    - Allow any inventory books to be requested
    - Validate book ownership
    - Create locks for requested books
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 4.2 Update POST /api/trades/:id/counter endpoint
    - Allow flexible book selection for counter-proposals
    - Release old locks before creating new ones
    - Swap proposer role
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.3 Write property test for trade proposal validation
    - **Property 6: Trade proposal book selection**
    - **Validates: Requirements 4.2, 8.4**

  - [ ]* 4.4 Write property test for book lock consistency
    - **Property 7: Book lock consistency**
    - **Validates: Requirements 4.3**

  - [ ]* 4.5 Write property test for counter-proposal lock release
    - **Property 8: Counter-proposal lock release**
    - **Validates: Requirements 5.3**

- [ ] 5. Frontend: Reusable loading button component
  - [ ] 5.1 Create LoadingButton component
    - Accept onClick async function
    - Show spinner during loading
    - Disable button during loading
    - Accept custom loading text
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 5.2 Write property test for loading state consistency
    - **Property 9: Loading state consistency**
    - **Validates: Requirements 6.2**

- [ ] 6. Frontend: Chat request UI components
  - [ ] 6.1 Create ChatRequestButton component
    - Show different states based on match type
    - Handle request creation
    - Show pending status
    - Use LoadingButton for actions
    - _Requirements: 1.1, 1.6, 2.1_

  - [ ] 6.2 Create ChatRequestsList component
    - Display received requests
    - Show requester information
    - Accept/reject buttons with loading states
    - _Requirements: 1.3, 1.4, 1.5_

  - [ ] 6.3 Update MatchesPage to use ChatRequestButton
    - Replace direct chat initiation for partial_type1
    - Keep direct initiation for partial_type2
    - Update perfect match flow
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.3_

- [ ] 7. Frontend: Notification system enhancements
  - [ ] 7.1 Add notification badge to navigation
    - Show unread count
    - Highlight when there are unread notifications
    - Click to navigate to notifications page
    - _Requirements: 7.5_

  - [ ] 7.2 Create NotificationsPage
    - List all notifications
    - Group by type
    - Mark as read functionality
    - Navigate to relevant pages on click
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ] 7.3 Add notification polling or WebSocket
    - Poll for new notifications every 30 seconds
    - Update badge count in real-time
    - _Requirements: 7.1_

  - [ ]* 7.4 Write property test for notification creation
    - **Property 10: Notification creation**
    - **Validates: Requirements 1.2, 7.1**

- [ ] 8. Frontend: Trade proposal UI improvements
  - [ ] 8.1 Create TradeProposalModal component
    - Display user's books in one section
    - Display matched user's books in another section
    - Allow multi-select for offered books
    - Allow multi-select for requested books
    - Visual distinction between offered and requested
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 8.2 Add validation to TradeProposalModal
    - Ensure at least one book offered
    - Ensure at least one book requested
    - Show custom modal errors (not browser alerts)
    - _Requirements: 8.4, 8.5_

  - [ ] 8.3 Update MatchesPage to use TradeProposalModal
    - Replace simple trade initiation
    - Pass match and book data
    - Handle submission with loading state
    - _Requirements: 4.1, 4.2, 8.1_

  - [ ] 8.4 Update TradesPage for counter-proposals
    - Add counter-propose button
    - Open TradeProposalModal with pre-filled data
    - Handle counter-proposal submission
    - _Requirements: 5.1, 5.2, 5.5_

- [ ] 9. Replace remaining browser alerts with custom modals
  - [ ] 9.1 Update TradesPage
    - Replace all alert() calls with showModal()
    - Replace all confirm() calls with showConfirm()
    - Add loading states to action buttons
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 9.2 Update BooksPage
    - Replace all alert() calls with showModal()
    - Replace all confirm() calls with showConfirm()
    - Add loading states to action buttons
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 9.3 Update MatchesPage
    - Replace all alert() calls with showModal()
    - Replace all confirm() calls with showConfirm()
    - Add loading states to action buttons
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 10. Testing and validation
  - [ ] 10.1 Test chat request flow end-to-end
    - Non-privileged user sends request
    - Privileged user receives notification
    - Privileged user accepts request
    - Chat is created
    - Both users can message
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 10.2 Test trade proposal flow for partial matches
    - Privileged user proposes trade with any books
    - Non-privileged user receives proposal
    - Non-privileged user counter-proposes
    - Locks are managed correctly
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

  - [ ] 10.3 Test loading states across all pages
    - Verify spinners appear
    - Verify buttons disable
    - Verify success/error feedback
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 10.4 Run all property-based tests
    - Execute all property tests
    - Verify 100+ iterations per test
    - Fix any failing properties
    - _All property requirements_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
