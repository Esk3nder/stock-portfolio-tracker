import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const portfolioApi = {
  // Get all stock scores
  getScores: async () => {
    try {
      const response = await api.get('/scores');
      return response.data;
    } catch (error) {
      console.error('Error fetching scores:', error);
      throw error;
    }
  },

  // Get portfolio weights
  getPortfolio: async () => {
    try {
      const response = await api.get('/portfolio');
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  },

  // Trigger rebalance
  triggerRebalance: async () => {
    try {
      const response = await api.post('/rebalance');
      return response.data;
    } catch (error) {
      console.error('Error triggering rebalance:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('API health check failed:', error);
      throw error;
    }
  }
};

export default portfolioApi;