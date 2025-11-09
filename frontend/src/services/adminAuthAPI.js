import api from './api';

// Admin Authentication API
export const adminAuthAPI = {
  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/admin-auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  // Create admin account (only by existing admin)
  createAdmin: async (email, username, password, role = 'admin') => {
    try {
      const response = await api.post('/admin-auth/create-admin', {
        email,
        username,
        password,
        role
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create admin');
    }
  },

  // Create partner account (only by admin)
  createPartner: async (email, username, password) => {
    try {
      const response = await api.post('/admin-auth/create-partner', {
        email,
        username,
        password
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create partner');
    }
  },

  // Get all admins and partners (only by admin)
  getAllAdmins: async () => {
    try {
      const response = await api.get('/admin-auth/all');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get admins');
    }
  },

  // Update admin/partner account
  updateAdmin: async (id, updates) => {
    try {
      const response = await api.patch(`/admin-auth/${id}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update account');
    }
  },

  // Delete admin/partner account
  deleteAdmin: async (id) => {
    try {
      const response = await api.delete(`/admin-auth/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete account');
    }
  }
};

export default adminAuthAPI;

