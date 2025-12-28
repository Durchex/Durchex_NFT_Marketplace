import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config
const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Withdrawal API functions
export const withdrawalAPI = {
  // Request a withdrawal
  requestWithdrawal: async (data) => {
    try {
      const response = await apiInstance.post('/withdrawals/request', data);
      return response.data;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      throw error.response?.data || error;
    }
  },

  // Get withdrawal history
  getWithdrawalHistory: async (userWallet, params = {}) => {
    try {
      const response = await apiInstance.get(
        `/withdrawals/history/${userWallet}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      throw error.response?.data || error;
    }
  },

  // Get earnings dashboard
  getEarningsDashboard: async (userWallet) => {
    try {
      const response = await apiInstance.get(
        `/withdrawals/earnings/${userWallet}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching earnings:', error);
      throw error.response?.data || error;
    }
  },

  // Get user available balance
  getUserAvailableBalance: async (userWallet, network) => {
    try {
      const response = await apiInstance.get(
        `/withdrawals/balance/${userWallet}/${network}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error.response?.data || error;
    }
  },
};

// Partner Wallet API functions
export const partnerWalletAPI = {
  // Add a partner
  addPartner: async (data) => {
    try {
      const response = await apiInstance.post('/partners/add', data);
      return response.data;
    } catch (error) {
      console.error('Error adding partner:', error);
      throw error.response?.data || error;
    }
  },

  // Verify partnership
  verifyPartnership: async (data) => {
    try {
      const response = await apiInstance.post('/partners/verify', data);
      return response.data;
    } catch (error) {
      console.error('Error verifying partnership:', error);
      throw error.response?.data || error;
    }
  },

  // Get owner's partners
  getOwnerPartners: async (ownerWallet, params = {}) => {
    try {
      const response = await apiInstance.get(
        `/partners/owner/${ownerWallet}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching owner partners:', error);
      throw error.response?.data || error;
    }
  },

  // Get partner agreements
  getPartnerAgreements: async (partnerWallet, params = {}) => {
    try {
      const response = await apiInstance.get(
        `/partners/agreements/${partnerWallet}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching partner agreements:', error);
      throw error.response?.data || error;
    }
  },

  // Update partnership
  updatePartnership: async (ownerWallet, partnerWallet, data) => {
    try {
      const response = await apiInstance.patch(
        `/partners/owner/${ownerWallet}/${partnerWallet}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating partnership:', error);
      throw error.response?.data || error;
    }
  },

  // Deactivate partnership
  deactivatePartnership: async (ownerWallet, partnerWallet) => {
    try {
      const response = await apiInstance.patch(
        `/partners/deactivate/${ownerWallet}/${partnerWallet}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deactivating partnership:', error);
      throw error.response?.data || error;
    }
  },

  // Get partner earnings
  getPartnerEarnings: async (ownerWallet, partnerWallet) => {
    try {
      const response = await apiInstance.get(
        `/partners/earnings/${ownerWallet}/${partnerWallet}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching partner earnings:', error);
      throw error.response?.data || error;
    }
  },
};

export default {
  withdrawalAPI,
  partnerWalletAPI,
};
