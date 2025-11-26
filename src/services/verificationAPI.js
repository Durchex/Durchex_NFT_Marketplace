import api from './api';

export const verificationAPI = {
  // Submit verification request. Assumes idVerification.documentImage is an IPFS URL
  submitVerification: async (walletAddress, data) => {
    try {
      const response = await api.post(`/verification/submit/${walletAddress}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to submit verification: ${error.message}`);
    }
  },

  // Get verification status for a wallet
  getVerificationStatus: async (walletAddress) => {
    try {
      const response = await api.get(`/verification/status/${walletAddress}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.response?.data?.error || `Failed to get verification status: ${error.message}`);
    }
  },

  // Admin helpers are intentionally omitted here
};

export default verificationAPI;
