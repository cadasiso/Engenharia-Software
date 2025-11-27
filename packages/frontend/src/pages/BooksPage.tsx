import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { api } from '../lib/api';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  condition?: string;
  description?: string;
  isAvailable: boolean;
  listType: 'inventory' | 'wishlist';
  roomId?: string;
  roomName?: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
}

interface Match {
  id: string;
  matchType: string;
  matchedUser: {
    id: string;
    name: string;
  };
}

export const BooksPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'inventory' | 'wishlist'>('inventory');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [bookMatches, setBookMatches] = useState<Record<string, Match[]>>({});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editRoomId, setEditRoomId] = useState<string>('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [condition, setCondition] = useState('used');
  const [description, setDescription] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // First fetch rooms
      const roomsResponse = await api.get('/rooms');
      const memberRooms = roomsResponse.data.filter((room: any) => room.memberships.length > 0);
      setRooms(memberRooms);
      
      // Then fetch and parse books with room info
      const booksResponse = await api.get(`/books?listType=${activeTab}`);
      const parsedBooks = booksResponse.data.map((book: any) => parseBookDescription(book, memberRooms));
      setBooks(parsedBooks);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseBookDescription = (book: any, roomsList: Room[]): Book => {
    try {
      const parsed = JSON.parse(book.description || '{}');
      if (parsed.roomId) {
        const room = roomsList.find(r => r.id === parsed.roomId);
        return {
          ...book,
          description: parsed.text || '',
          roomId: parsed.roomId,
          roomName: room?.name || 'Unknown Room',
        };
      }
    } catch {
      // Not JSON, return as-is
    }
    return book;
  };

  const fetchBooks = async () => {
    try {
      const response = await api.get(`/books?listType=${activeTab}`);
      const parsedBooks = response.data.map((book: any) => parseBookDescription(book, rooms));
      setBooks(parsedBooks);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const endpoint = activeTab === 'inventory' ? '/books/inventory' : '/books/wishlist';
      const data: any = { title, author, isbn: isbn || undefined };

      if (activeTab === 'inventory') {
        data.condition = condition;
        data.description = description || undefined;
      }

      // Add roomId if selected
      if (selectedRoomId) {
        data.roomId = selectedRoomId;
      }

      await api.post(endpoint, data);

      // Reset form
      setTitle('');
      setAuthor('');
      setIsbn('');
      setCondition('used');
      setDescription('');
      setShowAddForm(false);

      // Refresh list
      fetchBooks();
      showToast('Book added successfully!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to add book', 'error');
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to remove this book?')) return;

    try {
      const endpoint =
        activeTab === 'inventory' ? `/books/inventory/${bookId}` : `/books/wishlist/${bookId}`;
      await api.delete(endpoint);
      fetchBooks();
      showToast('Book removed successfully', 'success');
    } catch (error) {
      showToast('Failed to remove book', 'error');
    }
  };

  const toggleAvailability = async (bookId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/books/inventory/${bookId}/availability`, {
        isAvailable: !currentStatus,
      });
      fetchBooks();
      showToast('Availability updated', 'success');
    } catch (error) {
      showToast('Failed to update availability', 'error');
    }
  };

  const handleUpdateBookRoom = async (bookId: string) => {
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      // Update the book with new room assignment
      const endpoint = activeTab === 'inventory' ? `/books/inventory/${bookId}` : `/books/wishlist/${bookId}`;
      await api.patch(endpoint, {
        roomId: editRoomId || null,
        description: book.description, // Preserve actual description text
      });

      setEditingBookId(null);
      fetchBooks();
      showToast('Book scope updated!', 'success');
    } catch (error) {
      showToast('Failed to update book scope', 'error');
    }
  };

  const toggleBookMatches = async (bookId: string) => {
    if (expandedBookId === bookId) {
      setExpandedBookId(null);
      return;
    }

    setExpandedBookId(bookId);

    // Fetch matches for this book if not already loaded
    if (!bookMatches[bookId]) {
      try {
        const response = await api.get(`/matches/book/${bookId}`);
        setBookMatches((prev) => ({ ...prev, [bookId]: response.data }));
      } catch (error) {
        showToast('Failed to load matches for this book', 'error');
      }
    }
  };

  const startChatFromBook = async (matchedUserId: string) => {
    try {
      await api.post('/chats', { matchedUserId });
      navigate('/chats');
      showToast('Chat started!', 'success');
    } catch (error) {
      showToast('Failed to start chat', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-gray-900">
                Bookswap
              </Link>
              <Link
                to="/books"
                className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                My Books
              </Link>
              <Link
                to="/matches"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Matches
              </Link>
              <Link
                to="/chats"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Chats
              </Link>
              <Link
                to="/rooms"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Rooms
              </Link>
              <Link
                to="/trades"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Trades
              </Link>
              <Link
                to="/users"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Users
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/profile"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </Link>
              <span className="text-gray-700">Welcome, {user?.name}!</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Books</h1>
          <p className="mt-2 text-gray-600">Manage your book inventory and wishlist</p>
        </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`${
              activeTab === 'inventory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            My Inventory
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`${
              activeTab === 'wishlist'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            My Wishlist
          </button>
        </nav>
      </div>

      {/* Add Book Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showAddForm ? 'Cancel' : `Add to ${activeTab === 'inventory' ? 'Inventory' : 'Wishlist'}`}
        </button>
      </div>

      {/* Add Book Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-medium mb-4">
            Add Book to {activeTab === 'inventory' ? 'Inventory' : 'Wishlist'}
          </h3>
          <form onSubmit={handleAddBook} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Author *</label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ISBN (optional)</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            {activeTab === 'inventory' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Condition *</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  >
                    <option value="new">New</option>
                    <option value="nearly_new">Nearly New</option>
                    <option value="used">Used</option>
                    <option value="very_used">Very Used</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility Scope
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              >
                <option value="">Global (visible to all in {user?.location})</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room: {room.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Room-exclusive books are only visible to members of that room
              </p>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Book
            </button>
          </form>
        </div>
      )}

      {/* Books List */}
      {isLoading ? (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-4">Loading books...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            No books in your {activeTab === 'inventory' ? 'inventory' : 'wishlist'} yet.
          </p>
          <p className="text-gray-400 text-sm mt-2">Click the button above to add your first book!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <div key={book.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-lg text-gray-900">{book.title}</h3>
              <p className="text-gray-600 text-sm">by {book.author}</p>
              {book.isbn && <p className="text-gray-500 text-xs mt-1">ISBN: {book.isbn}</p>}
              {book.condition && (
                <p className="text-gray-500 text-xs mt-1">
                  Condition: {book.condition.replace('_', ' ')}
                </p>
              )}
              {book.description && (
                <p className="text-gray-600 text-sm mt-2">{book.description}</p>
              )}
              {/* Room Assignment */}
              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                {editingBookId === book.id ? (
                  <div className="space-y-2">
                    <select
                      value={editRoomId}
                      onChange={(e) => setEditRoomId(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded"
                    >
                      <option value="">Global (all in {user?.location})</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateBookRoom(book.id)}
                        className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingBookId(null)}
                        className="flex-1 px-2 py-1 text-xs bg-gray-300 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-600">
                      📍 {book.roomName || `Global (${user?.location})`}
                    </p>
                    <button
                      onClick={() => {
                        setEditingBookId(book.id);
                        setEditRoomId(book.roomId || '');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  {activeTab === 'inventory' && (
                    <button
                      onClick={() => toggleAvailability(book.id, book.isAvailable)}
                      className={`flex-1 px-3 py-1 text-sm rounded ${
                        book.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {book.isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                  )}
                  <button
                    onClick={() => toggleBookMatches(book.id)}
                    className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    {expandedBookId === book.id ? 'Hide Matches' : 'View Matches'}
                  </button>
                  <button
                    onClick={() => handleRemoveBook(book.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>

                {/* Book-specific matches */}
                {expandedBookId === book.id && (
                  <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                    {bookMatches[book.id] ? (
                      bookMatches[book.id].length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            {bookMatches[book.id].length} match(es) for this book:
                          </p>
                          {bookMatches[book.id].map((match) => (
                            <div
                              key={match.id}
                              className="flex justify-between items-center p-2 bg-white rounded"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {match.matchedUser.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {match.matchType === 'perfect'
                                    ? '🎯 Perfect Match'
                                    : match.matchType === 'partial_type1'
                                    ? '📖 They have this'
                                    : '📚 They want this'}
                                </p>
                              </div>
                              <button
                                onClick={() => startChatFromBook(match.matchedUser.id)}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Chat
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No matches for this book yet</p>
                      )
                    ) : (
                      <p className="text-sm text-gray-500">Loading matches...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};
