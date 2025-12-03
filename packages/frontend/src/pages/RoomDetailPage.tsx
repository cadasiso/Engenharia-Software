import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProfileSummaryModal } from '../components/ProfileSummaryModal';
import { LoadingButton } from '../components/LoadingButton';
import { SearchInput } from '../components/SearchInput';
import { Modal } from '../components/Modal';
import { useModal } from '../hooks/useModal';
import { api } from '../lib/api';

interface Room {
  id: string;
  name: string;
  type: string;
  genre?: string;
  location: string;
  adminIds: string[];
}

interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  condition?: string;
  description?: string;
  listType: 'inventory' | 'wishlist';
  roomId?: string;
}

export const RoomDetailPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [roomBooks, setRoomBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const { modalState, showModal, showConfirm, closeModal } = useModal();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  const parseBookDescription = (book: Book): Book => {
    try {
      const parsed = JSON.parse(book.description || '{}');
      if (parsed.roomId) {
        return {
          ...book,
          description: parsed.text || '',
          roomId: parsed.roomId,
        };
      }
    } catch {
      // Not JSON, return as-is
    }
    return book;
  };

  const fetchRoomDetails = async () => {
    try {
      setIsLoading(true);
      const [roomRes, membersRes, myBooksRes, roomBooksRes] = await Promise.all([
        api.get(`/rooms/${roomId}/details`),
        api.get(`/rooms/${roomId}/members`),
        api.get(`/books?scope=not-room&roomId=${roomId}`), // My books NOT in this room
        api.get(`/books?roomId=${roomId}`), // Books assigned to this room
      ]);

      setRoom(roomRes.data);
      setMembers(membersRes.data);
      // Parse descriptions to extract text from JSON
      // Filter to only inventory books for room assignment
      const inventoryBooks = myBooksRes.data
        .filter((b: Book) => b.listType === 'inventory')
        .map(parseBookDescription);
      setMyBooks(inventoryBooks);
      setRoomBooks(roomBooksRes.data.map(parseBookDescription));
    } catch (error) {
      showToast('Failed to load room details', 'error');
      navigate('/rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToRoom = async (bookId: string) => {
    try {
      const book = myBooks.find(b => b.id === bookId);
      if (!book) return;

      const endpoint = book.listType === 'inventory' ? `/books/inventory/${bookId}` : `/books/wishlist/${bookId}`;
      await api.patch(endpoint, {
        roomId: roomId,
        description: book.description,
      });

      showToast('Book assigned to room!', 'success');
      fetchRoomDetails();
    } catch (error) {
      showToast('Failed to assign book', 'error');
    }
  };

  const handleUnassignFromRoom = async (bookId: string) => {
    try {
      const book = roomBooks.find(b => b.id === bookId);
      if (!book) {
        console.log('Book not found in roomBooks:', bookId);
        return;
      }

      console.log('Unassigning book:', book);
      const endpoint = book.listType === 'inventory' ? `/books/inventory/${bookId}` : `/books/wishlist/${bookId}`;
      
      // Don't pass roomId at all to remove room assignment
      const payload = { description: book.description };
      console.log('Sending PATCH to:', endpoint, 'with payload:', payload);
      
      const response = await api.patch(endpoint, payload);
      console.log('PATCH response:', response.data);

      showToast('Book removed from room!', 'success');
      fetchRoomDetails();
    } catch (error) {
      console.error('Unassign error:', error);
      showToast('Failed to remove book', 'error');
    }
  };

  const getProfilePictureUrl = (member: Member) => {
    if (member.user.profilePictureUrl) {
      return `${import.meta.env.VITE_API_URL}${member.user.profilePictureUrl}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name)}&size=40&background=random`;
  };

  const handleLeaveRoom = async () => {
    showConfirm(
      'Leave Room',
      'Are you sure you want to leave this room? Your books will be returned to your public inventory.',
      async () => {
        try {
          await api.post(`/rooms/${roomId}/leave`);
          showModal('Success', 'You have left the room', 'success');
          setTimeout(() => navigate('/rooms'), 1500);
        } catch (error: any) {
          showModal('Error', error.response?.data?.error || 'Failed to leave room', 'error');
        }
      }
    );
  };

  const isAdmin = room && user && room.adminIds.includes(user.id);
  const isMember = members.some(m => m.user.id === user?.id);

  // Filter members by search query
  const filteredMembers = members.filter((member) =>
    member.user.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-gray-900">
                Bookswap
              </Link>
              <Link to="/books" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                My Books
              </Link>
              <Link to="/matches" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Matches
              </Link>
              <Link to="/chats" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Chats
              </Link>
              <Link to="/rooms" className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                Rooms
              </Link>
              <Link to="/trades" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Trades
              </Link>
              <Link to="/users" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Users
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Profile
              </Link>
              <span className="text-gray-700">Welcome, {user?.name}!</span>
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Room Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
            <p className="text-gray-600 mt-1">
              {room.type === 'location' ? '🌐 Location Room' :
               room.type === 'public_genre' ? `📚 ${room.genre} Genre Room` :
               room.type === 'public_custom' ? '🌐 Public Custom Room' :
               '🔒 Private Room'}
            </p>
          </div>
          <div className="flex gap-2">
            {isMember && !isAdmin && (
              <LoadingButton
                onClick={handleLeaveRoom}
                loadingText="Leaving..."
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Leave Room
              </LoadingButton>
            )}
            <button
              onClick={() => navigate('/rooms')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back to Rooms
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Members Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Members ({filteredMembers.length} of {members.length})
              </h2>
              <SearchInput
                placeholder="Search members..."
                value={memberSearchQuery}
                onChange={setMemberSearchQuery}
                className="mb-4"
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedUserId(member.user.id)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                    >
                      <img
                        src={getProfilePictureUrl(member)}
                        alt={member.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-900 truncate hover:text-blue-600">
                        {member.user.name}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No members found
                  </p>
                )}
              </div>
              
              <ProfileSummaryModal
                isOpen={!!selectedUserId}
                onClose={() => setSelectedUserId(null)}
                userId={selectedUserId}
              />
            </div>
          </div>

          {/* Books Management */}
          <div className="lg:col-span-3 space-y-6">
            {/* My Global Books - Available to Assign */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                My Books (Available to Assign)
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Click on a book to assign it to this room. Room-assigned books are only visible to room members.
              </p>
              {myBooks.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-3">
                  {myBooks.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => handleAssignToRoom(book.id)}
                      className="flex-shrink-0 w-56 p-4 bg-gray-50 rounded border-2 border-gray-200 hover:border-blue-500 cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-gray-900 text-sm line-clamp-2">{book.title}</p>
                      <p className="text-xs text-gray-600 mt-1">by {book.author}</p>
                      {book.condition && (
                        <p className="text-xs text-gray-500 mt-1">Condition: {book.condition}</p>
                      )}
                      <p className="text-xs text-blue-600 mt-2">Click to assign →</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No global books available. Add books from the Books page.</p>
              )}
            </div>

            {/* Room-Assigned Books */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Books in This Room
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                These books are exclusive to this room. Click to remove from room.
              </p>
              {roomBooks.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-3">
                  {roomBooks.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => handleUnassignFromRoom(book.id)}
                      className="flex-shrink-0 w-56 p-4 bg-blue-50 rounded border-2 border-blue-300 hover:border-red-500 cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-gray-900 text-sm line-clamp-2">{book.title}</p>
                      <p className="text-xs text-gray-600 mt-1">by {book.author}</p>
                      {book.condition && (
                        <p className="text-xs text-gray-500 mt-1">Condition: {book.condition}</p>
                      )}
                      <p className="text-xs text-red-600 mt-2">Click to remove ←</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No books assigned to this room yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
      />
    </div>
  );
};
