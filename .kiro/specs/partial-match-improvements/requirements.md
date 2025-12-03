# Requirements Document

## Introduction

This specification addresses improvements to the partial match system in the Bookswap application. Currently, partial matches (where only one user has books the other wants) have inconsistent behavior for chat initiation and trade proposals. This spec defines a proper request-based system for non-privileged users and flexible trade proposals for privileged users.

## Glossary

- **Partial Match**: A match where only one user has books the other user wants (asymmetric match)
- **Privileged User**: The user who has books that the other user wants (partial_type2)
- **Non-Privileged User**: The user who wants books from the other user but has nothing they want (partial_type1)
- **Chat Request**: A request sent by a non-privileged user to initiate conversation with a privileged user
- **System**: The Bookswap application
- **Trade Proposal**: An offer to exchange specific books between two users

## Requirements

### Requirement 1: Chat Request System for Partial Matches

**User Story:** As a non-privileged user in a partial match, I want to send a chat request to the privileged user, so that I can express interest without forcing unwanted communication.

#### Acceptance Criteria

1. WHEN a non-privileged user (partial_type1) attempts to initiate chat THEN the system SHALL create a chat request instead of a direct chat
2. WHEN a chat request is created THEN the system SHALL notify the privileged user
3. WHEN a privileged user views their notifications THEN the system SHALL display pending chat requests with requester information
4. WHEN a privileged user accepts a chat request THEN the system SHALL create a chat between both users and mark the request as accepted
5. WHEN a privileged user rejects a chat request THEN the system SHALL mark the request as rejected and notify the requester
6. WHEN a non-privileged user has a pending chat request THEN the system SHALL display the pending status and prevent duplicate requests

### Requirement 2: Direct Chat Initiation for Privileged Users

**User Story:** As a privileged user in a partial match, I want to initiate chat directly, so that I can respond to interest in my books without waiting for requests.

#### Acceptance Criteria

1. WHEN a privileged user (partial_type2) initiates chat THEN the system SHALL create the chat immediately without requiring acceptance
2. WHEN a privileged user initiates chat THEN the system SHALL notify the non-privileged user
3. WHEN a chat is created by a privileged user THEN the system SHALL mark any pending chat requests as accepted automatically

### Requirement 3: Perfect Match Chat Initiation

**User Story:** As a user in a perfect match, I want both parties to agree before chat starts, so that both users are ready to communicate.

#### Acceptance Criteria

1. WHEN a user in a perfect match initiates chat THEN the system SHALL create a chat request
2. WHEN both users in a perfect match have initiated chat THEN the system SHALL create the chat automatically
3. WHEN only one user has initiated chat THEN the system SHALL display "waiting for other user" status
4. WHEN the second user initiates chat THEN the system SHALL notify both users that chat is ready

### Requirement 4: Flexible Trade Proposals for Privileged Users

**User Story:** As a privileged user, I want to request any books from the non-privileged user's inventory, so that I can propose fair exchanges even when they don't have my wishlist items.

#### Acceptance Criteria

1. WHEN a privileged user creates a trade proposal THEN the system SHALL allow selecting any books from the other user's inventory as requested books
2. WHEN a privileged user creates a trade proposal THEN the system SHALL allow selecting their own books as offered books
3. WHEN a trade proposal is created THEN the system SHALL lock the requested books for 48 hours
4. WHEN a non-privileged user views a trade proposal THEN the system SHALL display all offered and requested books clearly
5. WHEN a non-privileged user accepts a trade proposal THEN the system SHALL mark the trade as accepted and maintain the locks

### Requirement 5: Trade Counter-Proposals for Non-Privileged Users

**User Story:** As a non-privileged user receiving a trade proposal, I want to counter-propose with different books, so that I can negotiate a fair exchange.

#### Acceptance Criteria

1. WHEN a non-privileged user counter-proposes THEN the system SHALL allow selecting any of their books as offered books
2. WHEN a non-privileged user counter-proposes THEN the system SHALL allow selecting any of the privileged user's books as requested books
3. WHEN a counter-proposal is created THEN the system SHALL release old locks and create new locks for the new requested books
4. WHEN a counter-proposal is created THEN the system SHALL swap the proposer role
5. WHEN a counter-proposal is created THEN the system SHALL notify the original proposer

### Requirement 6: Loading States and User Feedback

**User Story:** As a user performing actions, I want to see loading indicators, so that I know my actions are being processed.

#### Acceptance Criteria

1. WHEN a user clicks a button that triggers an API call THEN the system SHALL display a loading indicator on that button
2. WHEN a user clicks a button that triggers an API call THEN the system SHALL disable the button to prevent duplicate submissions
3. WHEN an API call completes successfully THEN the system SHALL hide the loading indicator and show success feedback
4. WHEN an API call fails THEN the system SHALL hide the loading indicator and show error feedback
5. WHEN a modal confirmation is processing THEN the system SHALL show a spinner and "Processing..." text

### Requirement 7: Chat Request Notifications

**User Story:** As a user, I want to see notifications for chat requests, so that I don't miss opportunities to connect.

#### Acceptance Criteria

1. WHEN a user receives a chat request THEN the system SHALL create a notification
2. WHEN a user views their notifications THEN the system SHALL display unread notifications prominently
3. WHEN a user clicks a chat request notification THEN the system SHALL navigate to the request management page
4. WHEN a chat request is accepted or rejected THEN the system SHALL mark the notification as read
5. WHEN a user has unread notifications THEN the system SHALL display a badge count in the navigation

### Requirement 8: Trade Proposal UI for Partial Matches

**User Story:** As a user creating a trade proposal in a partial match, I want a clear interface for selecting books, so that I can easily propose exchanges.

#### Acceptance Criteria

1. WHEN a user opens the trade proposal interface THEN the system SHALL display their books and the other user's books in separate sections
2. WHEN a user selects books to offer THEN the system SHALL highlight the selected books
3. WHEN a user selects books to request THEN the system SHALL highlight the selected books in a different color
4. WHEN a user submits a trade proposal THEN the system SHALL validate that at least one book is offered and one is requested
5. WHEN a trade proposal is invalid THEN the system SHALL display specific error messages using custom modals
