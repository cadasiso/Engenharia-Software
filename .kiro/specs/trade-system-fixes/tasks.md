# Implementation Plan

- [ ] 1. Database schema updates
  - [x] 1.1 Create BookAuditLog model in Prisma schema


    - Add model with all required fields
    - Add relations to Book, User, and Trade
    - Add indexes for performance
    - _Requirements: 6.1_




  - [x] 1.2 Generate and run Prisma migration

    - Generate migration file
    - Review migration SQL
    - Run migration on development database
    - _Requirements: 6.1_

  - [ ]* 1.3 Write property test for audit log creation
    - **Property 11: Trade audit log creation**
    - **Validates: Requirements 6.1**

- [x] 2. Backend: Book transfer service


  - [ ] 2.1 Create bookTransfer service file
    - Create services/bookTransfer.ts
    - Define interfaces for transfer requests and results

    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 2.2 Implement validateBookOwnership function
    - Verify books exist
    - Verify correct ownership

    - Verify books are available
    - _Requirements: 3.1, 3.2, 4.1_

  - [ ] 2.3 Implement transferBooks function with transaction
    - Use Prisma transaction for atomicity
    - Update book ownership (userId)
    - Mark books as available
    - Create audit log entries

    - Release book locks
    - Update trade status
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.5_

  - [ ] 2.4 Implement rollback error handling
    - Catch transaction errors
    - Return detailed error information
    - Ensure no partial state changes
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 2.5 Write property test for book transfer completeness
    - **Property 2: Trade book transfer completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 2.6 Write property test for transfer atomicity
    - **Property 3: Trade transfer atomicity**
    - **Validates: Requirements 4.1, 4.2, 4.5**

  - [ ]* 2.7 Write property test for book ownership update
    - **Property 4: Book ownership update**
    - **Validates: Requirements 3.3, 3.4, 3.5**


  - [ ]* 2.8 Write property test for book availability after trade
    - **Property 5: Book availability after trade**
    - **Validates: Requirements 3.6, 7.4**

- [ ] 3. Backend: Update trade accept endpoint
  - [x] 3.1 Update POST /trades/:id/accept endpoint

    - Import bookTransfer service
    - Call transferBooks on acceptance
    - Handle transfer errors
    - Return detailed success/error response

    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ] 3.2 Add notification creation on trade completion
    - Notify both users of successful trade
    - Include book details in notification
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [ ] 3.3 Add error notification on trade failure
    - Notify both users if transfer fails

    - Include error details
    - _Requirements: 4.4_

  - [ ]* 3.4 Write property test for lock release on completion
    - **Property 6: Lock release on trade completion**

    - **Validates: Requirements 3.7, 7.3**

- [-] 4. Backend: Fix counter-proposal endpoint

  - [ ] 4.1 Update POST /trades/:id/counter endpoint
    - Ensure proper book fetching logic
    - Validate book ownership for both users
    - Implement proposer swap logic
    - _Requirements: 2.1, 2.2, 8.3_

  - [ ] 4.2 Add lock management for counter-proposals
    - Release old locks before creating new ones
    - Create new locks for newly requested books
    - Handle lock creation failures


    - _Requirements: 8.4, 8.5_

  - [x]* 4.3 Write property test for proposer swap

    - **Property 9: Counter-proposal proposer swap**
    - **Validates: Requirements 8.3**

  - [ ]* 4.4 Write property test for lock management
    - **Property 10: Counter-proposal lock management**
    - **Validates: Requirements 8.4, 8.5**

- [ ] 5. Backend: Add book availability filtering
  - [ ] 5.1 Update GET /books endpoint
    - Add filtering for books in pending trades
    - Mark books as unavailable if in active trade
    - _Requirements: 7.1, 7.2_

  - [ ] 5.2 Update book queries to respect availability
    - Filter unavailable books from trade proposals
    - Filter unavailable books from room assignments
    - _Requirements: 7.1, 7.2, 10.2, 10.3_

  - [ ]* 5.3 Write property test for book unavailability
    - **Property 12: Book unavailability during pending trades**
    - **Validates: Requirements 7.1, 7.2**

- [ ] 6. Frontend: Fix counter-proposal modal
  - [x] 6.1 Update TradesPage counter-proposal modal



    - Fetch other user's inventory books
    - Fetch current user's inventory books
    - Display current trade state for reference
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 6.2 Update counter-proposal book selection UI



    - Show other user's books for requesting
    - Show current user's books for offering
    - Add visual distinction between offered/requested
    - Pre-populate current selections
    - _Requirements: 2.1, 2.2_

  - [ ] 6.3 Add validation for counter-proposal
    - Validate at least one book offered
    - Validate at least one book requested
    - Show clear error messages
    - _Requirements: 2.3, 2.4_

  - [ ] 6.4 Filter out unavailable books
    - Exclude locked books from selection
    - Exclude books in other trades
    - Show availability status
    - _Requirements: 2.5_

  - [ ]* 6.5 Write property test for counter-proposal visibility
    - **Property 1: Counter-proposal book visibility**
    - **Validates: Requirements 1.3, 1.4**



- [ ] 7. Frontend: Update trade completion UI
  - [ ] 7.1 Update TradesPage accept trade handler
    - Show loading state during transfer
    - Display success message with transferred books


    - Display error message on failure
    - Refresh trade list after completion
    - _Requirements: 3.1, 3.2, 3.8_

  - [ ] 7.2 Add trade completion confirmation modal
    - Show books that will be transferred
    - Require explicit confirmation
    - Show warning about irreversibility
    - _Requirements: 3.1, 3.2_

  - [ ] 7.3 Display trade history with book details
    - Show completed trades
    - Display transferred books
    - Show completion date and time
    - Show other party's name
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Frontend: Fix room book assignment
  - [x] 8.1 Update RoomDetailPage book filtering



    - Filter myBooks to inventory only
    - Exclude wishlist books from assignment options
    - Show only inventory books in "Available to Assign" section
    - _Requirements: 5.1, 5.2, 10.1_

  - [ ] 8.2 Update room book display
    - Show both inventory and wishlist in "Books in Room"
    - Filter by roomId correctly
    - _Requirements: 10.4, 10.5_

  - [ ] 8.3 Add validation for room assignment
    - Reject wishlist book assignments on client
    - Show error if user tries to assign wishlist book
    - _Requirements: 5.3_

  - [ ] 8.4 Exclude books in active trades from room assignment
    - Filter out books with active locks
    - Filter out books in pending trades
    - Show status indicator for unavailable books
    - _Requirements: 10.2, 10.3_

  - [ ]* 8.5 Write property test for room assignment filter
    - **Property 7: Room assignment inventory filter**
    - **Validates: Requirements 5.1, 5.2, 10.1**

  - [ ]* 8.6 Write property test for wishlist rejection
    - **Property 8: Wishlist book assignment rejection**
    - **Validates: Requirements 5.3**

- [ ] 9. Backend: Add room assignment validation
  - [ ] 9.1 Update PATCH /books/inventory/:id endpoint
    - Validate book is inventory type before room assignment
    - Reject wishlist books with clear error
    - _Requirements: 5.3_

  - [ ] 9.2 Update PATCH /books/wishlist/:id endpoint
    - Reject room assignment attempts
    - Return clear error message
    - _Requirements: 5.3_

- [ ] 10. Integration testing
  - [ ] 10.1 Test complete trade flow with book transfers
    - Create trade proposal
    - Accept trade
    - Verify books transferred
    - Verify audit logs created
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.1_

  - [ ] 10.2 Test counter-proposal flow
    - Create initial proposal
    - Open counter-proposal modal
    - Verify correct books displayed
    - Submit counter-proposal
    - Verify proposer swapped
    - Verify locks updated
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 8.3, 8.4, 8.5_

  - [ ] 10.3 Test room assignment filtering
    - View room detail page
    - Verify only inventory books shown for assignment
    - Attempt to assign wishlist book (should fail)
    - Verify books in trades excluded
    - _Requirements: 5.1, 5.2, 5.3, 10.1, 10.2, 10.3_

  - [ ] 10.4 Test trade failure rollback
    - Simulate database error during transfer
    - Verify no books transferred
    - Verify trade remains pending
    - Verify users notified
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
