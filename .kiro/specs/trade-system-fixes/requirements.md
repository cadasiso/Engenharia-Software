# Requirements Document

## Introduction

This specification addresses critical issues in the Bookswap trade system, focusing on counter-proposal functionality, trade completion with actual book swapping, and room book assignment restrictions. The current system allows trade negotiation but fails to complete the exchange and has bugs in the counter-proposal flow.

## Glossary

- **Trade Proposal**: An offer from one user to exchange specific books with another user
- **Counter-Proposal**: A modified trade proposal from the recipient, changing which books are offered/requested
- **Trade Completion**: The final step where books are actually transferred between user inventories
- **Book Lock**: A temporary reservation on a book during trade negotiation
- **Inventory Book**: A book a user owns and can trade
- **Wishlist Book**: A book a user wants to acquire
- **Room Assignment**: Designating a book as exclusive to a specific room's members
- **System**: The Bookswap application

## Requirements

### Requirement 1: Counter-Proposal Visibility

**User Story:** As a user receiving a trade proposal, I want to see the current state of the trade and all available books from the other user, so that I can make an informed counter-proposal.

#### Acceptance Criteria

1. WHEN a user views a trade proposal THEN the system SHALL display all books the proposer is offering
2. WHEN a user views a trade proposal THEN the system SHALL display all books the proposer is requesting from them
3. WHEN a user opens the counter-proposal modal THEN the system SHALL fetch and display all inventory books from the other user
4. WHEN a user opens the counter-proposal modal THEN the system SHALL display their own inventory books available for offering
5. WHEN a user opens the counter-proposal modal THEN the system SHALL pre-populate the current trade state for reference

### Requirement 2: Counter-Proposal Book Selection

**User Story:** As a user creating a counter-proposal, I want to select from all available books from both users, so that I can negotiate a fair trade.

#### Acceptance Criteria

1. WHEN a user counter-proposes THEN the system SHALL allow selection of any of their inventory books to offer
2. WHEN a user counter-proposes THEN the system SHALL allow selection of any of the other user's inventory books to request
3. WHEN a user counter-proposes THEN the system SHALL validate at least one book is offered
4. WHEN a user counter-proposes THEN the system SHALL validate at least one book is requested
5. WHEN a user counter-proposes THEN the system SHALL prevent selection of unavailable or locked books

### Requirement 3: Trade Completion with Book Swapping

**User Story:** As a user accepting a trade, I want the books to actually be exchanged between inventories, so that the trade is finalized and I receive the books I requested.

#### Acceptance Criteria

1. WHEN a trade is accepted THEN the system SHALL transfer offered books from proposer to recipient
2. WHEN a trade is accepted THEN the system SHALL transfer requested books from recipient to proposer
3. WHEN a trade is accepted THEN the system SHALL update book ownership in the database
4. WHEN a trade is accepted THEN the system SHALL remove traded books from original owners' inventories
5. WHEN a trade is accepted THEN the system SHALL add traded books to new owners' inventories
6. WHEN a trade is accepted THEN the system SHALL mark all traded books as available again
7. WHEN a trade is accepted THEN the system SHALL release all book locks associated with the trade
8. WHEN a trade is accepted THEN the system SHALL update the trade status to completed

### Requirement 4: Trade Completion Atomicity

**User Story:** As a user, I want trade completion to be atomic, so that partial failures don't result in lost books or inconsistent state.

#### Acceptance Criteria

1. WHEN a trade completion fails THEN the system SHALL roll back all book transfers
2. WHEN a trade completion fails THEN the system SHALL maintain original book ownership
3. WHEN a trade completion fails THEN the system SHALL keep the trade in pending status
4. WHEN a trade completion fails THEN the system SHALL notify both users of the failure
5. WHEN a trade completion succeeds THEN the system SHALL ensure all books are transferred or none are

### Requirement 5: Room Book Assignment Restrictions

**User Story:** As a user assigning books to a room, I want to only assign inventory books, so that room assignments make logical sense.

#### Acceptance Criteria

1. WHEN a user views books available for room assignment THEN the system SHALL only display inventory books
2. WHEN a user views books available for room assignment THEN the system SHALL exclude wishlist books
3. WHEN a user attempts to assign a wishlist book to a room THEN the system SHALL reject the operation
4. WHEN a user assigns an inventory book to a room THEN the system SHALL mark it as room-exclusive
5. WHEN a user removes a book from a room THEN the system SHALL return it to public inventory

### Requirement 6: Trade History and Audit Trail

**User Story:** As a user, I want to see a history of book ownership changes, so that I can track my trades and verify transfers.

#### Acceptance Criteria

1. WHEN a trade is completed THEN the system SHALL record the book transfer in an audit log
2. WHEN a user views their trade history THEN the system SHALL show all completed trades with book details
3. WHEN a user views a completed trade THEN the system SHALL show which books were exchanged
4. WHEN a user views a completed trade THEN the system SHALL show the date and time of completion
5. WHEN a user views a completed trade THEN the system SHALL show the other party's name

### Requirement 7: Book Availability During Trades

**User Story:** As a user with books in active trades, I want those books to be unavailable for other trades, so that I don't accidentally commit the same book to multiple trades.

#### Acceptance Criteria

1. WHEN a book is included in a pending trade THEN the system SHALL mark it as unavailable
2. WHEN a book is included in a pending trade THEN the system SHALL exclude it from new trade proposals
3. WHEN a trade is rejected or cancelled THEN the system SHALL mark involved books as available again
4. WHEN a trade is completed THEN the system SHALL mark transferred books as available under new ownership
5. WHEN a book lock expires THEN the system SHALL mark the book as available again

### Requirement 8: Counter-Proposal Notification

**User Story:** As a user who proposed a trade, I want to be notified when the other user counter-proposes, so that I can review and respond to the new terms.

#### Acceptance Criteria

1. WHEN a user counter-proposes THEN the system SHALL notify the original proposer
2. WHEN a user counter-proposes THEN the system SHALL update the trade status to show it's pending the original proposer's response
3. WHEN a user counter-proposes THEN the system SHALL swap the proposer role
4. WHEN a user counter-proposes THEN the system SHALL release old book locks
5. WHEN a user counter-proposes THEN the system SHALL create new book locks for the new requested books

### Requirement 9: Trade Proposal from Chat Integration

**User Story:** As a user proposing a trade from chat, I want to select specific books to offer and request, so that I can customize the trade to my needs.

#### Acceptance Criteria

1. WHEN a user clicks "Propose Trade" in chat THEN the system SHALL open the trade proposal modal
2. WHEN the trade proposal modal opens THEN the system SHALL fetch both users' inventory books
3. WHEN the trade proposal modal opens THEN the system SHALL allow multi-select for offered books
4. WHEN the trade proposal modal opens THEN the system SHALL allow multi-select for requested books
5. WHEN a user submits a trade proposal THEN the system SHALL create the trade with selected books

### Requirement 10: Room Book Filtering

**User Story:** As a user viewing room book assignment options, I want to see only my inventory books that aren't already assigned, so that I can easily find books to assign.

#### Acceptance Criteria

1. WHEN a user views available books for room assignment THEN the system SHALL filter to inventory books only
2. WHEN a user views available books for room assignment THEN the system SHALL exclude books already assigned to rooms
3. WHEN a user views available books for room assignment THEN the system SHALL exclude books in active trades
4. WHEN a user views books assigned to a room THEN the system SHALL show only books assigned to that specific room
5. WHEN a user views books assigned to a room THEN the system SHALL include both inventory and wishlist books already assigned
