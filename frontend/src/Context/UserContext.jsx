import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  // Load user profile when wallet address changes
  const loadUserProfile = async (walletAddress) => {
    if (!walletAddress) {
      setUserProfile(null);
      setIsProfileLoaded(true);
      return;
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      console.warn('Invalid wallet address format:', walletAddress);
      setUserProfile(null);
      setIsProfileLoaded(true);
      return;
    }

    setIsLoading(true);
    try {
      const profile = await userAPI.getUserProfile(walletAddress);
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
      setIsProfileLoaded(true);
    }
  };

  // Create or update user profile - requires wallet address
  const createOrUpdateProfile = async (userData) => {
    if (!userData.walletAddress) {
      const error = new Error('Wallet address is required to save profile');
      toast.error(error.message);
      throw error;
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(userData.walletAddress)) {
      const error = new Error('Invalid wallet address format');
      toast.error(error.message);
      throw error;
    }

    setIsLoading(true);
    try {
      const profile = await userAPI.createOrUpdateUser(userData);
      setUserProfile(profile);
      toast.success('Profile saved successfully!');
      return profile;
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error(error.message || 'Failed to save profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (walletAddress, userData) => {
    setIsLoading(true);
    try {
      const profile = await userAPI.updateUserProfile(walletAddress, userData);
      setUserProfile(profile);
      toast.success('Profile updated successfully!');
      return profile;
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user profile
  const deleteProfile = async (walletAddress) => {
    setIsLoading(true);
    try {
      await userAPI.deleteUserProfile(walletAddress);
      setUserProfile(null);
      toast.success('Profile deleted successfully!');
    } catch (error) {
      console.error('Failed to delete profile:', error);
      toast.error('Failed to delete profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get or create default profile data
  const getDefaultProfile = (walletAddress) => ({
    walletAddress,
    username: '',
    email: '',
    bio: '',
    avatar: '',
    socialLinks: {
      twitter: '',
      discord: '',
      website: '',
    },
    preferences: {
      notifications: true,
      publicProfile: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Initialize profile if it doesn't exist - but don't auto-create
  // Only load existing profile, don't create new ones automatically
  const initializeProfile = async (walletAddress) => {
    if (!walletAddress) {
      console.warn('Cannot initialize profile without wallet address');
      return;
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      console.warn('Invalid wallet address format:', walletAddress);
      return;
    }

    // Only load existing profile, don't create new one
    if (!userProfile) {
      try {
        await loadUserProfile(walletAddress);
      } catch (error) {
        console.error('Failed to load profile:', error);
        // Don't create profile automatically - user must explicitly save
      }
    }
  };

  const value = {
    userProfile,
    isLoading,
    isProfileLoaded,
    loadUserProfile,
    createOrUpdateProfile,
    updateProfile,
    deleteProfile,
    initializeProfile,
    getDefaultProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
