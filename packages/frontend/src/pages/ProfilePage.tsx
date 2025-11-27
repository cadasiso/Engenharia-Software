import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { api } from '../lib/api';

interface Profile {
  id: string;
  name: string;
  email: string;
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
  rater: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };
  trade: {
    id: string;
    createdAt: string;
  };
}

interface RatingsData {
  ratings: Rating[];
  averageRating: number;
  totalRatings: number;
}

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ratings, setRatings] = useState<RatingsData | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [biography, setBiography] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchProfile();
    fetchRatings();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/profile');
      setProfile(response.data);
      setName(response.data.name);
      setLocation(response.data.location);
      setBiography(response.data.biography || '');
      setTwitter(response.data.socialLinks?.twitter || '');
      setInstagram(response.data.socialLinks?.instagram || '');
      setFacebook(response.data.socialLinks?.facebook || '');
    } catch (error) {
      showToast('Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const response = await api.get('/profile/ratings');
      setRatings(response.data);
    } catch (error) {
      console.error('Failed to load ratings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await api.put('/profile', {
        name,
        location,
        biography: biography || null,
        socialLinks: {
          twitter: twitter || undefined,
          instagram: instagram || undefined,
          facebook: facebook || undefined,
        },
      });
      setProfile(response.data);
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Only image files are allowed', 'error');
      return;
    }

    try {
      setIsUploadingPicture(true);
      const formData = new FormData();
      formData.append('picture', file);

      const response = await api.post('/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfile(response.data);
      showToast('Profile picture updated!', 'success');
    } catch (error) {
      showToast('Failed to upload profile picture', 'error');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const getProfilePictureUrl = () => {
    if (profile?.profilePictureUrl) {
      return `${import.meta.env.VITE_API_URL}${profile.profilePictureUrl}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&size=200&background=random`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating.toFixed(1)})</span>
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
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Users
              </Link>
              <Link
                to="/profile"
                className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </Link>
            </div>
            <div className="flex items-center space-x-4">
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 mt-4">Loading profile...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              {/* Profile Picture Section */}
              <div className="flex items-start gap-6 mb-6 pb-6 border-b">
                <div className="relative">
                  <img
                    src={getProfilePictureUrl()}
                    alt={profile?.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                  {!isEditing && (
                    <label
                      htmlFor="picture-upload"
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg"
                    >
                      {isUploadingPicture ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </label>
                  )}
                  <input
                    id="picture-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePictureUpload}
                    className="hidden"
                    disabled={isUploadingPicture}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
                  <p className="text-gray-600">{profile?.email}</p>
                  {ratings && ratings.totalRatings > 0 && (
                    <div className="mt-2">
                      {renderStars(ratings.averageRating)}
                      <p className="text-sm text-gray-500 mt-1">
                        Based on {ratings.totalRatings} rating{ratings.totalRatings !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* Profile Details */}
              {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Biography</label>
                  <textarea
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="Profile URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile();
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1 text-lg text-gray-900">{profile?.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1 text-lg text-gray-900">{profile?.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="mt-1 text-lg text-gray-900">{profile?.location}</p>
                </div>
                {profile?.biography && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Biography</h3>
                    <p className="mt-1 text-gray-900">{profile.biography}</p>
                  </div>
                )}
                {(profile?.socialLinks?.twitter ||
                  profile?.socialLinks?.instagram ||
                  profile?.socialLinks?.facebook) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Social Links</h3>
                    <div className="space-y-1">
                      {profile.socialLinks.twitter && (
                        <p className="text-gray-900">Twitter: {profile.socialLinks.twitter}</p>
                      )}
                      {profile.socialLinks.instagram && (
                        <p className="text-gray-900">Instagram: {profile.socialLinks.instagram}</p>
                      )}
                      {profile.socialLinks.facebook && (
                        <p className="text-gray-900">Facebook: {profile.socialLinks.facebook}</p>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(profile?.createdAt || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            </div>

            {/* Ratings Section */}
            {ratings && ratings.totalRatings > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Ratings & Reviews ({ratings.totalRatings})
                </h2>
                <div className="space-y-4">
                  {ratings.ratings.map((rating) => (
                    <div key={rating.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <img
                          src={
                            rating.rater.profilePictureUrl
                              ? `${import.meta.env.VITE_API_URL}${rating.rater.profilePictureUrl}`
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(rating.rater.name)}&size=40&background=random`
                          }
                          alt={rating.rater.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{rating.rater.name}</p>
                              {renderStars(rating.rating)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {rating.comment && (
                            <p className="mt-2 text-gray-700">{rating.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
