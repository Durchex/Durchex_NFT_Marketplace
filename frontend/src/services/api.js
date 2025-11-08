import axios from 'axios';

// Helper function to normalize URL by removing non-standard ports
function normalizeURL(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Remove port 3000 from production URLs (not accessible from browser)
  // Keep localhost:3000 for development
  if (url.includes(':3000') && !url.includes('localhost')) {
    const normalized = url.replace(':3000', '');
    console.log('[API] Normalized URL (removed port 3000):', url, '→', normalized);
    return normalized;
  }
  
  return url;
}

// Helper function to validate and construct a proper base URL
function getBaseURL() {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  
  // If env variable is set and looks valid, normalize it (remove port 3000 if present)
  if (envBase && typeof envBase === 'string' && (envBase.startsWith('http://') || envBase.startsWith('https://'))) {
    const normalized = normalizeURL(envBase);
    console.log('[API] Using environment variable:', normalized, '(original:', envBase, ')');
    return normalized;
  }
  
  // If we're in the browser, construct from current origin
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // For local development, use localhost:3000
    if (isLocal) {
      const localUrl = 'http://localhost:3000/api/v1';
      console.log('[API] Using local development URL:', localUrl);
      return localUrl;
    }
    
    // For production, construct URL from protocol + hostname (without port)
    // This ensures we use the same domain without port 3000
    // Nginx will proxy /api/ to localhost:3000
    if (hostname && protocol) {
      // Always use protocol + hostname without port for production
      // Standard ports (80/443) are implicit, non-standard ports should be removed
      const productionUrl = `${protocol}//${hostname}/api/v1`;
      console.log('[API] Using production URL (same domain, no port):', productionUrl);
      console.log('[API] Original origin:', window.location.origin, 'port:', port);
      return productionUrl;
    }
  }
  
  // Final fallback
  const fallbackUrl = 'http://localhost:3000/api/v1';
  console.warn('[API] Using fallback URL:', fallbackUrl);
  return fallbackUrl;
}

const resolvedBase = getBaseURL();

// Validate the resolved URL
if (!resolvedBase || !resolvedBase.startsWith('http')) {
  console.error('[API] Invalid base URL detected:', resolvedBase);
  throw new Error(`Invalid API base URL: ${resolvedBase}. Please set VITE_API_BASE_URL environment variable.`);
}

// Log the resolved base URL for debugging
if (typeof window !== 'undefined') {
  console.log('[API] Resolved Base URL:', resolvedBase);
  console.log('[API] Full request example:', `${resolvedBase}/admin/stats`);
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
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
    console.log(`API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
    console.log(`API Config - baseURL: ${config.baseURL}, url: ${config.url}`);
    
    // Validate URL before making request
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      console.error('[API] Invalid request URL detected:', fullUrl);
      console.error('[API] baseURL:', config.baseURL);
      console.error('[API] url:', config.url);
    }
    
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

