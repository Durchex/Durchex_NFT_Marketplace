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

  // Create or update user profile
  const createOrUpdateProfile = async (userData) => {
    setIsLoading(true);
    try {
      const profile = await userAPI.createOrUpdateUser(userData);
      setUserProfile(profile);
      toast.success('Profile saved successfully!');
      return profile;
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
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

  // Initialize profile if it doesn't exist
  const initializeProfile = async (walletAddress) => {
    if (!userProfile && walletAddress) {
      const defaultProfile = getDefaultProfile(walletAddress);
      try {
        await createOrUpdateProfile(defaultProfile);
      } catch (error) {
        console.error('Failed to initialize profile:', error);
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
