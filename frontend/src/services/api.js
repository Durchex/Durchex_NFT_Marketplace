import axios from 'axios';

// Helper function to validate and construct a proper base URL
function getBaseURL() {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  
  // If env variable is set and looks valid, use it
  if (envBase && (envBase.startsWith('http://') || envBase.startsWith('https://'))) {
    return envBase;
  }
  
  // If we're in the browser, construct from current origin
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const origin = window.location.origin;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // For local development, use localhost:3000
    if (isLocal) {
      return 'http://localhost:3000/api/v1';
    }
    
    // For production, try same origin first (for reverse proxy setups)
    // This assumes nginx is proxying /api/ to the backend
    if (origin) {
      // First try: same origin (for reverse proxy like nginx)
      // This is the most common production setup
      return `${origin}/api/v1`;
    }
  }
  
  // Fallback
  return 'http://localhost:3000/api/v1';
}

const resolvedBase = getBaseURL();

// Log the resolved base URL for debugging
if (typeof window !== 'undefined') {
  console.log('[API] Base URL:', resolvedBase);
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: resolvedBase,
  timeout: 30000, // Increased timeout for slow connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle database connection errors gracefully
    if (error.response?.data?.error?.includes('buffering timed out')) {
      console.warn('Database connection timeout - using fallback mode');
      // Return empty data instead of throwing error
      return { data: [] };
    }
    
    return Promise.reject(error);
  }
);

// User API functions
export const userAPI = {
  // Create or update user profile
  createOrUpdateUser: async (userData) => {
    try {
      const response = await api.post('/user/users', userData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create/update user: ${error.message}`);
    }
  },

  // Get user profile by wallet address
  getUserProfile: async (walletAddress) => {
    try {
      const response = await api.get(`/user/users/${walletAddress}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // User not found
      }
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get('/user/users');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get all users: ${error.message}`);
    }
  },

  // Update user profile
  updateUserProfile: async (walletAddress, userData) => {
    try {
      const response = await api.put(`/user/users/${walletAddress}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  },

  // Delete user profile
  deleteUserProfile: async (walletAddress) => {
    try {
      const response = await api.delete(`/user/users/${walletAddress}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete user profile: ${error.message}`);
    }
  },
};

// NFT API functions
export const nftAPI = {
  // Check if NFT exists
  checkNftExists: async (nftData) => {
    try {
      const response = await api.post('/nft/nfts/check', nftData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to check NFT existence: ${error.message}`);
    }
  },

  // Update NFT owner and listing status in backend
  updateNftOwner: async ({ network, itemId, tokenId, newOwner, listed = false }) => {
    try {
      const response = await api.post('/nft/nfts/update-owner', {
        network,
        itemId,
        tokenId,
        newOwner,
        listed,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update NFT owner: ${error.message}`);
    }
  },

  // Create pending transfer record (store buyer address after purchase)
  createPendingTransfer: async ({ network, itemId, nftContract, buyerAddress, sellerAddress, transactionHash }) => {
    try {
      const response = await api.post('/nft/pending-transfers', {
        network,
        itemId,
        nftContract,
        buyerAddress,
        sellerAddress,
        transactionHash,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create pending transfer: ${error.message}`);
    }
  },

  // Get pending transfer (buyer address for an NFT)
  getPendingTransfer: async ({ network, itemId }) => {
    try {
      const response = await api.get(`/nft/pending-transfers/${network}/${itemId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get pending transfer: ${error.message}`);
    }
  },

  // Delete pending transfer after successful transfer
  deletePendingTransfer: async ({ network, itemId }) => {
    try {
      const response = await api.delete(`/nft/pending-transfers/${network}/${itemId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete pending transfer: ${error.message}`);
    }
  },

  // Create NFT record
  createNft: async (nftData) => {
    try {
      const response = await api.post('/nft/nfts', nftData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create NFT: ${error.message}`);
    }
  },

  // Get collections grouped by network
  getCollectionsByNetwork: async (network) => {
    try {
      const response = await api.get(`/nft/collections/${network}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get collections: ${error.message}`);
    }
  },

  // Get all NFTs by network
  getAllNftsByNetwork: async (network) => {
    try {
      const response = await api.get(`/nft/nfts/${network}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get NFTs by network: ${error.message}`);
    }
  },

  // Get NFTs in a specific collection
  getCollectionNfts: async (network, collection) => {
    try {
      const response = await api.get(`/nft/nfts/${network}/collection/${collection}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get collection NFTs: ${error.message}`);
    }
  },

  // Get single NFT
  getSingleNft: async (network, itemId, tokenId, collection = null) => {
    try {
      const url = collection 
        ? `/nft/nft/${network}/${itemId}/${tokenId}/${collection}`
        : `/nft/nft/${network}/${itemId}/${tokenId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get single NFT: ${error.message}`);
    }
  },

  // Get all single NFTs (no collection)
  getSingleNfts: async (network) => {
    try {
      const response = await api.get(`/nft/single-nfts/${network}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get single NFTs: ${error.message}`);
    }
  },

  // Edit single NFT
  editSingleNft: async (network, itemId, nftData) => {
    try {
      const response = await api.patch(`/nft/nft/${network}/${itemId}`, nftData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to edit single NFT: ${error.message}`);
    }
  },

  // Edit NFT in collection
  editNftInCollection: async (network, collection, itemId, nftData) => {
    try {
      const response = await api.patch(`/nft/nft/${network}/${collection}/${itemId}`, nftData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to edit NFT in collection: ${error.message}`);
    }
  },

  // Delete single NFT
  deleteSingleNft: async (network, itemId) => {
    try {
      const response = await api.delete(`/nft/nft/${network}/${itemId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete single NFT: ${error.message}`);
    }
  },

  // Delete NFT in collection
  deleteNftInCollection: async (network, collection, itemId) => {
    try {
      const response = await api.delete(`/nft/nft/${network}/${collection}/${itemId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete NFT in collection: ${error.message}`);
    }
  },
};

// Cart API functions
export const cartAPI = {
  // Add NFT to cart
  addNftToCart: async (cartData) => {
    try {
      const response = await api.post('/cart/cart', cartData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add NFT to cart: ${error.message}`);
    }
  },

  // Get user cart
  getUserCart: async (walletAddress) => {
    try {
      const response = await api.get(`/cart/cart/${walletAddress}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user cart: ${error.message}`);
    }
  },

  // Remove NFT from cart
  removeNftFromCart: async (walletAddress, nftId, contractAddress) => {
    try {
      const response = await api.delete(`/cart/cart/${walletAddress}/${nftId}/${contractAddress}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to remove NFT from cart: ${error.message}`);
    }
  },

  // Clear user cart
  clearUserCart: async (walletAddress) => {
    try {
      const response = await api.delete(`/cart/cart/${walletAddress}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to clear user cart: ${error.message}`);
    }
  },
};

export default api;

