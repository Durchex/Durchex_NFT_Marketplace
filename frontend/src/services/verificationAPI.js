import api from './api';

// Verification API functions
export const verificationAPI = {
  // Submit verification request
  submitVerification: async (walletAddress, data) => {
    try {
      const response = await api.post(`/verification/submit/${walletAddress}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to submit verification: ${error.message}`);
    }
  },

  // Get verification status
  getVerificationStatus: async (walletAddress) => {
    try {
      const response = await api.get(`/verification/status/${walletAddress}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to get verification status: ${error.message}`);
    }
  },

  // Admin: Get pending verifications
  getPendingVerifications: async (page = 1, limit = 50) => {
    try {
      const params = new URLSearchParams({ page, limit });
      const response = await api.get(`/verification/admin/pending?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to get pending verifications: ${error.message}`);
    }
  },

  // Admin: Get all verifications
  getAllVerifications: async (page = 1, limit = 50, status = 'all', search = '') => {
    try {
      const params = new URLSearchParams({ page, limit, status, search });
      const response = await api.get(`/verification/admin/all?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to get verifications: ${error.message}`);
    }
  },

  // Admin: Approve verification
  approveVerification: async (walletAddress, verifiedBy) => {
    try {
      const response = await api.post(`/verification/admin/approve/${walletAddress}`, { verifiedBy });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to approve verification: ${error.message}`);
    }
  },

  // Admin: Reject verification
  rejectVerification: async (walletAddress, verifiedBy, rejectionReason) => {
    try {
      const response = await api.post(`/verification/admin/reject/${walletAddress}`, {
        verifiedBy,
        rejectionReason,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to reject verification: ${error.message}`);
    }
  },
};

export default verificationAPI;

