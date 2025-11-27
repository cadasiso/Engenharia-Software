import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

interface User {
  id: string;
  name: string;
  location: string;
  biography?: string;
  profilePictureUrl?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  createdAt: string;
}

interface Rating {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface UserRatings {
  averageRating: number;
  totalRatings: number;
  ratings: Rating[];
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  condition?: string;
  description?: string;
}

export const UsersPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Get search param from URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get('search') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inventory, setInventory] = useState<Book[]>([]);
  const [wishlist, setWishlist] = useState<Book[]>([]);
  const [userRatings, setUserRatings] = useState<UserRatings | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [localOnly, setLocalOnly] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      let url = `/users/search?query=${encodeURIComponent(searchQuery)}`;
      if (localOnly && user?.location) {
        url += `&location=${encodeURIComponent(user.location)}`;
      }
      const response = await api.get(url);
      setUsers(response.data);
    } catch (error) {
      alert('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search if there's an initial search term from URL
  React.useEffect(() => {
    if (initialSearch) {
      handleSearch();
    }
  }, []);

  const handleViewUser = async (selectedUser: User) => {
    try {
      setSelectedUser(selectedUser);
      
      const [invResponse, wishResponse, ratingsResponse] = await Promise.all([
        api.get(`/users/${selectedUser.id}/inventory`),
        api.get(`/users/${selectedUser.id}/wishlist`),
        api.get(`/users/${selectedUser.id}/ratings`),
      ]);

      setInventory(invResponse.data);
      setWishlist(wishResponse.data);
      setUserRatings(ratingsResponse.data);
      setShowModal(true);
    } catch (error) {
      alert('Failed to load user details');
    }
  };

  const getProfilePictureUrl = (user: User) => {
    if (user.profilePictureUrl) {
      return `${import.meta.env.VITE_API_URL}${user.profilePictureUrl}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=80&background=random`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
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
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
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
                className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Users</h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localOnly}
                onChange={(e) => setLocalOnly(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Search only in my location ({user?.location})
              </span>
            </label>
          </div>
        </form>

        {users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
              <div key={u.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={getProfilePictureUrl(u)}
                    alt={u.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{u.name}</h3>
                    <p className="text-sm text-gray-600">📍 {u.location}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Member since {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {u.biography && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{u.biography}</p>
                )}
                <button
                  onClick={() => handleViewUser(u)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  View Full Profile
                </button>
              </div>
            ))}
          </div>
        )}

        {users.length === 0 && searchQuery && !isSearching && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No users found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header with Profile Picture */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-4 flex-1">
                <img
                  src={getProfilePictureUrl(selectedUser)}
                  alt={selectedUser.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-gray-600">📍 {selectedUser.location}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Member since {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                  {userRatings && userRatings.totalRatings > 0 && (
                    <div className="mt-2">
                      {renderStars(userRatings.averageRating)}
                      <p className="text-xs text-gray-500 mt-1">
                        {userRatings.totalRatings} rating{userRatings.totalRatings !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                  {selectedUser.biography && (
                    <p className="text-gray-700 mt-3">{selectedUser.biography}</p>
                  )}
                  {/* Social Links */}
                  {selectedUser.socialLinks && (
                    <div className="flex gap-3 mt-3">
                      {selectedUser.socialLinks.twitter && (
                        <span className="text-sm text-blue-600">🐦 {selectedUser.socialLinks.twitter}</span>
                      )}
                      {selectedUser.socialLinks.instagram && (
                        <span className="text-sm text-pink-600">📷 {selectedUser.socialLinks.instagram}</span>
                      )}
                      {selectedUser.socialLinks.facebook && (
                        <span className="text-sm text-blue-700">👤 Facebook</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                  setUserRatings(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Books Section with Horizontal Scrolling */}
            <div className="space-y-6">
              {/* Inventory */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Inventory ({inventory.length})
                </h3>
                {inventory.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-3">
                    {inventory.map((book) => (
                      <div key={book.id} className="flex-shrink-0 w-48 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-900 text-sm line-clamp-2">{book.title}</p>
                        <p className="text-xs text-gray-600 mt-1">by {book.author}</p>
                        {book.condition && (
                          <p className="text-xs text-gray-500 mt-1">Condition: {book.condition}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No books in inventory</p>
                )}
              </div>

              {/* Wishlist */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Wishlist ({wishlist.length})
                </h3>
                {wishlist.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-3">
                    {wishlist.map((book) => (
                      <div key={book.id} className="flex-shrink-0 w-48 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-900 text-sm line-clamp-2">{book.title}</p>
                        <p className="text-xs text-gray-600 mt-1">by {book.author}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No books in wishlist</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
