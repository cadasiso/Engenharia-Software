import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

interface Book {
  id: string;
  title: string;
  author: string;
  condition?: string;
}

interface Trade {
  id: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'rejected';
  proposerId: string;
  participant1: { id: string; name: string };
  participant2: { id: string; name: string };
  booksOffered: string[];
  booksRequested: string[];
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

interface Lock {
  id: string;
  bookId: string;
  expiresAt: string;
  durationHours: number;
  extensionHistory?: any[];
}

export const TradesPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [tradeLocks, setTradeLocks] = useState<Lock[]>([]);
  const [tradeBooks, setTradeBooks] = useState<{ offered: Book[]; requested: Book[] }>({
    offered: [],
    requested: [],
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionDetails, setCompletionDetails] = useState<{
    receivedBooks: Book[];
    givenBooks: Book[];
  } | null>(null);
  const [counterOffered, setCounterOffered] = useState<string[]>([]);
  const [counterRequested, setCounterRequested] = useState<string[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchTrades();
    fetchAvailableBooks();
  }, []);

  const fetchTrades = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/trades');
      setTrades(response.data);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      const response = await api.get('/books');
      const inventory = response.data.filter((b: any) => b.listType === 'inventory' && b.isAvailable);
      setAvailableBooks(inventory);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    }
  };

  const fetchTradeDetails = async (trade: Trade) => {
    try {
      setSelectedTrade(trade);

      // Fetch locks
      const locksRes = await api.get(`/trades/${trade.id}/locks`);
      setTradeLocks(locksRes.data);

      // Fetch book details
      const allBookIds = [...trade.booksOffered, ...trade.booksRequested];
      const booksPromises = allBookIds.map((id) => api.get(`/books/${id}`).catch(() => null));
      const booksResults = await Promise.all(booksPromises);
      const books = booksResults.filter((b) => b !== null).map((r) => r.data);

      const offered = books.filter((b) => trade.booksOffered.includes(b.id));
      const requested = books.filter((b) => trade.booksRequested.includes(b.id));

      setTradeBooks({ offered, requested });
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Failed to fetch trade details:', error);
      alert('Failed to load trade details');
    }
  };

  const handleAcceptTrade = async (tradeId: string) => {
    if (!confirm('Accept this trade proposal? Books will be transferred immediately.')) return;

    try {
      const response = await api.post(`/trades/${tradeId}/accept`);
      const { trade, transferResult } = response.data;
      
      // Determine which books the current user received
      const isProposerUser = trade.proposerId === user?.id;
      const receivedBooks = isProposerUser 
        ? transferResult.transferredBooks.toProposer 
        : transferResult.transferredBooks.toRecipient;
      const givenBooks = isProposerUser 
        ? transferResult.transferredBooks.toRecipient 
        : transferResult.transferredBooks.toProposer;
      
      // Show completion modal with details
      setCompletionDetails({ receivedBooks, givenBooks });
      setShowCompletionModal(true);
      setShowDetailsModal(false);
      
      // Refresh trades list
      fetchTrades();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to accept trade');
    }
  };

  const handleRejectTrade = async (tradeId: string) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      await api.post(`/trades/${tradeId}/reject`, { reason });
      alert('Trade rejected and book locks released');
      fetchTrades();
      setShowDetailsModal(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to reject trade');
    }
  };

  const handleCancelTrade = async (tradeId: string) => {
    if (!confirm('Cancel this trade?')) return;

    try {
      await api.delete(`/trades/${tradeId}`);
      alert('Trade cancelled');
      fetchTrades();
      setShowDetailsModal(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel trade');
    }
  };

  const handleExtendLock = async (tradeId: string) => {
    try {
      await api.post(`/trades/${tradeId}/extend-lock`, { additionalHours: 24 });
      alert('Lock extended by 24 hours');
      if (selectedTrade) {
        fetchTradeDetails(selectedTrade);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to extend lock');
    }
  };

  const openCounterModal = async (trade: Trade) => {
    try {
      setSelectedTrade(trade);
      
      // Fetch the OTHER user's inventory books (not just the ones in the current trade)
      const otherUser = getOtherUser(trade);
      const otherUserBooksRes = await api.get(`/users/${otherUser.id}/inventory`);
      
      // Update tradeBooks to show ALL of the other user's inventory books for requesting
      setTradeBooks({
        offered: otherUserBooksRes.data,
        requested: [], // Not needed for counter-proposal
      });
      
      // Pre-populate current trade state for reference
      // The current user is the recipient, so:
      // - booksRequested = what the proposer wants from current user (current user should offer these)
      // - booksOffered = what the proposer is offering to current user (current user should request these)
      setCounterOffered(trade.booksRequested || []); // What current user will offer
      setCounterRequested(trade.booksOffered || []); // What current user will request
      
      setShowCounterModal(true);
    } catch (error) {
      console.error('Failed to fetch books for counter-proposal:', error);
      alert('Failed to load books for counter-proposal');
    }
  };

  const handleCounterPropose = async () => {
    if (!selectedTrade) return;

    if (counterOffered.length === 0 || counterRequested.length === 0) {
      alert('Please select books to offer and request');
      return;
    }

    try {
      await api.post(`/trades/${selectedTrade.id}/counter`, {
        offeredBookIds: counterOffered,
        requestedBookIds: counterRequested,
      });
      alert('Counter-proposal sent!');
      setShowCounterModal(false);
      fetchTrades();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create counter-proposal');
    }
  };

  const getOtherUser = (trade: Trade) => {
    return trade.participant1.id === user?.id ? trade.participant2 : trade.participant1;
  };

  const isProposer = (trade: Trade) => {
    return trade.proposerId === user?.id;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 0) return 'Expired';
    if (hours === 0) return `${minutes}m remaining`;
    return `${hours}h ${minutes}m remaining`;
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
              <Link to="/books" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                My Books
              </Link>
              <Link to="/matches" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Matches
              </Link>
              <Link to="/chats" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Chats
              </Link>
              <Link to="/rooms" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Rooms
              </Link>
              <Link to="/trades" className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Trade Proposals</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading trades...</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No trade proposals yet.</p>
            <p className="text-gray-400 text-sm mb-4">Create a trade proposal from your matches page!</p>
            <Link to="/matches" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              View Matches
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => {
              const otherUser = getOtherUser(trade);
              const amProposer = isProposer(trade);

              return (
                <div key={trade.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {amProposer ? `Proposed to ${otherUser.name}` : `Proposal from ${otherUser.name}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(trade.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded ${getStatusColor(trade.status)}`}>
                      {trade.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        {amProposer ? "You're offering:" : "They're offering:"}
                      </h4>
                      <p className="text-sm text-gray-600">{trade.booksOffered.length} book(s)</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        {amProposer ? "You're requesting:" : "They're requesting:"}
                      </h4>
                      <p className="text-sm text-gray-600">{trade.booksRequested.length} book(s)</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchTradeDetails(trade)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      View Details
                    </button>

                    {trade.status === 'pending' && !amProposer && (
                      <>
                        <button
                          onClick={() => handleAcceptTrade(trade.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => openCounterModal(trade)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Counter-Propose
                        </button>
                        <button
                          onClick={() => handleRejectTrade(trade.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {trade.status === 'pending' && amProposer && (
                      <button
                        onClick={() => handleCancelTrade(trade.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trade Details Modal */}
        {showDetailsModal && selectedTrade && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Trade Details</h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Books Offered */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Books Offered</h3>
                  <div className="space-y-2">
                    {tradeBooks.offered.map((book) => (
                      <div key={book.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                        {book.condition && <p className="text-xs text-gray-500">Condition: {book.condition}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Books Requested */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Books Requested</h3>
                  <div className="space-y-2">
                    {tradeBooks.requested.map((book) => (
                      <div key={book.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                        {book.condition && <p className="text-xs text-gray-500">Condition: {book.condition}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Book Locks */}
                {tradeLocks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Book Locks</h3>
                    <div className="space-y-2">
                      {tradeLocks.map((lock) => (
                        <div key={lock.id} className="p-3 bg-yellow-50 rounded border border-yellow-200">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-900">
                              🔒 Lock expires: {formatTimeRemaining(lock.expiresAt)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Extensions: {lock.extensionHistory?.length || 0}/2
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedTrade.status === 'pending' && (
                      <button
                        onClick={() => handleExtendLock(selectedTrade.id)}
                        className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                      >
                        Extend Lock (+24h)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Counter-Propose Modal */}
        {showCounterModal && selectedTrade && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Counter-Propose</h2>
                <button onClick={() => setShowCounterModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Books to Offer</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableBooks.map((book) => (
                      <label key={book.id} className="flex items-center p-3 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={counterOffered.includes(book.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCounterOffered([...counterOffered, book.id]);
                            } else {
                              setCounterOffered(counterOffered.filter((id) => id !== book.id));
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{book.title}</p>
                          <p className="text-sm text-gray-600">by {book.author}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Books to Request</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {tradeBooks.offered.map((book) => (
                      <label key={book.id} className="flex items-center p-3 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={counterRequested.includes(book.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCounterRequested([...counterRequested, book.id]);
                            } else {
                              setCounterRequested(counterRequested.filter((id) => id !== book.id));
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{book.title}</p>
                          <p className="text-sm text-gray-600">by {book.author}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCounterPropose}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Send Counter-Proposal
                  </button>
                  <button
                    onClick={() => setShowCounterModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trade Completion Modal */}
        {showCompletionModal && completionDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Trade Completed! 🎉</h2>
                <p className="text-gray-600">Books have been successfully transferred</p>
              </div>

              <div className="space-y-6">
                {/* Books Received */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">📚 You Received:</h3>
                  <div className="space-y-2">
                    {completionDetails.receivedBooks.map((book) => (
                      <div key={book.id} className="bg-white p-3 rounded border border-green-300">
                        <p className="font-medium text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                        {book.condition && <p className="text-xs text-gray-500">Condition: {book.condition}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Books Given */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">📤 You Gave:</h3>
                  <div className="space-y-2">
                    {completionDetails.givenBooks.map((book) => (
                      <div key={book.id} className="bg-white p-3 rounded border border-blue-300">
                        <p className="font-medium text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                        {book.condition && <p className="text-xs text-gray-500">Condition: {book.condition}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    navigate('/books');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  View My Books
                </button>
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
