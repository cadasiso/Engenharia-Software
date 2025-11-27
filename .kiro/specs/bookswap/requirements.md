# Requirements Document

## Introduction

Bookswap is a web-based platform that facilitates physical book exchanges between users in close geographic proximity. The system matches users based on their book inventories (books they have available for exchange) and wish lists (books they want), creating perfect matches (mutual wants) and partial matches (one-way wants). Users can communicate through chat, coordinate meeting details through a proposal system, and complete exchanges with automatic inventory updates and rating capabilities. The platform organizes users by location and provides public genre-based rooms and private community rooms with admin-controlled access.

## Glossary

- **Bookswap System**: The web application that manages user profiles, book inventories, matching, chat, and exchange coordination
- **User**: A registered person with a profile containing location, available books, and wanted books
- **Location**: A geographic area that groups users and serves as a special type of room
- **Book Inventory**: The collection of books a User has available for exchange
- **Wish List**: The collection of books a User wants to acquire
- **Perfect Match**: A pairing where User A has a book User B wants AND User B has a book User A wants
- **Partial Match (Type 1)**: A pairing where another User has a book the current User wants, but the current User has no books the other User wants
- **Partial Match (Type 2)**: A pairing where the current User has a book another User wants, but the other User has no books the current User wants
- **Public Room**: A genre-based or topic-based room visible to all Users in a Location
- **Private Room**: A community-specific room (e.g., university) with admin-controlled entrance
- **Room Admin**: A User with permissions to manage entrance to a Private Room
- **Meeting Proposal**: A suggested meeting place and time for a book exchange
- **Trade**: A completed book exchange between two Users
- **Rating**: A User's evaluation of their exchange experience with another User
- **ISBN**: International Standard Book Number, a unique identifier for books
- **Book Condition**: The physical state of a book (e.g., used, very used, nearly new, new)
- **Notification**: A system message alerting a User to events such as new matches, chat messages, or meeting proposals

## Requirements

### Requirement 1

**User Story:** As a new user, I want to register and create a profile with my location and book information, so that I can participate in book exchanges.

#### Acceptance Criteria

1. WHEN a new user provides their name, password, and location, THE Bookswap System SHALL create a user account
2. WHEN a User adds books to their Book Inventory, THE Bookswap System SHALL store the books as available for exchange
3. WHEN a User adds books to their Wish List, THE Bookswap System SHALL store the books as wanted for acquisition
4. WHEN a User updates their profile information, THE Bookswap System SHALL persist the changes immediately
5. THE Bookswap System SHALL require name, password, and location as mandatory fields for account creation

### Requirement 2

**User Story:** As a user, I want to enhance my profile with personal information and media, so that other users can learn more about me and build trust.

#### Acceptance Criteria

1. WHEN a User uploads a profile picture, THE Bookswap System SHALL store and display the image on the User's profile
2. WHEN a User adds a biography, THE Bookswap System SHALL display the biography text on the User's profile
3. WHEN a User adds social media links, THE Bookswap System SHALL store and display the links on the User's profile
4. WHERE a User has not provided a profile picture, THE Bookswap System SHALL display a default placeholder image
5. THE Bookswap System SHALL allow Users to view profile pictures, biographies, and social media links as optional fields

### Requirement 3

**User Story:** As a user, I want to add detailed information about my books including photos and condition, so that potential exchange partners know what to expect.

#### Acceptance Criteria

1. WHEN a User adds a book to their Book Inventory, THE Bookswap System SHALL allow the User to upload photos of the book
2. WHEN a User adds a book to their Book Inventory, THE Bookswap System SHALL require the User to specify a Book Condition
3. WHEN a User adds a book to their Book Inventory, THE Bookswap System SHALL allow the User to add a short description
4. WHEN a User views another User's book, THE Bookswap System SHALL display the photos, Book Condition, and description
5. WHERE a User has not provided book photos, THE Bookswap System SHALL display a default book cover image

### Requirement 4

**User Story:** As a user, I want to add books using ISBN or with autocomplete assistance, so that I can avoid typos and ensure accurate matching.

#### Acceptance Criteria

1. WHEN a User enters an ISBN for a book, THE Bookswap System SHALL use the ISBN as the book identifier
2. WHEN a User types a book title, THE Bookswap System SHALL provide autocomplete suggestions using the Google Books API
3. WHEN the Bookswap System matches books, THE Bookswap System SHALL treat books with the same ISBN as identical regardless of title variations
4. WHEN a User selects a book from autocomplete, THE Bookswap System SHALL populate book metadata automatically
5. THE Bookswap System SHALL allow Users to add books either by ISBN or by title search

### Requirement 5

**User Story:** As a user, I want to manage my book collection by removing or marking books as unavailable, so that my inventory stays current.

#### Acceptance Criteria

1. WHEN a User removes a book from their Book Inventory, THE Bookswap System SHALL delete the book and recalculate matches
2. WHEN a User removes a book from their Wish List, THE Bookswap System SHALL delete the book and recalculate matches
3. WHEN a User marks a book as temporarily unavailable, THE Bookswap System SHALL exclude the book from matching
4. WHEN a User marks a temporarily unavailable book as available again, THE Bookswap System SHALL include the book in matching
5. WHEN a book's availability status changes, THE Bookswap System SHALL update all affected matches immediately

### Requirement 6

**User Story:** As a user, I want to authenticate securely to access my account, so that my profile and book information remain protected.

#### Acceptance Criteria

1. WHEN a User provides valid credentials, THE Bookswap System SHALL grant access to the User's account
2. WHEN a User provides invalid credentials, THE Bookswap System SHALL deny access and display an error message
3. WHEN a User logs out, THE Bookswap System SHALL terminate the User's session
4. WHEN a User requests a password reset, THE Bookswap System SHALL provide a secure mechanism to reset the password
5. THE Bookswap System SHALL require authentication before allowing access to profile and matching features

### Requirement 7

**User Story:** As a user, I want the system to match me with other users based on our books and location, so that I can find potential exchange partners.

#### Acceptance Criteria

1. WHEN the Bookswap System generates matches for a User, THE Bookswap System SHALL only include Users from the same Location
2. WHEN User A has a book that User B wants AND User B has a book that User A wants, THE Bookswap System SHALL classify this as a Perfect Match
3. WHEN another User has a book the current User wants but the current User has no books the other User wants, THE Bookswap System SHALL classify this as a Partial Match (Type 1)
4. WHEN the current User has a book another User wants but the other User has no books the current User wants, THE Bookswap System SHALL classify this as a Partial Match (Type 2)
5. WHEN a User views their matches, THE Bookswap System SHALL display Perfect Matches more prominently than Partial Matches

### Requirement 8

**User Story:** As a user, I want to see which of my books have potential matches, so that I can understand my exchange opportunities.

#### Acceptance Criteria

1. WHEN a User views a specific book in their Book Inventory, THE Bookswap System SHALL display all Users who want that book
2. WHEN a User views a specific book in their Wish List, THE Bookswap System SHALL display all Users who have that book available
3. WHEN displaying book-specific matches, THE Bookswap System SHALL include the match type (Perfect, Partial Type 1, or Partial Type 2)

### Requirement 9

**User Story:** As a user, I want to manage my matches by removing individual matches or clearing all matches, so that I can focus on exchanges I'm interested in.

#### Acceptance Criteria

1. WHEN a User removes an individual match, THE Bookswap System SHALL hide that match from the User's match list
2. WHEN a User removes all matches, THE Bookswap System SHALL clear the User's entire match list
3. WHEN a User removes a match, THE Bookswap System SHALL not affect the other User's view of matches
4. WHEN a User removes a match, THE Bookswap System SHALL allow the match to reappear if the User manually refreshes matches
5. THE Bookswap System SHALL persist removed matches to prevent them from reappearing automatically

### Requirement 10

**User Story:** As a user, I want to filter and sort my matches, so that I can quickly find the most relevant exchange opportunities.

#### Acceptance Criteria

1. WHEN a User applies a filter by book title, THE Bookswap System SHALL display only matches involving that book
2. WHEN a User applies a filter by user name, THE Bookswap System SHALL display only matches with that User
3. WHEN a User sorts matches by date, THE Bookswap System SHALL order matches from newest to oldest
4. WHEN a User sorts matches by number of books in common, THE Bookswap System SHALL order matches from most to fewest common books
5. THE Bookswap System SHALL allow Users to combine multiple filters and sorting options

### Requirement 11

**User Story:** As a user, I want to receive notifications about important events, so that I stay informed about matches, messages, and meeting proposals.

#### Acceptance Criteria

1. WHEN a new match is generated for a User, THE Bookswap System SHALL create a Notification for that User
2. WHEN a User receives a chat message, THE Bookswap System SHALL create a Notification for that User
3. WHEN a User receives a Meeting Proposal, THE Bookswap System SHALL create a Notification for that User
4. WHEN a User views a Notification, THE Bookswap System SHALL mark the Notification as read
5. WHEN a User views their notifications, THE Bookswap System SHALL display unread Notifications prominently

### Requirement 12

**User Story:** As a user, I want to join location-based and genre-based rooms, so that I can connect with other readers in my area and with similar interests.

#### Acceptance Criteria

1. WHEN a User registers with a Location, THE Bookswap System SHALL automatically add the User to that Location room
2. WHEN the Bookswap System creates a Location, THE Bookswap System SHALL generate Public Rooms for common book genres within that Location
3. WHEN a User views available Public Rooms in their Location, THE Bookswap System SHALL display all genre-based Public Rooms
4. THE Bookswap System SHALL make all Public Rooms visible to all Users in the same Location

### Requirement 13

**User Story:** As a community organizer, I want to create and manage private rooms with controlled access, so that I can facilitate exchanges within specific communities like universities or book clubs.

#### Acceptance Criteria

1. WHEN a Room Admin creates a Private Room, THE Bookswap System SHALL make the room visible but restrict entrance
2. WHEN a User requests to join a Private Room, THE Bookswap System SHALL notify the Room Admin
3. WHEN a Room Admin approves a User's request, THE Bookswap System SHALL grant the User access to the Private Room
4. WHEN a Room Admin denies a User's request, THE Bookswap System SHALL prevent the User from entering the Private Room
5. WHEN a Room Admin removes a User from a Private Room, THE Bookswap System SHALL revoke the User's access immediately

### Requirement 14

**User Story:** As a user, I want to initiate chat with potential exchange partners from my matches, so that I can discuss book conditions and arrange meeting details.

#### Acceptance Criteria

1. WHEN a User initiates chat from a match, THE Bookswap System SHALL create a chat conversation between the two Users
2. WHEN a User sends a message in a chat, THE Bookswap System SHALL deliver the message to the other User
3. WHEN a User views their chats, THE Bookswap System SHALL display all active conversations with other Users
4. THE Bookswap System SHALL persist chat history for future reference
5. THE Bookswap System SHALL only allow Users to initiate chat from their own match list

### Requirement 15

**User Story:** As a user, I want to propose and agree on meeting details with my exchange partner, so that we can coordinate our book exchange efficiently.

#### Acceptance Criteria

1. WHEN a User creates a Meeting Proposal with a place and time, THE Bookswap System SHALL send the proposal to the other User
2. WHEN the other User accepts a Meeting Proposal, THE Bookswap System SHALL lock the meeting details and mark them as confirmed
3. WHEN the other User rejects a Meeting Proposal, THE Bookswap System SHALL allow either User to create a new proposal
4. WHEN a Meeting Proposal is confirmed, THE Bookswap System SHALL display the locked meeting details to both Users
5. WHEN either User modifies a confirmed Meeting Proposal, THE Bookswap System SHALL require re-approval from both Users

### Requirement 16

**User Story:** As a user, I want to mark an exchange as completed and update our inventories automatically, so that our book collections stay accurate.

#### Acceptance Criteria

1. WHEN both Users confirm a Trade is complete, THE Bookswap System SHALL remove the exchanged books from each User's Book Inventory
2. WHEN a Trade is completed, THE Bookswap System SHALL add the received books to each User's Book Inventory
3. WHEN a Trade is completed, THE Bookswap System SHALL remove the received books from each User's Wish List
4. WHEN inventory updates occur, THE Bookswap System SHALL recalculate matches for both Users
5. THE Bookswap System SHALL require confirmation from both Users before executing inventory updates

### Requirement 17

**User Story:** As a user, I want to rate my exchange experience and report problematic users, so that I can contribute to a trustworthy community.

#### Acceptance Criteria

1. WHEN a Trade is completed, THE Bookswap System SHALL prompt both Users to provide a Rating
2. WHEN a User submits a Rating, THE Bookswap System SHALL associate the Rating with the other User's profile
3. WHEN a User views another User's profile, THE Bookswap System SHALL display the aggregate Rating score
4. WHEN a User reports another User, THE Bookswap System SHALL record the report with details
5. WHEN a User submits a report, THE Bookswap System SHALL make the report available for review by system administrators
