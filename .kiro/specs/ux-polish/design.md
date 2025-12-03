# Design Document

## Overview

This design implements comprehensive UX polish across the Bookswap application, focusing on consistent feedback mechanisms, profile views, room management, and search functionality. All browser alerts are replaced with custom UI components, and loading states are added throughout.

## Architecture

### Component Hierarchy

```
App
├── Modal (global, reusable)
├── LoadingButton (reusable)
├── ProfileSummaryModal (new)
├── TradeProposalModal (new)
├── SearchInput (new)
└── Pages
    ├── MatchesPage (updated)
    ├── RoomsPage (updated)
    ├── RoomDetailPage (updated)
    ├── BooksPage (updated)
    ├── TradesPage (updated)
    └── ChatsPage (updated)
```

## Components and Interfaces

### ProfileSummaryModal

```typescript
interface ProfileSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  location: string;
  biography?: string;
  profilePictureUrl?: string;
  bookCounts: {
    inventory: number;
    wishlist: number;
  };
}
```

### TradeProposalModal

```typescript
interface TradeProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  userBooks: Book[];
  matchedUserBooks: Book[];
  existingProposal?: TradeProposal; // For counter-proposals
  onSubmit: (offeredBookIds: string[], requestedBookIds: string[]) => Promise<void>;
}
```

### SearchInput

```typescript
interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}
```

### Enhanced useModal Hook

```typescript
interface ModalOptions {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  onConfirm?: () => Promise<void>;
  confirmText?: string;
  cancelText?: string;
}

const useModal = () => {
  // ... existing implementation
  const showConfirmAsync = (options: ModalOptions) => Promise<boolean>;
  // Returns promise that resolves to true if confirmed, false if cancelled
};
```

## API Endpoints

### New Endpoints

```
GET    /api/users/:id/summary          - Get user profile summary
POST   /api/rooms/:id/leave            - Leave a room
GET    /api/users/:id/books/counts     - Get user's book counts
```

### Updated Endpoints

```
GET    /api/matches                    - Add query param: ?hasBooks=true
POST   /api/trades                     - Enhanced validation and feedback
```

## Data Models

No new database models required. Existing models support all functionality.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No browser alerts
*For any* user action that provides feedback, the system should use custom UI components, never browser alert/confirm/prompt
**Validates: Requirements 1.1**

### Property 2: Loading state consistency
*For any* button click that triggers an async operation, the button should show loading state and be disabled
**Validates: Requirements 8.1, 8.2**

### Property 3: Room exit book restoration
*For any* user leaving a room, all books assigned to that room should be returned to public inventory
**Validates: Requirements 3.4**

### Property 4: Match visibility requirements
*For any* user in the matching system, they should have at least one inventory book AND at least one wishlist book
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 5: Trade proposal validation
*For any* trade proposal submission, both offeredBookIds and requestedBookIds arrays must be non-empty
**Validates: Requirements 6.5**

### Property 6: Profile summary data completeness
*For any* profile summary displayed, it should include name, location, and book counts at minimum
**Validates: Requirements 4.3**

### Property 7: Search filter correctness
*For any* search query, filtered results should only include items where the name contains the query string (case-insensitive)
**Validates: Requirements 9.2, 10.2**

### Property 8: Trade proposal location
*For any* trade proposal action, it should only be accessible from an active chat, not from matches page
**Validates: Requirements 7.1, 7.2, 7.3**

## Error Handling

### Consistent Error Display

All errors use custom modals with:
- Clear error title
- Specific error message from backend
- Actionable next steps when applicable
- Close button

### Loading Timeout

- All async operations timeout after 30 seconds
- Show error modal with retry option
- Log timeout errors for debugging

### Network Errors

- Detect network failures
- Show "Connection lost" modal
- Provide retry button
- Cache failed requests for retry

## Testing Strategy

### Unit Tests

- ProfileSummaryModal rendering with various user data
- TradeProposalModal book selection logic
- SearchInput filtering logic
- Room leave functionality
- Book restoration on room exit

### Integration Tests

- Complete trade proposal flow from chat
- Room join/leave flow with book management
- Profile summary from multiple entry points
- Search functionality across pages

### Property-Based Tests

- Property 1: Scan all pages for alert() calls (should be zero)
- Property 2: Test random button clicks, verify loading states
- Property 3: Test random room exits, verify book restoration
- Property 4: Test random users, verify match visibility rules
- Property 5: Test random trade proposals, verify validation
- Property 6: Test random profile views, verify data completeness
- Property 7: Test random search queries, verify filter correctness
- Property 8: Test trade proposal access, verify chat requirement

## Implementation Notes

### Browser Alert Audit

Systematically search for:
- `alert(`
- `confirm(`
- `prompt(`
- `window.alert`
- `window.confirm`
- `window.prompt`

Replace all with custom modal calls.

### Loading Button Pattern

Standard pattern for all action buttons:
```typescript
<LoadingButton
  onClick={async () => {
    await performAction();
    showModal('Success', 'Action completed', 'success');
  }}
  className="..."
  loadingText="Processing..."
>
  Action Text
</LoadingButton>
```

### Profile Summary Pattern

Standard pattern for clickable user names:
```typescript
<button
  onClick={() => setSelectedUserId(user.id)}
  className="hover:text-blue-600 hover:underline"
>
  {user.name}
</button>

<ProfileSummaryModal
  isOpen={!!selectedUserId}
  onClose={() => setSelectedUserId(null)}
  userId={selectedUserId}
/>
```

### Search Pattern

Standard pattern for search inputs:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const filteredItems = items.filter(item =>
  item.name.toLowerCase().includes(searchQuery.toLowerCase())
);

<SearchInput
  placeholder="Search..."
  value={searchQuery}
  onChange={setSearchQuery}
/>
```

## Performance Considerations

- Debounce search inputs (300ms)
- Cache profile summaries for 5 minutes
- Lazy load profile pictures
- Virtualize long lists (>50 items)
- Memoize filtered results

## Security Considerations

- Validate user permissions before showing profile data
- Sanitize search queries to prevent XSS
- Rate limit profile summary requests
- Verify room membership before allowing exit
- Validate book ownership before restoration
