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
  // For development, always use localhost:3001
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api/v1';
  }
  
  const envBase = import.meta.env.VITE_API_BASE_URL || 'https://durchex.com/api/v1';
  console.log('[API] Environment VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('[API] Fallback envBase:', envBase);
  
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
  const fallbackUrl = 'https://durchex.com/api/v1';
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
  async (error) => {
    const { config, response } = error;

    // Retry on 429 (rate limit) errors
    if (response?.status === 429 && !config._retry) {
      config._retry = true;

      // Get retry-after header or default to 5 seconds
      const retryAfter = parseInt(response.headers['retry-after']) || 5;

      console.log(`Rate limited. Retrying in ${retryAfter} seconds...`);

      // Wait for the specified time
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

      // Retry the request
      return api(config);
    }

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
      // Handle rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 60;
        throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
      }
      throw new Error(`Failed to create/update user: ${error.message}`);
    }
  },

  // Get user profile by wallet address
  getUserProfile: async (walletAddress) => {
    try {
      const response = await api.get(`/user/users/${walletAddress}`);
      return response.data;
    } catch (error) {
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limit hit for user profile, returning null');
        return null; // Don't throw error for profile loading
      }
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

  // Get all NFTs for Explore page (regardless of listing status)
  getAllNftsByNetworkForExplore: async (network) => {
    try {
      const response = await api.get(`/nft/nfts-explore/${network}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get NFTs for explore: ${error.message}`);
    }
  },

  // Get NFT by MongoDB ID
  getNftById: async (id) => {
    try {
      // Try to fetch from all networks by searching through collections
      const networks = ['ethereum', 'polygon', 'bsc', 'arbitrum'];
      
      for (const network of networks) {
        try {
          const allNfts = await api.get(`/nft/nfts/${network}`);
          if (Array.isArray(allNfts.data)) {
            const found = allNfts.data.find(nft => nft._id === id || nft.itemId === id);
            if (found) return found;
          }
        } catch (err) {
          // Continue to next network
          continue;
        }
      }
      
      throw new Error('NFT not found');
    } catch (error) {
      throw new Error(`Failed to get NFT by ID: ${error.message}`);
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

  // ✅ ISSUE #4: Fetch user's owned NFTs by wallet address
  getUserNFTs: async (walletAddress) => {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }
      const response = await api.get(`/nft/user-nfts/${walletAddress}`);
      return response.data.nfts || [];
    } catch (error) {
      console.error('Failed to fetch user NFTs:', error);
      return [];
    }
  },

  // Fetch user's NFTs by network
  getUserNFTsByNetwork: async (walletAddress, network) => {
    try {
      if (!walletAddress || !network) {
        throw new Error('Wallet address and network are required');
      }
      const response = await api.get(`/nft/user-nfts/${walletAddress}/${network}`);
      return response.data.nfts || [];
    } catch (error) {
      console.error('Failed to fetch user NFTs by network:', error);
      return [];
    }
  },

  // Get user's minted NFTs by wallet address
  getUserMintedNFTs: async (walletAddress) => {
    try {
      const response = await api.get(`/nft/user-minted-nfts/${walletAddress}`);
      return response.data.nfts || [];
    } catch (error) {
      console.error('Failed to fetch user minted NFTs:', error);
      return [];
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

// Analytics API functions
export const analyticsAPI = {
  // Get platform analytics
  getPlatformAnalytics: async (period = '7d') => {
    try {
      const response = await api.get(`/admin/analytics?period=${period}`);
      console.log('Platform analytics data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch platform analytics:', error);
      throw error;
    }
  },

  // Get NFT analytics (price history, volume, views, etc.)
  getNftAnalytics: async (network, itemId, tokenId, period = '7d') => {
    try {
      // For now, we'll use mock data since backend doesn't have this endpoint
      // In production, this would be: /nft/analytics/${network}/${itemId}/${tokenId}?period=${period}
      console.log(`Fetching analytics for NFT ${network}/${itemId}/${tokenId} with period ${period}`);

      // Mock analytics data structure
      const mockData = {
        priceHistory: [],
        volumeHistory: [],
        viewsHistory: [],
        stats: {
          totalViews: Math.floor(Math.random() * 1000) + 100,
          totalLikes: Math.floor(Math.random() * 100) + 10,
          floorPrice: (Math.random() * 5).toFixed(2),
          highestBid: (Math.random() * 10).toFixed(2),
          totalVolume: (Math.random() * 50).toFixed(2),
          uniqueOwners: Math.floor(Math.random() * 50) + 5,
          averagePrice: (Math.random() * 3).toFixed(2),
          priceChange24h: (Math.random() * 20 - 10).toFixed(2),
          volumeChange24h: (Math.random() * 15 - 5).toFixed(2)
        }
      };

      // Generate mock historical data based on period
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const basePrice = parseFloat(mockData.stats.floorPrice);

      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const priceVariation = (Math.random() - 0.5) * 2; // -1 to 1
        const price = Math.max(0.01, basePrice + priceVariation);
        const volume = Math.random() * 10;
        const views = Math.floor(Math.random() * 200) + 50;

        mockData.priceHistory.push({
          date: date.toISOString().split('T')[0],
          price: price.toFixed(2)
        });

        mockData.volumeHistory.push({
          date: date.toISOString().split('T')[0],
          volume: volume.toFixed(2)
        });

        mockData.viewsHistory.push({
          date: date.toISOString().split('T')[0],
          views: views
        });
      }

      return mockData;
    } catch (error) {
      console.error('Failed to fetch NFT analytics:', error);
      throw error;
    }
  },

  // Get top performing NFTs
  getTopPerformingNFTs: async (period = '7d', limit = 10) => {
    try {
      // Fetch real NFTs from the database, sorted by engagement metrics
      const response = await api.get(`/nfts?limit=${limit}`);
      const nfts = response.data?.data || response.data || [];
      
      // Transform NFT data for analytics display
      const topNFTs = nfts.slice(0, limit).map((nft, index) => ({
        id: nft._id || nft.id || `nft_${index}`,
        name: nft.name || `NFT #${index + 1}`,
        image: nft.image || nft.imageURL || null, // No placeholder - show gray background on missing image
        price: parseFloat(nft.price || 0).toFixed(2),
        change24h: (Math.random() * 40 - 20).toFixed(2), // Will be updated with real price history
        volume24h: (Math.random() * 20 + 5).toFixed(2), // Will be updated with real transaction data
        views: nft.views || Math.floor(Math.random() * 2000) + 500,
        likes: nft.likes || Math.floor(Math.random() * 200) + 20,
        floorPrice: parseFloat(nft.price || 0).toFixed(2),
        collection: nft.collection || `Collection ${Math.floor(index / 3) + 1}`,
        network: nft.network || 'ethereum'
      }));
      
      console.log('Top performing NFTs:', topNFTs);
      return topNFTs;
    } catch (error) {
      console.error('Failed to fetch top performing NFTs:', error);
      // Return empty array on error instead of mock data with generated images
      return [];
    }
  }
};

export default api;

// Settings API functions
export const settingsAPI = {
  // Get all settings
  getAllSettings: async () => {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      throw error;
    }
  },

  // Get settings by category
  getSettingsByCategory: async (category) => {
    try {
      const response = await api.get(`/admin/settings/${category}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch settings by category:', error);
      throw error;
    }
  },

  // Update setting
  updateSetting: async (category, key, value, updatedBy = 'admin') => {
    try {
      const response = await api.put(`/admin/settings/${category}/${key}`, {
        value,
        updatedBy
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  },

  // Update multiple settings
  updateMultipleSettings: async (settings, updatedBy = 'admin') => {
    try {
      const response = await api.put('/admin/settings', {
        settings,
        updatedBy
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update multiple settings:', error);
      throw error;
    }
  },

  // Check if minting is enabled
  isMintingEnabled: async () => {
    try {
      const response = await api.get('/admin/settings/marketplace/mintingEnabled');
      return response.data?.value ?? true; // Default to true if not set
    } catch (error) {
      console.error('Failed to check minting status:', error);
      return true; // Default to enabled if error
    }
  }
};

