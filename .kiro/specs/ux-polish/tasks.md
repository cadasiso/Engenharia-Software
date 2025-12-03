# Implementation Plan

- [x] 1. Create reusable UI components





  - [ ] 1.1 Create SearchInput component
    - Styled input with search icon
    - Debounced onChange handler
    - Clear button when text present


    - _Requirements: 9.1, 10.1_

  - [ ] 1.2 Create ProfileSummaryModal component
    - Fetch user data on open
    - Display user info and book counts


    - "View Full Profile" button
    - Loading state while fetching
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 1.3 Create TradeProposalModal component
    - Display user's books and matched user's books
    - Multi-select for offered books (green highlight)
    - Multi-select for requested books (blue highlight)
    - Validation before submission
    - Loading state on submit
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 2. Backend: User profile and room management endpoints


  - [x] 2.1 Create GET /api/users/:id/summary endpoint


    - Return user profile with book counts
    - Exclude sensitive data (email, passwordHash)
    - _Requirements: 4.3_

  - [x] 2.2 Create POST /api/rooms/:id/leave endpoint


    - Verify user is member
    - Remove user from room
    - Return books to public inventory
    - Update member count
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x] 2.3 Update GET /api/matches endpoint


    - Add filter for users with both inventory and wishlist books
    - Apply filter by default
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 2.4 Write property test for match visibility
    - **Property 4: Match visibility requirements**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ]* 2.5 Write property test for room exit book restoration
    - **Property 3: Room exit book restoration**
    - **Validates: Requirements 3.4**

- [ ] 3. Update MatchesPage
  - [ ] 3.1 Add SearchInput for filtering matches
    - Filter by user name
    - Maintain match type grouping
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 3.2 Remove "Propose Trade" button
    - Only show chat initiation buttons
    - _Requirements: 7.1, 7.2_

  - [ ] 3.3 Make user names clickable
    - Open ProfileSummaryModal on click
    - _Requirements: 4.1_

  - [ ] 3.4 Replace all alert() with custom modals
    - Use showModal for success/error
    - Use showConfirm for confirmations
    - _Requirements: 1.1, 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 3.5 Add LoadingButton to all actions
    - Hide match button
    - Refresh matches button
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 13.2_

- [ ] 4. Update ChatsPage
  - [ ] 4.1 Add "Propose Trade" button to chat header
    - Only show when chat is active
    - Open TradeProposalModal on click
    - _Requirements: 7.4, 7.5_

  - [ ] 4.2 Integrate TradeProposalModal
    - Fetch user's books and matched user's books
    - Handle submission
    - Show success/error feedback
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 5. Update RoomsPage
  - [ ] 5.1 Replace all alert() with custom modals
    - Room creation success
    - Join room success/error
    - Join request sent
    - _Requirements: 1.1, 2.1, 2.2, 2.3_

  - [ ] 5.2 Add LoadingButton to all actions
    - Create room button
    - Join room buttons
    - Toggle privacy button
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 2.2, 2.5_

- [ ] 6. Update RoomDetailPage
  - [ ] 6.1 Add "Leave Room" button
    - Show for non-admin members
    - Confirmation modal before leaving
    - Loading state during leave
    - Success feedback after leaving
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ] 6.2 Add SearchInput for members
    - Filter members by name
    - Show count of filtered results
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 6.3 Make member names clickable
    - Open ProfileSummaryModal on click
    - _Requirements: 4.2_

  - [ ] 6.4 Replace all alert() with custom modals
    - Join request approval
    - Member actions
    - _Requirements: 1.1, 2.4_

  - [ ] 6.5 Add LoadingButton to all actions
    - Approve/reject join requests
    - Admin actions
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 2.4_

- [ ] 7. Update BooksPage
  - [ ] 7.1 Replace all alert() with custom modals
    - Book added success
    - Book deleted confirmation
    - Book updated success
    - Book assigned to room success
    - All error messages
    - _Requirements: 1.1, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 7.2 Add LoadingButton to all actions
    - Add book button
    - Delete book buttons
    - Update book buttons
    - Assign to room buttons
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 8. Update TradesPage
  - [ ] 8.1 Replace all alert() with custom modals
    - Accept trade confirmation
    - Reject trade confirmation
    - Trade action success
    - All error messages
    - _Requirements: 1.1, 12.1, 12.2, 12.4, 12.5_

  - [ ] 8.2 Add counter-propose functionality
    - Open TradeProposalModal with pre-filled data
    - Handle counter-proposal submission
    - _Requirements: 12.3_

  - [ ] 8.3 Add LoadingButton to all actions
    - Accept trade buttons
    - Reject trade buttons
    - Counter-propose buttons
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 9. Browser alert audit and cleanup
  - [ ] 9.1 Search codebase for alert() calls
    - Use grep/search to find all instances
    - Create list of files to update
    - _Requirements: 1.1_

  - [ ] 9.2 Search codebase for confirm() calls
    - Use grep/search to find all instances
    - Create list of files to update
    - _Requirements: 1.5_

  - [ ] 9.3 Replace remaining alerts in backend routes
    - Update any server-side alert usage
    - Ensure proper error responses
    - _Requirements: 1.1_

  - [ ]* 9.4 Write property test for no browser alerts
    - **Property 1: No browser alerts**
    - **Validates: Requirements 1.1**

- [ ] 10. Testing and validation
  - [ ] 10.1 Test profile summary from all entry points
    - Matches page
    - Room detail page
    - Verify data loads correctly
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 10.2 Test trade proposal flow
    - From chat page
    - Book selection
    - Validation
    - Submission
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 10.3 Test room leave functionality
    - Leave room
    - Verify books restored
    - Verify member count updated
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 10.4 Test search functionality
    - Room members search
    - Matches search
    - Verify filtering works
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4_

  - [ ] 10.5 Verify no browser alerts remain
    - Manual testing of all pages
    - All actions should use custom UI
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 10.6 Verify loading states everywhere
    - All buttons show loading during async operations
    - Buttons are disabled while loading
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 10.7 Run all property-based tests
    - Execute all property tests
    - Verify 100+ iterations per test
    - Fix any failing properties
    - _All property requirements_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
