import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chatStatuses, setChatStatuses] = useState<Record<string, any>>({});

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
      setIsRefreshing(true);
      const response = await api.post('/matches/refresh');
      setMatches(response.data.matches);
    } catch (error) {
      alert('Failed to refresh matches');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleHideMatch = async (matchId: string) => {
    try {
      await api.delete(`/matches/${matchId}`);
      setMatches(matches.filter((m) => m.id !== matchId));
    } catch (error) {
      alert('Failed to hide match');
    }
  };

  const handleInitiateTrade = async (match: Match) => {
    try {
      // Get book IDs from matching books
      const offeredBookIds = match.matchingBooks
        .filter((b) => b.userBookId)
        .map((b) => b.userBookId!);
      const requestedBookIds = match.matchingBooks
        .filter((b) => b.matchedUserBookId)
        .map((b) => b.matchedUserBookId!);

      console.log('Trade data:', { matchId: match.id, offeredBookIds, requestedBookIds });

      if (offeredBookIds.length === 0 || requestedBookIds.length === 0) {
        alert('Cannot initiate trade: missing book information');
        return;
      }

      const response = await api.post('/trades', {
        matchId: match.id,
        offeredBookIds,
        requestedBookIds,
      });

      const lockCount = response.data.locks?.length || 0;
      alert(`Trade proposed! ${lockCount} book(s) locked for 48 hours. Check the Trades page.`);
      navigate('/trades');
    } catch (error: any) {
      console.error('Trade initiation error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to initiate trade';
      if (error.response?.data?.lockedBookId) {
        alert(`${errorMsg}\n\nOne of the books is already locked for another trade.`);
      } else {
        alert(errorMsg);
      }
    }
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

  const perfectMatches = matches.filter((m) => m.matchType === 'perfect');
  const partialMatches = matches.filter((m) => m.matchType !== 'perfect');

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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Matches</h1>
            <p className="mt-2 text-gray-600">Find people to exchange books with</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Matches'}
          </button>
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
                    
                    let chatButtonText = 'Start Chat';
                    let chatButtonDisabled = false;
                    let chatButtonClass = 'flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700';
                    
                    if (chatStatus) {
                      if (chatStatus.status === 'active') {
                        chatButtonText = 'Open Chat';
                      } else if (chatStatus.status === 'waiting_for_other') {
                        chatButtonText = 'Waiting for them...';
                        chatButtonDisabled = true;
                        chatButtonClass = 'flex-1 px-4 py-2 text-sm bg-gray-400 text-white rounded cursor-not-allowed';
                      } else if (chatStatus.status === 'both_ready') {
                        chatButtonText = 'They\'re ready! Start Chat';
                        chatButtonClass = 'flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 animate-pulse';
                      }
                    }
                    
                    return (
                      <div key={match.id} className="bg-white p-6 rounded-lg shadow-md border-2 border-green-200">
                        <div className="flex justify-between items-start mb-4">
                          <div 
                            className="cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded transition-colors"
                            onClick={() => navigate(`/users?search=${match.matchedUser.name}`)}
                          >
                            <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                              {match.matchedUser.name} →
                            </h3>
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
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (chatStatus?.status === 'active') {
                                  navigate(`/chats/${chatStatus.chatId}`);
                                } else {
                                  try {
                                    await api.post('/chats', { matchedUserId: match.matchedUser.id });
                                    fetchMatches(); // Refresh to update status
                                  } catch (error: any) {
                                    alert(error.response?.data?.error || 'Failed to start chat');
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
                          <button
                            onClick={() => handleInitiateTrade(match)}
                            className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Propose Trade
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
                          <div 
                            className="cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded transition-colors"
                            onClick={() => navigate(`/users?search=${match.matchedUser.name}`)}
                          >
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                              {match.matchedUser.name} →
                            </h3>
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
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  await api.post('/chats', { matchedUserId: match.matchedUser.id });
                                  navigate('/chats');
                                } catch (error: any) {
                                  alert(error.response?.data?.error || 'Failed to start chat');
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
                          <button
                            onClick={() => handleInitiateTrade(match)}
                            className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Propose Trade
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
    </div>
  );
};
