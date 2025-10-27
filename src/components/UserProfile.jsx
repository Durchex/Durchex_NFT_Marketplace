import React, { useState, useEffect } from 'react';
import { useUser } from '../Context/UserContext';
import { useCart } from '../Context/CartContext';
import { ICOContent } from '../Context';
import { useContext } from 'react';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { userProfile, isLoading, updateProfile, createOrUpdateProfile, initializeProfile } = useUser();
  const { cartItems, cartTotal, getCartItemCount } = useCart();
  const { address } = useContext(ICOContent);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: '',
    socialLinks: {
      twitter: '',
      discord: '',
      website: '',
    },
  });

  // Load user profile when address changes
  useEffect(() => {
    if (address) {
      initializeProfile(address);
    }
  }, [address, initializeProfile]);

  // Update form data when user profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        email: userProfile.email || '',
        bio: userProfile.bio || '',
        avatar: userProfile.avatar || '',
        socialLinks: {
          twitter: userProfile.socialLinks?.twitter || '',
          discord: userProfile.socialLinks?.discord || '',
          website: userProfile.socialLinks?.website || '',
        },
      });
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('socialLinks.')) {
      const socialKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const profileData = {
        ...formData,
        walletAddress: address,
        updatedAt: new Date().toISOString(),
      };

      if (userProfile) {
        await updateProfile(address, profileData);
      } else {
        await createOrUpdateProfile(profileData);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        email: userProfile.email || '',
        bio: userProfile.bio || '',
        avatar: userProfile.avatar || '',
        socialLinks: {
          twitter: userProfile.socialLinks?.twitter || '',
          discord: userProfile.socialLinks?.discord || '',
          website: userProfile.socialLinks?.website || '',
        },
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 text-white">Profile</h1>
          <p className="font-body text-gray-400 text-lg">Manage your profile and preferences</p>
        </div>

        {/* Wallet Address */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700/50">
          <h2 className="font-display text-xl font-semibold mb-4 text-white">Wallet Address</h2>
          <p className="text-blue-400 font-mono break-all text-sm">
            {address || 'Not connected'}
          </p>
        </div>

        {/* Cart Summary */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Shopping Cart</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{getCartItemCount()}</p>
              <p className="text-gray-400">Items in Cart</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{cartTotal.toFixed(4)} ETH</p>
              <p className="text-gray-400">Total Value</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{userProfile?.username || 'Anonymous'}</p>
              <p className="text-gray-400">Username</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Profile Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Avatar URL</label>
                <input
                  type="url"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  placeholder="Enter avatar image URL"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Twitter</label>
                <input
                  type="url"
                  name="socialLinks.twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discord</label>
                <input
                  type="text"
                  name="socialLinks.discord"
                  value={formData.socialLinks.discord}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  placeholder="Discord username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <input
                  type="url"
                  name="socialLinks.website"
                  value={formData.socialLinks.website}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
