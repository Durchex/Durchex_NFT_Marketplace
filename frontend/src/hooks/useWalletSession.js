import { useState, useEffect, useContext } from 'react';
import { ICOContent } from '../Context';
import socketService from '../services/socketService';

const useWalletSession = () => {
  const { address, connectWallet, disconnectWallet } = useContext(ICOContent);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [lastActivity, setLastActivity] = useState(null);

  // Session configuration
  const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const SESSION_KEY = 'wallet_session';

  useEffect(() => {
    // Check for existing session on mount
    checkExistingSession();
    
    // Set up activity tracking
    setupActivityTracking();
    
    // Set up session cleanup
    setupSessionCleanup();
  }, []);

  useEffect(() => {
    // Update session when address changes
    if (address) {
      createSession();
    } else {
      clearSession();
    }
  }, [address]);

  const checkExistingSession = () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const now = new Date().getTime();
        
        // Check if session is still valid
        if (now - session.createdAt < SESSION_TIMEOUT) {
          setSessionData(session);
          setIsSessionActive(true);
          setLastActivity(session.lastActivity);
          
          // Restore wallet connection
          if (session.address && !address) {
            connectWallet();
          }
        } else {
          // Session expired
          clearSession();
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      clearSession();
    }
  };

  const createSession = () => {
    if (!address) return;

    const session = {
      address: address,
      createdAt: new Date().getTime(),
      lastActivity: new Date().getTime(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };

    setSessionData(session);
    setIsSessionActive(true);
    setLastActivity(session.lastActivity);
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    // Send session activity
    socketService.sendUserActivity({
      type: 'session_created',
      user: address,
      sessionId: session.createdAt
    });
  };

  const updateActivity = () => {
    if (!isSessionActive || !sessionData) return;

    const now = new Date().getTime();
    const updatedSession = {
      ...sessionData,
      lastActivity: now
    };

    setSessionData(updatedSession);
    setLastActivity(now);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
  };

  const setupActivityTracking = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  };

  const setupSessionCleanup = () => {
    const cleanupInterval = setInterval(() => {
      if (isSessionActive && lastActivity) {
        const now = new Date().getTime();
        const timeSinceActivity = now - lastActivity;
        
        if (timeSinceActivity > ACTIVITY_TIMEOUT) {
          // Session inactive for too long
          handleSessionTimeout();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  };

  const handleSessionTimeout = () => {
    console.log('Session timeout - user inactive for too long');
    
    // Send timeout activity
    if (sessionData?.address) {
      socketService.sendUserActivity({
        type: 'session_timeout',
        user: sessionData.address,
        sessionId: sessionData.createdAt
      });
    }
    
    // Clear session but keep wallet connected
    clearSession(false);
  };

  const clearSession = (disconnectWallet = true) => {
    setSessionData(null);
    setIsSessionActive(false);
    setLastActivity(null);
    
    localStorage.removeItem(SESSION_KEY);
    
    if (disconnectWallet) {
      disconnectWallet();
    }
  };

  const extendSession = () => {
    if (isSessionActive && sessionData) {
      const extendedSession = {
        ...sessionData,
        lastActivity: new Date().getTime()
      };
      
      setSessionData(extendedSession);
      setLastActivity(extendedSession.lastActivity);
      localStorage.setItem(SESSION_KEY, JSON.stringify(extendedSession));
    }
  };

  const getSessionInfo = () => {
    if (!isSessionActive || !sessionData) return null;

    const now = new Date().getTime();
    const sessionAge = now - sessionData.createdAt;
    const timeSinceActivity = now - lastActivity;

    return {
      address: sessionData.address,
      sessionAge: sessionAge,
      timeSinceActivity: timeSinceActivity,
      isActive: isSessionActive,
      createdAt: new Date(sessionData.createdAt),
      lastActivity: new Date(lastActivity)
    };
  };

  const isSessionValid = () => {
    if (!isSessionActive || !sessionData) return false;
    
    const now = new Date().getTime();
    const sessionAge = now - sessionData.createdAt;
    const timeSinceActivity = now - lastActivity;
    
    return sessionAge < SESSION_TIMEOUT && timeSinceActivity < ACTIVITY_TIMEOUT;
  };

  return {
    isSessionActive,
    sessionData,
    lastActivity,
    createSession,
    clearSession,
    extendSession,
    updateActivity,
    getSessionInfo,
    isSessionValid
  };
};

export default useWalletSession;
