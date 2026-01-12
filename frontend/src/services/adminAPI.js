import api from './api';
import { userAPI } from './api';

// Admin API functions for dashboard management
export const adminAPI = {
  // Dashboard Statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      // Return default stats if API fails
      return {
        totalUsers: 0,
        totalNFTs: 0,
        totalVolume: '0',
        activeSales: 0,
        recentActivities: [],
        topCollections: []
      };
    }
  },

  // Users Management
  getAllUsersAdmin: async (page = 1, limit = 50, search = '') => {
    try {
      const params = new URLSearchParams({ page, limit, search });
      const response = await api.get(`/admin/users?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  },

  updateUserStatus: async (walletAddress, updates) => {
    try {
      const response = await api.patch(`/admin/users/${walletAddress}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  },

  deleteUser: async (walletAddress) => {
    try {
      const response = await api.delete(`/admin/users/${walletAddress}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },

  // NFTs Management
  getAllNFTsAdmin: async (page = 1, limit = 50, filters = {}) => {
    try {
      const params = new URLSearchParams({ page, limit, ...filters });
      const response = await api.get(`/admin/nfts?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get NFTs: ${error.message}`);
    }
  },

  updateNFTStatus: async (network, itemId, updates) => {
    try {
      const response = await api.patch(`/admin/nfts/${network}/${itemId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update NFT: ${error.message}`);
    }
  },

  delistNFT: async (network, itemId, reason = 'Violates marketplace terms') => {
    try {
      const response = await api.post(`/admin/nfts/${network}/${itemId}/delist`, { reason });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delist NFT: ${error.message}`);
    }
  },

  deleteNFT: async (network, itemId) => {
    try {
      const response = await api.delete(`/admin/nfts/${network}/${itemId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete NFT: ${error.message}`);
    }
  },

  // Transactions
  getTransactions: async (page = 1, limit = 50, filters = {}) => {
    try {
      const params = new URLSearchParams({ page, limit, ...filters });
      const response = await api.get(`/admin/transactions?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  },

  // Orders
  getOrders: async (page = 1, limit = 50, filters = {}) => {
    try {
      const params = new URLSearchParams({ page, limit, ...filters });
      const response = await api.get(`/admin/orders?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get orders: ${error.message}`);
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await api.patch(`/admin/orders/${orderId}`, { status });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update order: ${error.message}`);
    }
  },

  // Analytics
  getAnalytics: async (period = '7d') => {
    try {
      const response = await api.get(`/admin/analytics?period=${period}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  },

  // Activity Log
  getActivityLog: async (page = 1, limit = 50, filters = {}) => {
    try {
      const params = new URLSearchParams({ page, limit, ...filters });
      const response = await api.get(`/admin/activity?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get activity log: ${error.message}`);
    }
  },

  // Reports
  generateReport: async (reportType, params = {}) => {
    try {
      const response = await api.post(`/admin/reports/${reportType}`, params);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  },

  getReports: async () => {
    try {
      const response = await api.get('/admin/reports');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get reports: ${error.message}`);
    }
  },
};

// Re-export userAPI for convenience
export { userAPI };

export default adminAPI;

