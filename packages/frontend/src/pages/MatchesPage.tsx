import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { SearchInput } from '../components/SearchInput';
import { ProfileSummaryModal } from '../components/ProfileSummaryModal';
import { LoadingButton } from '../components/LoadingButton';
import { Modal } from '../components/Modal';
import { useModal } from '../hooks/useModal';

interface MatchingBook {
  userBookId?: string;
  matchedUserBookId?: string;
  bookTitle: string;
  bookAuthor: string;
}

interface Match {
  id: string;
  matchType: 'perfect' | 'partial_type1' | 'partial_type2';
  matchingBooks: MatchingBook[];
  matchedUser: {
    id: string;
    name: string;
    email: string;
    location: string;
  };
  createdAt: string;
}

export const MatchesPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatStatuses, setChatStatuses] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { modalState, showModal, showConfirm, closeModal } = useModal();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/matches');
      setMatches(response.data);
      
      // Fetch chat statuses for perfect matches
      const statuses: Record<string, any> = {};
      for (const match of response.data) {
        if (match.matchType === 'perfect') {
          try {
            const statusRes = await api.get(`/chats/status/${match.matchedUser.id}`);
            statuses[match.matchedUser.id] = statusRes.data;
          } catch (error) {
            console.error('Failed to fetch chat status:', error);
          }
        }
      }
      setChatStatuses(statuses);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const response = await api.post('/matches/refresh');
      setMatches(response.data.matches);
      showModal('Success', `Found ${response.data.matches.length} matches!`, 'success');
    } catch (error) {
      showModal('Error', 'Failed to refresh matches', 'error');
    }
  };

  const handleHideMatch = async (matchId: string) => {
    showConfirm(
      'Hide Match',
      'Are you sure you want to hide this match? You can refresh matches to see it again.',
      async () => {
        try {
          await api.delete(`/matches/${matchId}`);
          setMatches(matches.filter((m) => m.id !== matchId));
          showModal('Hidden', 'Match hidden successfully', 'success');
        } catch (error) {
          showModal('Error', 'Failed to hide match', 'error');
        }
      }
    );
  };



  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'perfect':
        return { label: 'Perfect Match', color: 'bg-green-100 text-green-800' };
      case 'partial_type1':
        return { label: 'They Have What You Want', color: 'bg-blue-100 text-blue-800' };
      case 'partial_type2':
        return { label: 'You Have What They Want', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'Match', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Filter matches by search query
  const filteredMatches = matches.filter((match) =>
    match.matchedUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const perfectMatches = filteredMatches.filter((m) => m.matchType === 'perfect');
  const partialMatches = filteredMatches.filter((m) => m.matchType !== 'perfect');

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
                className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Matches</h1>
              <p className="mt-2 text-gray-600">Find people to exchange books with</p>
            </div>
            <LoadingButton
              onClick={handleRefresh}
              loadingText="Refreshing..."
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh Matches
            </LoadingButton>
          </div>
          <SearchInput
            placeholder="Search matches by name..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No matches found yet.</p>
            <p className="text-gray-400 text-sm mb-4">
              Add books to your inventory and wishlist, then click "Refresh Matches" to find people to
              exchange with!
            </p>
            <Link
              to="/books"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Manage My Books
            </Link>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No matches found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Perfect Matches */}
            {perfectMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  🎯 Perfect Matches ({perfectMatches.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {perfectMatches.map((match) => {
                    const matchInfo = getMatchTypeLabel(match.matchType);
                    const chatStatus = chatStatuses[match.matchedUser.id];
                    
                    let chatButtonText = 'Request Chat';
                    let chatButtonDisabled = false;
                    let chatButtonClass = 'flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700';
                    
                    if (chatStatus) {
                      if (chatStatus.status === 'active') {
                        chatButtonText = 'Open Chat';
                      } else if (chatStatus.status === 'request_sent') {
                        chatButtonText = 'Waiting for them...';
                        chatButtonDisabled = true;
                        chatButtonClass = 'flex-1 px-4 py-2 text-sm bg-gray-400 text-white rounded cursor-not-allowed';
                      } else if (chatStatus.status === 'request_received') {
                        chatButtonText = 'Accept Chat Request';
                        chatButtonClass = 'flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700';
                      } else if (chatStatus.status === 'both_ready') {
                        chatButtonText = 'They\'re interested! Request Chat';
                        chatButtonClass = 'flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 animate-pulse';
                      } else if (chatStatus.status === 'can_initiate') {
                        chatButtonText = 'Request Chat';
                      }
                    }
                    
                    return (
                      <div key={match.id} className="bg-white p-6 rounded-lg shadow-md border-2 border-green-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <button
                              onClick={() => setSelectedUserId(match.matchedUser.id)}
                              className="text-xl font-semibold text-gray-900 hover:text-blue-600 hover:underline text-left"
                            >
                              {match.matchedUser.name}
                            </button>
                            <p className="text-gray-600 text-sm">{match.matchedUser.location}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${matchInfo.color}`}>
                            {matchInfo.label}
                          </span>
                        </div>
                        <div className="space-y-3 mb-4">
                          {/* Books you have that they want */}
                          {match.matchingBooks.filter(b => b.userBookId).length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-green-700 mb-1">📚 Books of their interest:</p>
                              <p className="text-xs text-gray-500 mb-1">(Your books they want)</p>
                              {match.matchingBooks
                                .filter(b => b.userBookId)
                                .map((book, idx) => (
                                  <div key={idx} className="text-sm text-gray-600 pl-2">
                                    • {book.bookTitle} by {book.bookAuthor}
                                  </div>
                                ))}
                            </div>
                          )}
                          
                          {/* Books they have that you want */}
                          {match.matchingBooks.filter(b => b.matchedUserBookId).length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-blue-700 mb-1">📖 Books of your interest:</p>
                              <p className="text-xs text-gray-500 mb-1">(Their books you want)</p>
                              {match.matchingBooks
                                .filter(b => b.matchedUserBookId)
                                .map((book, idx) => (
                                  <div key={idx} className="text-sm text-gray-600 pl-2">
                                    • {book.bookTitle} by {book.bookAuthor}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (chatStatus?.status === 'active') {
                                navigate(`/chats/${chatStatus.chatId}`);
                              } else if (chatStatus?.status === 'request_received') {
                                // Accept the chat request
                                try {
                                  await api.post(`/chat-requests/${chatStatus.requestId}/accept`);
                                  showModal('Success', 'Chat request accepted!', 'success');
                                  fetchMatches(); // Refresh to update status
                                } catch (error: any) {
                                  showModal('Error', error.response?.data?.error || 'Failed to accept request', 'error');
                                }
                              } else {
                                // Send chat request for perfect matches
                                try {
                                  await api.post('/chat-requests', { 
                                    recipientId: match.matchedUser.id,
                                    matchId: match.id 
                                  });
                                  showModal('Success', 'Chat request sent!', 'success');
                                  fetchMatches(); // Refresh to update status
                                } catch (error: any) {
                                  showModal('Error', error.response?.data?.error || 'Failed to send request', 'error');
                                }
                              }
                            }}
                            disabled={chatButtonDisabled}
                            className={chatButtonClass}
                          >
                            {chatButtonText}
                          </button>
                          <button
                            onClick={() => handleHideMatch(match.id)}
                            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Hide
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Partial Matches */}
            {partialMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Partial Matches ({partialMatches.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partialMatches.map((match) => {
                    const matchInfo = getMatchTypeLabel(match.matchType);
                    return (
                      <div key={match.id} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <button
                              onClick={() => setSelectedUserId(match.matchedUser.id)}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600 hover:underline text-left"
                            >
                              {match.matchedUser.name}
                            </button>
                            <p className="text-gray-600 text-sm">{match.matchedUser.location}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${matchInfo.color}`}>
                            {matchInfo.label}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm font-medium text-gray-700">Matching Books:</p>
                          {match.matchingBooks.map((book, idx) => (
                            <div key={idx} className="text-sm text-gray-600 pl-2">
                              • {book.bookTitle} by {book.bookAuthor}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await api.post('/chats', { matchedUserId: match.matchedUser.id });
                                showModal('Success', 'Chat request sent!', 'success');
                                navigate('/chats');
                              } catch (error: any) {
                                showModal('Error', error.response?.data?.error || 'Failed to start chat', 'error');
                              }
                            }}
                            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Start Chat
                          </button>
                          <button
                            onClick={() => handleHideMatch(match.id)}
                            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Hide
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ProfileSummaryModal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId || ''}
      />

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
