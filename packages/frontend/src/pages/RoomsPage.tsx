import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

interface Room {
  id: string;
  name: string;
  type: string;
  genre?: string;
  adminIds: string[];
  memberships: any[];
  _count: { memberships: number };
}

interface JoinRequest {
  id: string;
  user: { id: string; name: string; email: string };
  status: string;
}

export const RoomsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  
  // Create room form
  const [roomName, setRoomName] = useState('');
  const [roomGenre, setRoomGenre] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Room[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/rooms/private', {
        name: roomName,
        genre: roomGenre || undefined,
        isPublic,
      });
      setShowCreateModal(false);
      setRoomName('');
      setRoomGenre('');
      setIsPublic(false);
      fetchRooms();
      alert('Room created successfully!');
    } catch (error) {
      alert('Failed to create room');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.get(`/rooms/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (error) {
      alert('Failed to search rooms');
    }
  };

  const handleJoinRequest = async (roomId: string) => {
    try {
      await api.post(`/rooms/${roomId}/request`);
      alert('Join request sent!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send join request');
    }
  };

  const handleToggleVisibility = async (room: Room) => {
    try {
      const newIsPublic = room.type === 'private';
      await api.patch(`/rooms/${room.id}/visibility`, { isPublic: newIsPublic });
      fetchRooms();
      alert(`Room is now ${newIsPublic ? 'public' : 'private'}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to toggle visibility');
    }
  };

  const handleViewRequests = async (room: Room) => {
    try {
      setSelectedRoom(room);
      const response = await api.get(`/rooms/${room.id}/requests`);
      setRequests(response.data);
      setShowRequestsModal(true);
    } catch (error) {
      alert('Failed to fetch requests');
    }
  };

  const handleApproveRequest = async (roomId: string, userId: string) => {
    try {
      await api.post(`/rooms/${roomId}/approve/${userId}`);
      alert('Request approved!');
      handleViewRequests(selectedRoom!);
      fetchRooms();
    } catch (error) {
      alert('Failed to approve request');
    }
  };

  const handleDenyRequest = async (roomId: string, userId: string) => {
    try {
      await api.post(`/rooms/${roomId}/deny/${userId}`);
      alert('Request denied');
      handleViewRequests(selectedRoom!);
    } catch (error) {
      alert('Failed to deny request');
    }
  };

  const handleJoinPublicRoom = async (roomId: string) => {
    try {
      await api.post(`/rooms/${roomId}/join`);
      alert('Joined room successfully!');
      fetchRooms();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to join room');
    }
  };

  const isAdmin = (room: Room) => room.adminIds.includes(user?.id || '');
  const isMember = (room: Room) => room.memberships.length > 0;

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Search Rooms
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Room
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading rooms...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    room.type === 'location' ? 'bg-blue-100 text-blue-800' :
                    room.type === 'public_genre' ? 'bg-green-100 text-green-800' :
                    room.type === 'public_custom' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {room.type === 'private' ? '🔒 Private' : '🌐 Public'}
                  </span>
                </div>
                {room.genre && <p className="text-sm text-gray-600 mb-2">Genre: {room.genre}</p>}
                <p className="text-sm text-gray-500 mb-4">{room._count.memberships} members</p>
                
                {isMember(room) ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600">✓ Member</p>
                    <button
                      onClick={() => navigate(`/rooms/${room.id}`)}
                      className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Enter Room
                    </button>
                    {isAdmin(room) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewRequests(room)}
                          className="flex-1 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Requests
                        </button>
                        {(room.type === 'private' || room.type === 'public_custom') && (
                          <button
                            onClick={() => handleToggleVisibility(room)}
                            className="flex-1 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            Toggle
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : room.type === 'private' ? (
                  <button
                    onClick={() => handleJoinRequest(room.id)}
                    className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Request to Join
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinPublicRoom(room.id)}
                    className="w-full px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Join Room
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Room</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre (optional)</label>
                <input
                  type="text"
                  value={roomGenre}
                  onChange={(e) => setRoomGenre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Make room public</label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Search Rooms</h2>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Search
                </button>
              </div>
            </form>
            <div className="space-y-2">
              {searchResults.map((room) => (
                <div key={room.id} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium">{room.name}</p>
                    <p className="text-sm text-gray-600">{room._count.memberships} members</p>
                  </div>
                  {!isMember(room) && room.type === 'private' && (
                    <button
                      onClick={() => handleJoinRequest(room.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Request
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowSearchModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Requests Modal */}
      {showRequestsModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Join Requests - {selectedRoom.name}</h2>
            <div className="space-y-2 mb-4">
              {requests.length === 0 ? (
                <p className="text-gray-500">No pending requests</p>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="p-3 border rounded">
                    <p className="font-medium">{request.user.name}</p>
                    <p className="text-sm text-gray-600">{request.user.email}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApproveRequest(selectedRoom.id, request.user.id)}
                        className="flex-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDenyRequest(selectedRoom.id, request.user.id)}
                        className="flex-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowRequestsModal(false)}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
