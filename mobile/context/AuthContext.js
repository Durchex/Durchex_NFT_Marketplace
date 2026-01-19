// Mobile Authentication Context
import React, { createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import MobileWalletService from '../services/MobileWalletService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Auth Context for managing authentication state
 */
export const AuthContext = createContext();

/**
 * Auth Context Provider Component
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            userInfo: action.userInfo,
            isLoading: false,
            isSignedIn: !!action.token,
          };

        case 'SIGN_IN':
          return {
            ...prevState,
            isSignedIn: true,
            userToken: action.token,
            userInfo: action.userInfo,
          };

        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignedIn: false,
            userToken: null,
            userInfo: null,
          };

        case 'SIGN_UP':
          return {
            ...prevState,
            isSignedIn: true,
            userToken: action.token,
            userInfo: action.userInfo,
          };

        case 'UPDATE_PROFILE':
          return {
            ...prevState,
            userInfo: {
              ...prevState.userInfo,
              ...action.userInfo,
            },
          };
      }
    },
    {
      isLoading: true,
      isSignedIn: false,
      userToken: null,
      userInfo: null,
    }
  );

  const authContext = React.useMemo(
    () => ({
      /**
       * Restore auth token and user info on app start
       */
      restoreToken: async () => {
        try {
          const [token, userInfo] = await Promise.all([
            AsyncStorage.getItem('userToken'),
            AsyncStorage.getItem('userInfo'),
          ]);

          dispatch({
            type: 'RESTORE_TOKEN',
            token,
            userInfo: userInfo ? JSON.parse(userInfo) : null,
          });
        } catch (e) {
          console.error('Failed to restore token:', e);
          dispatch({ type: 'RESTORE_TOKEN', token: null });
        }
      },

      /**
       * Sign in with wallet
       */
      signInWithWallet: async () => {
        try {
          const walletService = new MobileWalletService();
          await walletService.initialize(process.env.REACT_APP_WALLETCONNECT_PROJECT_ID);

          const wallet = await walletService.connectWallet();

          if (!wallet) {
            throw new Error('Wallet connection failed');
          }

          // Sign message to verify wallet ownership
          const message = `Durchex NFT Marketplace\nWallet: ${wallet.address}\nTimestamp: ${Date.now()}`;
          const signature = await walletService.signMessage(message);

          // Send to backend for verification and token generation
          const response = await axios.post(`${API_URL}/auth/wallet-login`, {
            address: wallet.address,
            chainId: wallet.chainId,
            message,
            signature,
          });

          const { token, user } = response.data;

          // Save auth data locally
          await Promise.all([
            AsyncStorage.setItem('userToken', token),
            AsyncStorage.setItem('userInfo', JSON.stringify(user)),
            AsyncStorage.setItem('walletAddress', wallet.address),
          ]);

          dispatch({
            type: 'SIGN_IN',
            token,
            userInfo: user,
          });

          return user;
        } catch (error) {
          console.error('Wallet sign-in failed:', error);
          throw error;
        }
      },

      /**
       * Sign in with email/password
       */
      signIn: async (email, password) => {
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password,
          });

          const { token, user } = response.data;

          await Promise.all([
            AsyncStorage.setItem('userToken', token),
            AsyncStorage.setItem('userInfo', JSON.stringify(user)),
          ]);

          dispatch({
            type: 'SIGN_IN',
            token,
            userInfo: user,
          });

          return user;
        } catch (error) {
          console.error('Sign-in failed:', error);
          throw error;
        }
      },

      /**
       * Sign up with email/password
       */
      signUp: async (email, password, username) => {
        try {
          const response = await axios.post(`${API_URL}/auth/register`, {
            email,
            password,
            username,
          });

          const { token, user } = response.data;

          await Promise.all([
            AsyncStorage.setItem('userToken', token),
            AsyncStorage.setItem('userInfo', JSON.stringify(user)),
          ]);

          dispatch({
            type: 'SIGN_UP',
            token,
            userInfo: user,
          });

          return user;
        } catch (error) {
          console.error('Sign-up failed:', error);
          throw error;
        }
      },

      /**
       * Sign out
       */
      signOut: async () => {
        try {
          // Optionally notify backend
          if (state.userToken) {
            await axios.post(
              `${API_URL}/auth/logout`,
              {},
              {
                headers: { Authorization: `Bearer ${state.userToken}` },
              }
            );
          }

          await Promise.all([
            AsyncStorage.removeItem('userToken'),
            AsyncStorage.removeItem('userInfo'),
            AsyncStorage.removeItem('walletAddress'),
            AsyncStorage.removeItem('walletConnectSession'),
          ]);

          dispatch({ type: 'SIGN_OUT' });
        } catch (error) {
          console.error('Sign-out failed:', error);
          dispatch({ type: 'SIGN_OUT' });
        }
      },

      /**
       * Update user profile
       */
      updateProfile: async (updates) => {
        try {
          const response = await axios.put(
            `${API_URL}/user/profile`,
            updates,
            {
              headers: { Authorization: `Bearer ${state.userToken}` },
            }
          );

          dispatch({
            type: 'UPDATE_PROFILE',
            userInfo: response.data.user,
          });

          await AsyncStorage.setItem(
            'userInfo',
            JSON.stringify(response.data.user)
          );

          return response.data.user;
        } catch (error) {
          console.error('Profile update failed:', error);
          throw error;
        }
      },

      /**
       * Get auth headers for API requests
       */
      getAuthHeaders: () => ({
        Authorization: `Bearer ${state.userToken}`,
        'Content-Type': 'application/json',
      }),

      state,
    }),
    [state]
  );

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
