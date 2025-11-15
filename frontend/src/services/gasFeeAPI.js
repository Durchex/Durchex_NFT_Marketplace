import api from './api';

// Gas Fee API functions
export const gasFeeAPI = {
  // Get gas fee regulation for a network
  getGasFeeRegulation: async (network) => {
    try {
      const response = await api.get(`/gas-fee/network/${network}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to get gas fee regulation: ${error.message}`);
    }
  },

  // Get all gas fee regulations
  getAllGasFeeRegulations: async () => {
    try {
      const response = await api.get('/gas-fee/all');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to get gas fee regulations: ${error.message}`);
    }
  },

  // Calculate regulated gas price
  calculateRegulatedGasPrice: async (network, currentGasPrice) => {
    try {
      const response = await api.post('/gas-fee/calculate', { network, currentGasPrice });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to calculate regulated gas price: ${error.message}`);
    }
  },

  // Admin: Update gas fee regulation
  updateGasFeeRegulation: async (network, data) => {
    try {
      const response = await api.put(`/gas-fee/admin/${network}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to update gas fee regulation: ${error.message}`);
    }
  },

  // Admin: Toggle gas fee regulation
  toggleGasFeeRegulation: async (network, isActive, updatedBy) => {
    try {
      const response = await api.patch(`/gas-fee/admin/${network}/toggle`, { isActive, updatedBy });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `Failed to toggle gas fee regulation: ${error.message}`);
    }
  },
};

export default gasFeeAPI;

