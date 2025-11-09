import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAuthAPI } from '../services/adminAuthAPI';
import api from '../services/api';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if admin is logged in on component mount
  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession);
        if (sessionData.expires > Date.now()) {
          setIsAdminLoggedIn(true);
          setAdminUser(sessionData.user);
          // Set admin ID in API headers for authenticated requests
          if (sessionData.user.id) {
            api.defaults.headers.common['x-admin-id'] = sessionData.user.id;
          }
        } else {
          // Session expired
          localStorage.removeItem('admin_session');
          delete api.defaults.headers.common['x-admin-id'];
        }
      } catch (error) {
        localStorage.removeItem('admin_session');
        delete api.defaults.headers.common['x-admin-id'];
      }
    }
  }, []);

  // Admin login function
  const adminLogin = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await adminAuthAPI.login(email, password);
      
      if (response.success && response.admin) {
        // Create session
        const sessionData = {
          user: {
            id: response.admin.id,
            email: response.admin.email,
            username: response.admin.username,
            role: response.admin.role
          },
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };

        localStorage.setItem('admin_session', JSON.stringify(sessionData));
        setIsAdminLoggedIn(true);
        setAdminUser(sessionData.user);
        
        // Set admin ID in API headers for authenticated requests
        api.defaults.headers.common['x-admin-id'] = response.admin.id;
        
        toast.success(`Welcome back, ${response.admin.username}!`);
        return true;
      } else {
        toast.error('Invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Admin logout function
  const adminLogout = () => {
    localStorage.removeItem('admin_session');
    delete api.defaults.headers.common['x-admin-id'];
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    toast.success('Logged out successfully');
  };

  // Check if current user has admin privileges
  const hasAdminAccess = () => {
    return isAdminLoggedIn && adminUser;
  };

  // Check if current user is admin (full access)
  const isAdmin = () => {
    return isAdminLoggedIn && adminUser?.role === 'admin';
  };

  // Check if current user is a partner (read-only access)
  const isPartner = () => {
    return isAdminLoggedIn && adminUser?.role === 'partner';
  };

  const value = {
    isAdminLoggedIn,
    adminUser,
    isLoading,
    adminLogin,
    adminLogout,
    hasAdminAccess,
    isAdmin,
    isPartner
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
