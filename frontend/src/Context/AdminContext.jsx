import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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

  // Admin credentials (in production, these should be stored securely)
  const ADMIN_CREDENTIALS = [
    {
      email: 'admin@durchex.com',
      username: 'admin',
      password: 'admin123', // Change this to a secure password
      role: 'super_admin'
    },
    {
      email: 'moderator@durchex.com', 
      username: 'moderator',
      password: 'mod123',
      role: 'moderator'
    },
    {
      email: 'partner@durchex.com',
      username: 'partner',
      password: 'partner123',
      role: 'partner'
    },
    {
      email: 'investor@durchex.com',
      username: 'investor',
      password: 'investor123',
      role: 'partner'
    }
  ];

  // Check if admin is logged in on component mount
  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession);
        if (sessionData.expires > Date.now()) {
          setIsAdminLoggedIn(true);
          setAdminUser(sessionData.user);
        } else {
          // Session expired
          localStorage.removeItem('admin_session');
        }
      } catch (error) {
        localStorage.removeItem('admin_session');
      }
    }
  }, []);

  // Admin login function
  const adminLogin = async (email, password) => {
    setIsLoading(true);
    try {
      // Find admin by email or username
      const admin = ADMIN_CREDENTIALS.find(
        cred => cred.email === email || cred.username === email
      );

      if (!admin) {
        toast.error('Invalid credentials');
        return false;
      }

      if (admin.password !== password) {
        toast.error('Invalid password');
        return false;
      }

      // Create session
      const sessionData = {
        user: {
          email: admin.email,
          username: admin.username,
          role: admin.role
        },
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      setIsAdminLoggedIn(true);
      setAdminUser(sessionData.user);
      toast.success(`Welcome back, ${admin.username}!`);
      return true;

    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Admin logout function
  const adminLogout = () => {
    localStorage.removeItem('admin_session');
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    toast.success('Logged out successfully');
  };

  // Check if current user has admin privileges
  const hasAdminAccess = () => {
    return isAdminLoggedIn && adminUser;
  };

  // Check if current user is super admin
  const isSuperAdmin = () => {
    return isAdminLoggedIn && adminUser?.role === 'super_admin';
  };

  // Check if current user is a partner/investor (read-only access)
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
    isSuperAdmin,
    isPartner
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
