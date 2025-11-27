import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

interface Chat {
  id: string;
  participant1: { id: string; name: string };
  participant2: { id: string; name: string };
  messages: Array<{ content: string; createdAt: string }>;
}

interface Message {
  id: string;
  content: string;
  sender: { id: string; name: string };
  createdAt: string;
}

interface MeetingProposal {
  id: string;
  place: string;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'rejected';
  proposer: { id: string; name: string };
  createdAt: string;
}

export const ChatsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [proposals, setProposals] = useState<MeetingProposal[]>([]);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalPlace, setProposalPlace] = useState('');
  const [proposalDateTime, setProposalDateTime] = useState('');
  const [showTradeButton, setShowTradeButton] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (chatId) {
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
        fetchMessages(chatId);
        fetchProposals(chatId);
        checkForMatch(chat);
      }
    }
  }, [chatId, chats]);

  const checkForMatch = async (chat: Chat) => {
    try {
      const otherUser = getOtherParticipant(chat);
      const response = await api.get('/matches');
      const hasMatch = response.data.some(
        (m: any) => m.matchedUser.id === otherUser.id
      );
      setShowTradeButton(hasMatch);
    } catch (error) {
      console.error('Failed to check match:', error);
    }
  };

  const handleProposeTrade = async () => {
    if (!selectedChat) return;

    try {
      const otherUser = getOtherParticipant(selectedChat);
      const response = await api.get('/matches');
      const match = response.data.find(
        (m: any) => m.matchedUser.id === otherUser.id
      );

      if (!match) {
        alert('No match found with this user');
        return;
      }

      const offeredBookIds = match.matchingBooks
        .filter((b: any) => b.userBookId)
        .map((b: any) => b.userBookId);
      const requestedBookIds = match.matchingBooks
        .filter((b: any) => b.matchedUserBookId)
        .map((b: any) => b.matchedUserBookId);

      await api.post('/trades', {
        matchId: match.id,
        offeredBookIds,
        requestedBookIds,
      });

      alert('Trade proposed! Check the Trades page.');
      navigate('/trades');
    } catch (error) {
      alert('Failed to propose trade');
    }
  };

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const response = await api.get(`/chats/${id}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchProposals = async (id: string) => {
    try {
      const response = await api.get(`/proposals/chat/${id}`);
      // Only show the latest proposal
      const allProposals = response.data;
      if (allProposals.length > 0) {
        setProposals([allProposals[0]]);
      } else {
        setProposals([]);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !newMessage.trim()) return;

    try {
      await api.post(`/chats/${selectedChat.id}/messages`, { content: newMessage });
      setNewMessage('');
      fetchMessages(selectedChat.id);
    } catch (error) {
      alert('Failed to send message');
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !proposalPlace.trim() || !proposalDateTime) return;

    // Check if there's already a pending or confirmed proposal
    if (proposals.length > 0 && proposals[0].status !== 'rejected') {
      alert('Please reject the current proposal before creating a new one');
      return;
    }

    try {
      await api.post('/proposals', {
        chatId: selectedChat.id,
        place: proposalPlace,
        dateTime: proposalDateTime,
      });
      setProposalPlace('');
      setProposalDateTime('');
      setShowProposalForm(false);
      fetchProposals(selectedChat.id);
      alert('Meeting proposal sent!');
    } catch (error) {
      alert('Failed to create proposal');
    }
  };

  const handleCancelProposal = async (proposalId: string) => {
    try {
      await api.post(`/proposals/${proposalId}/reject`);
      if (selectedChat) {
        fetchProposals(selectedChat.id);
      }
      alert('Meeting proposal cancelled');
    } catch (error) {
      alert('Failed to cancel proposal');
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    try {
      await api.post(`/proposals/${proposalId}/accept`);
      if (selectedChat) {
        fetchProposals(selectedChat.id);
      }
      alert('Meeting proposal accepted!');
    } catch (error) {
      alert('Failed to accept proposal');
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    try {
      await api.post(`/proposals/${proposalId}/reject`);
      if (selectedChat) {
        fetchProposals(selectedChat.id);
      }
      alert('Meeting proposal rejected');
    } catch (error) {
      alert('Failed to reject proposal');
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    return chat.participant1.id === user?.id ? chat.participant2 : chat.participant1;
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
                className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Chats</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading chats...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No chats yet.</p>
            <p className="text-gray-400 text-sm mb-4">
              Start a chat from your matches page!
            </p>
            <Link
              to="/matches"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Matches
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chat List */}
            <div className="md:col-span-1 bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Conversations</h2>
              </div>
              <div className="divide-y">
                {chats.map((chat) => {
                  const other = getOtherParticipant(chat);
                  return (
                    <button
                      key={chat.id}
                      onClick={() => navigate(`/chats/${chat.id}`)}
                      className={`w-full p-4 text-left hover:bg-gray-50 ${
                        selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="font-medium text-gray-900">{other.name}</p>
                      {chat.messages[0] && (
                        <p className="text-sm text-gray-500 truncate">{chat.messages[0].content}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Window */}
            <div className="md:col-span-2 bg-white rounded-lg shadow flex flex-col" style={{ height: '600px' }}>
              {selectedChat ? (
                <>
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <h2 className="font-semibold text-gray-900">
                        {getOtherParticipant(selectedChat).name}
                      </h2>
                      <div className="flex gap-2">
                        {showTradeButton && (
                          <button
                            onClick={handleProposeTrade}
                            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            Propose Trade
                          </button>
                        )}
                        <button
                          onClick={() => setShowProposalForm(!showProposalForm)}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          {showProposalForm ? 'Cancel' : 'Propose Meeting'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Proposal Form */}
                  {showProposalForm && (
                    <div className="p-4 bg-green-50 border-b">
                      <form onSubmit={handleCreateProposal} className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meeting Place
                          </label>
                          <input
                            type="text"
                            value={proposalPlace}
                            onChange={(e) => setProposalPlace(e.target.value)}
                            placeholder="e.g., Central Library, Starbucks on Main St"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={proposalDateTime}
                            onChange={(e) => setProposalDateTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Send Proposal
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Meeting Proposals */}
                  {proposals.length > 0 && (
                    <div className="p-4 bg-gray-50 border-b space-y-3">
                      <h3 className="font-semibold text-gray-900 text-sm">Meeting Proposals</h3>
                      {proposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className={`p-3 rounded-lg border ${
                            proposal.status === 'confirmed'
                              ? 'bg-green-100 border-green-300'
                              : proposal.status === 'rejected'
                              ? 'bg-red-100 border-red-300'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {proposal.proposer.name} proposed a meeting
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(proposal.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${
                                proposal.status === 'confirmed'
                                  ? 'bg-green-200 text-green-800'
                                  : proposal.status === 'rejected'
                                  ? 'bg-red-200 text-red-800'
                                  : 'bg-yellow-200 text-yellow-800'
                              }`}
                            >
                              {proposal.status}
                            </span>
                          </div>
                          <div className="space-y-1 mb-2">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Place:</span> {proposal.place}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Date & Time:</span>{' '}
                              {new Date(proposal.dateTime).toLocaleString()}
                            </p>
                          </div>
                          {proposal.status === 'pending' && (
                            <div className="flex gap-2">
                              {proposal.proposer.id !== user?.id ? (
                                <>
                                  <button
                                    onClick={() => handleAcceptProposal(proposal.id)}
                                    className="flex-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRejectProposal(proposal.id)}
                                    className="flex-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleRejectProposal(proposal.id)}
                                  className="w-full px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Cancel Proposal
                                </button>
                              )}
                            </div>
                          )}
                          {proposal.status === 'confirmed' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCancelProposal(proposal.id)}
                                className="w-full px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                              >
                                Cancel Meeting
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender.id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.sender.id === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs mt-1 opacity-75">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a chat to start messaging
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
