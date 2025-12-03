import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface ProfileSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
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

export const ProfileSummaryModal: React.FC<ProfileSummaryModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError('');
      const response = await api.get(`/users/${userId}/summary`);
      setProfile(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFullProfile = () => {
    navigate(`/users?search=${profile?.name}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          ) : profile ? (
            <div>
              {/* Profile Picture */}
              <div className="flex justify-center mb-4">
                {profile.profilePictureUrl ? (
                  <img
                    src={profile.profilePictureUrl}
                    alt={profile.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name and Location */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">
                {profile.name}
              </h2>
              <p className="text-gray-600 text-center mb-4">📍 {profile.location}</p>

              {/* Biography */}
              {profile.biography && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                  <p className="text-gray-600 text-sm">{profile.biography}</p>
                </div>
              )}

              {/* Book Counts */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {profile.bookCounts.inventory}
                  </p>
                  <p className="text-xs text-green-600">Inventory Books</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {profile.bookCounts.wishlist}
                  </p>
                  <p className="text-xs text-blue-600">Wishlist Books</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={handleViewFullProfile}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  View Full Profile
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
