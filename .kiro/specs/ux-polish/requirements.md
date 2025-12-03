# Requirements Document

## Introduction

This specification addresses UX polish and consistency issues across the Bookswap application. The focus is on replacing browser alerts with custom UI, improving user feedback, adding profile views, and enhancing room management.

## Glossary

- **Browser Alert**: Native browser dialog (alert(), confirm(), prompt())
- **Custom Modal**: Application-styled modal dialog component
- **Loading State**: Visual feedback showing an operation is in progress
- **Profile Summary**: Quick view of user information without full navigation
- **Room Member**: User who has joined a room
- **System**: The Bookswap application

## Requirements

### Requirement 1: Replace All Browser Alerts with Custom UI

**User Story:** As a user, I want consistent, branded feedback for all actions, so that the application feels polished and professional.

#### Acceptance Criteria

1. WHEN any action triggers feedback THEN the system SHALL use custom modals or inline messages instead of browser alerts
2. WHEN a user performs an action THEN the system SHALL show loading states on buttons during processing
3. WHEN an action completes successfully THEN the system SHALL show success feedback using custom UI
4. WHEN an action fails THEN the system SHALL show error feedback using custom UI with specific error messages
5. WHEN a user needs to confirm an action THEN the system SHALL use custom confirmation modals instead of browser confirm()

### Requirement 2: Room Creation and Management Feedback

**User Story:** As a user creating or managing rooms, I want clear feedback for all actions, so that I know what's happening.

#### Acceptance Criteria

1. WHEN a user creates a room THEN the system SHALL show success feedback using a custom modal
2. WHEN a user joins a public room THEN the system SHALL show loading state on the join button and success feedback
3. WHEN a user requests to join a private room THEN the system SHALL show loading state and confirmation that request was sent
4. WHEN a room admin approves a join request THEN the system SHALL show success feedback using custom modal
5. WHEN a room admin toggles room privacy THEN the system SHALL show loading state and success/error feedback

### Requirement 3: Room Exit Functionality

**User Story:** As a room member, I want to leave rooms I've joined, so that I can manage my room memberships.

#### Acceptance Criteria

1. WHEN a user is a member of a room THEN the system SHALL display a "Leave Room" button
2. WHEN a user clicks "Leave Room" THEN the system SHALL show a confirmation modal
3. WHEN a user confirms leaving THEN the system SHALL remove them from the room and show success feedback
4. WHEN a user leaves a room THEN the system SHALL return any books assigned to that room back to public inventory
5. WHEN a user leaves a room THEN the system SHALL update the room member count immediately

### Requirement 4: Profile Summary Views

**User Story:** As a user viewing matches or room members, I want to click on names to see profile summaries, so that I can learn about other users quickly.

#### Acceptance Criteria

1. WHEN a user clicks on a match's name THEN the system SHALL display a profile summary modal
2. WHEN a user clicks on a room member's name THEN the system SHALL display a profile summary modal
3. WHEN a profile summary is displayed THEN the system SHALL show user's name, location, biography, and book counts
4. WHEN a profile summary is displayed THEN the system SHALL include a button to view full profile
5. WHEN a profile summary is displayed THEN the system SHALL include a button to close the modal

### Requirement 5: Match Visibility Requirements

**User Story:** As a user, I want to only see matches with users who have both inventory and wishlist books, so that matches are meaningful.

#### Acceptance Criteria

1. WHEN the matching algorithm runs THEN the system SHALL only include users who have at least one inventory book
2. WHEN the matching algorithm runs THEN the system SHALL only include users who have at least one wishlist book
3. WHEN a user has only inventory books THEN the system SHALL not show them in other users' matches
4. WHEN a user has only wishlist books THEN the system SHALL not show them in other users' matches
5. WHEN a user adds their first book to both lists THEN the system SHALL include them in matching

### Requirement 6: Trade Proposal UI Improvements

**User Story:** As a user proposing trades, I want to customize which books to offer and request, so that I can negotiate fairly.

#### Acceptance Criteria

1. WHEN a user initiates a trade from chat THEN the system SHALL open a trade proposal modal
2. WHEN the trade proposal modal opens THEN the system SHALL display user's books and matched user's books separately
3. WHEN a user selects books to offer THEN the system SHALL highlight them with a distinct color
4. WHEN a user selects books to request THEN the system SHALL highlight them with a different color
5. WHEN a user submits a trade proposal THEN the system SHALL validate at least one book is offered and one is requested
6. WHEN validation fails THEN the system SHALL show specific error messages using custom modals
7. WHEN a trade proposal is submitted THEN the system SHALL show loading state and success feedback

### Requirement 7: Remove Trade Proposals from Matches Page

**User Story:** As a user viewing matches, I want to focus on initiating chat first, so that I can communicate before proposing trades.

#### Acceptance Criteria

1. WHEN a user views the matches page THEN the system SHALL not display "Propose Trade" buttons
2. WHEN a user views the matches page THEN the system SHALL only display chat initiation buttons
3. WHEN a user wants to propose a trade THEN the system SHALL require an active chat first
4. WHEN a user is in a chat THEN the system SHALL display the "Propose Trade" button
5. WHEN a user clicks "Propose Trade" in chat THEN the system SHALL open the trade proposal modal

### Requirement 8: Consistent Loading States

**User Story:** As a user performing actions, I want to see loading indicators, so that I know my actions are being processed.

#### Acceptance Criteria

1. WHEN a user clicks any action button THEN the system SHALL show a loading spinner on that button
2. WHEN a button is loading THEN the system SHALL disable the button to prevent duplicate submissions
3. WHEN a button is loading THEN the system SHALL change button text to indicate processing
4. WHEN an action completes THEN the system SHALL remove the loading state
5. WHEN multiple actions are available THEN the system SHALL only show loading on the clicked button

### Requirement 9: Room Member Search and Filtering

**User Story:** As a user viewing room members, I want to search for specific members, so that I can find users quickly in large rooms.

#### Acceptance Criteria

1. WHEN a user views room members THEN the system SHALL display a search input
2. WHEN a user types in the search input THEN the system SHALL filter members by name in real-time
3. WHEN no members match the search THEN the system SHALL display "No members found"
4. WHEN a user clears the search THEN the system SHALL show all members again
5. WHEN a user searches THEN the system SHALL highlight matching text in member names

### Requirement 10: Match User Search

**User Story:** As a user viewing matches, I want to search for specific matches, so that I can find users quickly.

#### Acceptance Criteria

1. WHEN a user views matches THEN the system SHALL display a search input
2. WHEN a user types in the search input THEN the system SHALL filter matches by user name in real-time
3. WHEN no matches are found THEN the system SHALL display "No matches found"
4. WHEN a user clears the search THEN the system SHALL show all matches again
5. WHEN a user searches THEN the system SHALL maintain match type grouping (perfect vs partial)

### Requirement 11: Books Page Alert Replacement

**User Story:** As a user managing books, I want consistent feedback, so that I know my actions succeeded or failed.

#### Acceptance Criteria

1. WHEN a user adds a book THEN the system SHALL show success feedback using custom modal
2. WHEN a user deletes a book THEN the system SHALL show confirmation modal before deletion
3. WHEN a user updates a book THEN the system SHALL show loading state and success feedback
4. WHEN a user assigns a book to a room THEN the system SHALL show success feedback
5. WHEN any book action fails THEN the system SHALL show error details using custom modal

### Requirement 12: Trades Page Alert Replacement

**User Story:** As a user managing trades, I want consistent feedback, so that I understand trade status changes.

#### Acceptance Criteria

1. WHEN a user accepts a trade THEN the system SHALL show confirmation modal before accepting
2. WHEN a user rejects a trade THEN the system SHALL show confirmation modal before rejecting
3. WHEN a user counter-proposes THEN the system SHALL open trade proposal modal with pre-filled data
4. WHEN a trade action completes THEN the system SHALL show success feedback using custom modal
5. WHEN a trade action fails THEN the system SHALL show error details using custom modal

### Requirement 13: Matches Page Alert Replacement

**User Story:** As a user managing matches, I want consistent feedback, so that I know when actions succeed.

#### Acceptance Criteria

1. WHEN a user hides a match THEN the system SHALL show confirmation modal before hiding
2. WHEN a user refreshes matches THEN the system SHALL show loading state on refresh button
3. WHEN matches refresh completes THEN the system SHALL show success feedback with match count
4. WHEN any match action fails THEN the system SHALL show error details using custom modal
5. WHEN a user sends a chat request THEN the system SHALL show success feedback using custom modal
