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
    
    // Add Authorization header with wallet address if available
    // Get wallet address from localStorage or window context
    try {
      const walletAddress = localStorage.getItem('walletAddress') || 
                           (typeof window !== 'undefined' && window.ethereum?.selectedAddress) ||
                           null;
      
      if (walletAddress) {
        // Send wallet address as token for authentication
        config.headers['Authorization'] = walletAddress;
      }
    } catch (error) {
      // Silently fail if localStorage is not available
      console.warn('[API] Could not get wallet address for auth:', error);
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

    // Retry on 502/503/504 (Bad Gateway/Service Unavailable/Gateway Timeout) errors
    // These are often temporary gateway issues
    if ((response?.status === 502 || response?.status === 503 || response?.status === 504) && !config._retry) {
      config._retry = true;
      const maxRetries = config._maxRetries || 2; // Default to 2 retries
      const retryCount = config._retryCount || 0;

      if (retryCount < maxRetries) {
        config._retryCount = retryCount + 1;
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s

        console.warn(`Server error ${response.status} (Bad Gateway/Service Unavailable). Retrying in ${retryDelay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));

        // Retry the request
        return api(config);
      } else {
        console.error(`Server error ${response.status} after ${maxRetries} retries. Giving up.`);
      }
    }

    // Log error details
    if (response?.status === 502) {
      console.error('API Response Error (502 Bad Gateway):', {
        url: config?.url,
        baseURL: config?.baseURL,
        message: error.message,
        response: error.response?.data || 'No response data'
      });
    } else {
      console.error('API Response Error:', error.response?.data || error.message);
    }

    // Handle database connection errors gracefully
    if (error.response?.data?.error?.includes('buffering timed out')) {
      console.warn('Database connection timeout - using fallback mode');
      // Return empty data instead of throwing error
      return { data: [] };
    }

    // Handle 502 errors for GET requests by returning empty data (graceful degradation)
    if (response?.status === 502 && config?.method?.toLowerCase() === 'get') {
      console.warn('502 Bad Gateway on GET request - returning empty data for graceful degradation');
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
      const response = await api.get(`/user/users/${walletAddress}`, {
        timeout: 10000, // 10 second timeout for profile requests
      });
      return response.data;
    } catch (error) {
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn(`Timeout fetching user profile for ${walletAddress}, returning null`);
        return null; // Don't throw error for profile loading timeouts
      }
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limit hit for user profile, returning null');
        return null; // Don't throw error for profile loading
      }
      if (error.response?.status === 404) {
        return null; // User not found
      }
      // For other errors, log but don't throw - return null to allow UI to continue
      console.warn(`Failed to get user profile for ${walletAddress}:`, error.message);
      return null;
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

  // Redeem game code (body: { code, walletAddress }). Returns { success: true, points: 1000 }.
  redeemGameCode: async (code, walletAddress) => {
    try {
      const response = await api.post('/user/game-code/redeem', { code: (code || '').trim(), walletAddress: walletAddress || '' });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message;
      throw new Error(msg || 'Failed to redeem game code');
    }
  },

  getGameBalance: async (walletAddress) => {
    try {
      const response = await api.get(`/user/game-balance/${walletAddress || ''}`);
      return response.data?.gameBalance ?? 0;
    } catch (error) {
      return 0;
    }
  },

  syncGameBalance: async (walletAddress, balance) => {
    try {
      await api.patch('/user/game-balance', { walletAddress: (walletAddress || '').toLowerCase(), balance: Math.max(0, Number(balance) || 0) });
    } catch (_) {}
  },
};

// Casino API (provably fair, server-authoritative)
export const casinoAPI = {
  placeBet: async ({ walletAddress, gameId, betAmount, clientSeed, options = {} }) => {
    const response = await api.post('/casino/place-bet', {
      walletAddress: (walletAddress || '').toLowerCase(),
      gameId,
      betAmount: Math.max(0.01, Number(betAmount) || 0),
      clientSeed: clientSeed || undefined,
      options,
    });
    return response.data;
  },
  minesReveal: async ({ walletAddress, roundId, tileIndex }) => {
    const response = await api.post('/casino/mines-reveal', {
      walletAddress: (walletAddress || '').toLowerCase(),
      roundId,
      tileIndex: Number(tileIndex),
    });
    return response.data;
  },
  minesCashout: async ({ walletAddress, roundId, revealedIndices = [] }) => {
    const response = await api.post('/casino/mines-cashout', {
      walletAddress: (walletAddress || '').toLowerCase(),
      roundId,
      revealedIndices,
    });
    return response.data;
  },
  getRound: async (roundId) => {
    const response = await api.get(`/casino/round/${roundId}`);
    return response.data;
  },
  getConfig: async () => {
    const response = await api.get('/casino/config');
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/casino/analytics');
    return response.data;
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
      const response = await api.get(`/nft/nfts/${network}`, {
        _maxRetries: 2 // Allow up to 2 retries for this endpoint
      });
      return response.data || [];
    } catch (error) {
      // For 502 errors, return empty array instead of throwing (graceful degradation)
      if (error.response?.status === 502) {
        console.warn(`[getAllNftsByNetwork] 502 Bad Gateway for network ${network}. Returning empty array.`);
        return [];
      }
      console.error(`[getAllNftsByNetwork] Error fetching NFTs for network ${network}:`, error.message);
      // Return empty array instead of throwing to prevent UI breakage
      return [];
    }
  },

  // Get all NFTs for Explore page (regardless of listing status)
  getAllNftsByNetworkForExplore: async (network) => {
    try {
      const response = await api.get(`/nft/nfts-explore/${network}`, {
        _maxRetries: 2 // Allow up to 2 retries for this endpoint
      });
      return response.data || [];
    } catch (error) {
      // For 502 errors, return empty array instead of throwing (graceful degradation)
      if (error.response?.status === 502) {
        console.warn(`[getAllNftsByNetworkForExplore] 502 Bad Gateway for network ${network}. Returning empty array.`);
        return [];
      }
      console.error(`[getAllNftsByNetworkForExplore] Error fetching NFTs for network ${network}:`, error.message);
      // Return empty array instead of throwing to prevent UI breakage
      return [];
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

  // ============ COLLECTION METHODS ============
  
  // Create a new collection
  createCollection: async (collectionData) => {
    try {
      const response = await api.post('/nft/collections', collectionData);
      return response.data;
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw new Error(`Failed to create collection: ${error.message}`);
    }
  },

  // Get a single collection by ID
  getCollection: async (collectionId) => {
    try {
      const response = await api.get(`/nft/collections/${collectionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get collection:', error);
      throw new Error(`Failed to get collection: ${error.message}`);
    }
  },

  // Get all NFTs in a collection
  getCollectionNFTs: async (collectionId) => {
    try {
      const response = await api.get(`/nft/collections/${collectionId}/nfts`);
      return response.data;
    } catch (error) {
      console.error('Failed to get collection NFTs:', error);
      throw new Error(`Failed to get collection NFTs: ${error.message}`);
    }
  },

  // Update a collection
  updateCollection: async (collectionId, collectionData) => {
    try {
      const response = await api.patch(`/nft/collections/${collectionId}`, collectionData);
      return response.data;
    } catch (error) {
      console.error('Failed to update collection:', error);
      throw new Error(`Failed to update collection: ${error.message}`);
    }
  },

  // Delete a collection
  deleteCollection: async (collectionId) => {
    try {
      const response = await api.delete(`/nft/collections/${collectionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete collection:', error);
      throw new Error(`Failed to delete collection: ${error.message}`);
    }
  },

  // Get user's collections
  getUserCollections: async (walletAddress) => {
    try {
      const response = await api.get(`/nft/collections/user/${walletAddress}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch user collections:', error);
      return [];
    }
  },

  // Get all collections (for Collections page)
  getCollections: async () => {
    try {
      const response = await api.get(`/nft/collections`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch all collections:', error);
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
  // Get top creators
  getTopCreators: async (limit = 10, timeframe = '7d') => {
    try {
      const response = await api.get(`/analytics/top-creators?limit=${limit}&timeframe=${timeframe}`);
      console.log('Top creators data received:', response.data);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch top creators:', error);
      throw error;
    }
  },

  // Get trending NFTs
  getTrendingNFTs: async (limit = 12, timeframe = '7d') => {
    try {
      const response = await api.get(`/analytics/trending-nfts?limit=${limit}&timeframe=${timeframe}`);
      console.log('Trending NFTs data received:', response.data);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch trending NFTs:', error);
      throw error;
    }
  },

  // Get trending collections
  getTrendingCollections: async (limit = 10, timeframe = '7d') => {
    try {
      const response = await api.get(`/analytics/trending-collections?limit=${limit}&timeframe=${timeframe}`);
      console.log('Trending collections data received:', response.data);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch trending collections:', error);
      throw error;
    }
  },

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

// Auction API functions
export const auctionAPI = {
  // Get active auctions
  getActiveAuctions: async (limit = 6) => {
    try {
      const response = await api.get(`/auction/active?limit=${limit}`);
      console.log('Active auctions data received:', response.data);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch active auctions:', error);
      throw error;
    }
  },

  // Get auction by ID
  getAuctionById: async (auctionId) => {
    try {
      const response = await api.get(`/auction/${auctionId}`);
      console.log('Auction details received:', response.data);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to fetch auction:', error);
      throw error;
    }
  },

  // Get auction bid history
  getBidHistory: async (auctionId) => {
    try {
      const response = await api.get(`/auction/${auctionId}/bids`);
      console.log('Auction bid history received:', response.data);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch bid history:', error);
      throw error;
    }
  },

  // Place a bid on auction
  placeBid: async (auctionId, bidData) => {
    try {
      const response = await api.post(`/auction/${auctionId}/bid`, bidData);
      console.log('Bid placed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to place bid:', error);
      throw error;
    }
  }
};

// Order API functions
export const orderAPI = {
  // Create a new order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  },

  // Get user's orders (as buyer)
  getUserOrders: async (walletAddress) => {
    try {
      const response = await api.get(`/orders/buyer/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      return [];
    }
  },

  // Get seller's orders
  getSellerOrders: async (walletAddress) => {
    try {
      const response = await api.get(`/orders/seller/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch seller orders:', error);
      return [];
    }
  },

  // Get all orders for a specific NFT
  getNFTOrders: async (contractAddress, nftId) => {
    try {
      const response = await api.get(`/orders/nft/${contractAddress}/${nftId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch NFT orders:', error);
      return [];
    }
  },

  // Confirm payment
  confirmPayment: async (orderId, transactionHash, status = 'completed') => {
    try {
      const response = await api.post('/orders/confirm-payment', {
        orderId,
        transactionHash,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status, transactionHash = null) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, {
        status,
        transactionHash
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId, reason = '') => {
    try {
      const response = await api.post('/orders/cancel', {
        orderId,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw error;
    }
  }
};

// Offer API functions
export const offerAPI = {
  // Create a new offer
  createOffer: async (offerData) => {
    try {
      const response = await api.post('/offers', offerData);
      return response.data;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  },

  // Get offer by ID
  getOfferById: async (offerId) => {
    try {
      const response = await api.get(`/offers/${offerId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch offer:', error);
      throw error;
    }
  },

  // Get all offers for a specific NFT
  getNFTOffers: async (contractAddress, nftId) => {
    try {
      const response = await api.get(`/offers/nft/${contractAddress}/${nftId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch NFT offers:', error);
      return [];
    }
  },

  // Get user's offers (made by user)
  getUserOffers: async (walletAddress) => {
    try {
      const response = await api.get(`/offers/user/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user offers:', error);
      return [];
    }
  },

  // Get offers received by user (offers on NFTs they own)
  getReceivedOffers: async (walletAddress) => {
    try {
      const response = await api.get(`/offers/received/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch received offers:', error);
      return [];
    }
  },

  // Accept an offer
  acceptOffer: async (offerId) => {
    try {
      const response = await api.post(`/offers/${offerId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Failed to accept offer:', error);
      throw error;
    }
  },

  // Reject an offer
  rejectOffer: async (offerId, reason = '') => {
    try {
      const response = await api.post(`/offers/${offerId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error('Failed to reject offer:', error);
      throw error;
    }
  },

  // Cancel an offer (by maker)
  cancelOffer: async (offerId) => {
    try {
      const response = await api.post(`/offers/${offerId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Failed to cancel offer:', error);
      throw error;
    }
  },

  // Update offer price
  updateOfferPrice: async (offerId, newPrice, newAmount) => {
    try {
      const response = await api.patch(`/offers/${offerId}/update-price`, {
        newPrice,
        newAmount
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update offer price:', error);
      throw error;
    }
  }
};

// NFT Listing Request API
export const listingRequestAPI = {
  // Create a new listing request
  createRequest: async (requestData) => {
    try {
      const response = await api.post('/nft-listing-requests/requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Failed to create listing request:', error);
      throw error;
    }
  },

  // Get requests received by a creator
  getCreatorRequests: async (walletAddress, status = 'pending') => {
    try {
      const response = await api.get('/nft-listing-requests/creator/requests', {
        params: {
          walletAddress,
          status
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch creator requests:', error);
      throw error;
    }
  },

  // Get requests sent by a user
  getUserSentRequests: async (walletAddress) => {
    try {
      const response = await api.get('/nft-listing-requests/requests/sent', {
        params: {
          walletAddress
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sent requests:', error);
      throw error;
    }
  },

  // Get specific request by ID
  getRequestById: async (requestId) => {
    try {
      const response = await api.get(`/nft-listing-requests/requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch request:', error);
      throw error;
    }
  },

  // Approve a listing request (Admin/Creator)
  approveRequest: async (requestId, approvalNotes) => {
    try {
      const response = await api.post(
        `/nft-listing-requests/admin/requests/${requestId}/approve`,
        {
          approvedBy: 'admin',
          approvalNotes: approvalNotes || ''
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to approve request:', error);
      throw error;
    }
  },

  // Reject a listing request
  rejectRequest: async (requestId, rejectionReason) => {
    try {
      const response = await api.post(
        `/nft-listing-requests/admin/requests/${requestId}/reject`,
        {
          rejectionReason
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to reject request:', error);
      throw error;
    }
  },

  // Cancel a listing request (User)
  cancelRequest: async (requestId, requesterWallet) => {
    try {
      const response = await api.post(
        `/nft-listing-requests/requests/${requestId}/cancel`,
        {
          requesterWallet
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to cancel request:', error);
      throw error;
    }
  },

  // Get all requests (Admin dashboard)
  getAllRequests: async (status, limit = 50, page = 1) => {
    try {
      const response = await api.get('/nft-listing-requests/admin/requests', {
        params: {
          status,
          limit,
          page
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all requests:', error);
      throw error;
    }
  }
};

// Engagement API (Likes, Follows, Views, Shares)
export const engagementAPI = {
  // NFT Likes
  likeNFT: async (nftId, itemId, contractAddress, network, userWallet) => {
    try {
      const response = await api.post('/engagement/likes/nft', {
        nftId,
        itemId,
        contractAddress,
        network,
        userWallet
      });
      return response.data;
    } catch (error) {
      console.error('Failed to like NFT:', error);
      throw error;
    }
  },

  unlikeNFT: async (nftId, network, userWallet) => {
    try {
      const response = await api.delete('/engagement/likes/nft', {
        data: {
          nftId,
          network,
          userWallet
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to unlike NFT:', error);
      throw error;
    }
  },

  isNFTLiked: async (nftId, userWallet) => {
    try {
      const response = await api.get('/engagement/likes/nft/check', {
        params: {
          nftId,
          userWallet
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to check like status:', error);
      throw error;
    }
  },

  // Collection Likes
  likeCollection: async (collectionId, collectionName, network, userWallet) => {
    try {
      const response = await api.post('/engagement/likes/collection', {
        collectionId,
        collectionName,
        network,
        userWallet
      });
      return response.data;
    } catch (error) {
      console.error('Failed to like collection:', error);
      throw error;
    }
  },

  unlikeCollection: async (collectionId, network, userWallet) => {
    try {
      const response = await api.delete('/engagement/likes/collection', {
        data: {
          collectionId,
          network,
          userWallet
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to unlike collection:', error);
      throw error;
    }
  },

  // Creator Follows
  followCreator: async (creatorWallet, followerWallet, followerName) => {
    try {
      const response = await api.post('/engagement/follow', {
        creatorWallet,
        followerWallet,
        followerName
      });
      return response.data;
    } catch (error) {
      console.error('Failed to follow creator:', error);
      throw error;
    }
  },

  unfollowCreator: async (creatorWallet, followerWallet) => {
    try {
      const response = await api.delete('/engagement/follow', {
        data: {
          creatorWallet,
          followerWallet
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to unfollow creator:', error);
      throw error;
    }
  },

  isFollowingCreator: async (creatorWallet, followerWallet) => {
    try {
      const response = await api.get('/engagement/follow/check', {
        params: {
          creatorWallet,
          followerWallet
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to check follow status:', error);
      throw error;
    }
  },

  getCreatorFollowers: async (creatorWallet, limit = 50, page = 1) => {
    try {
      const response = await api.get(`/engagement/followers/${creatorWallet}`, {
        params: {
          limit,
          page
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch followers:', error);
      throw error;
    }
  },

  getFollowingList: async (followerWallet, limit = 50, page = 1) => {
    try {
      const response = await api.get(`/engagement/following/${followerWallet}`, {
        params: {
          limit,
          page
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch following list:', error);
      throw error;
    }
  },

  // View Tracking
  trackNFTView: async (nftId, itemId, contractAddress, network, userWallet) => {
    try {
      const response = await api.post('/engagement/views/nft', {
        nftId,
        itemId,
        contractAddress,
        network,
        userWallet
      });
      return response.data;
    } catch (error) {
      console.error('Failed to track view:', error);
      throw error;
    }
  },

  trackCollectionView: async (collectionId, collectionName, network, userWallet) => {
    try {
      const response = await api.post('/engagement/views/collection', {
        collectionId,
        collectionName,
        network,
        userWallet
      });
      return response.data;
    } catch (error) {
      console.error('Failed to track collection view:', error);
      throw error;
    }
  },

  // Share Tracking
  trackNFTShare: async (nftId, itemId, contractAddress, network, userWallet, shareMethod = 'link_copy') => {
    try {
      const response = await api.post('/engagement/shares/nft', {
        nftId,
        itemId,
        contractAddress,
        network,
        userWallet,
        shareMethod
      });
      return response.data;
    } catch (error) {
      console.error('Failed to track share:', error);
      throw error;
    }
  },

  // Get Engagement Stats
  getStats: async (entityType, entityId, network) => {
    try {
      const response = await api.get('/engagement/stats', {
        params: {
          entityType,
          entityId,
          network
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      throw error;
    }
  }
};

// Cover Photo API
export const coverPhotoAPI = {
  // User cover photos
  updateUserCoverPhoto: async (walletAddress, coverPhotoUrl) => {
    try {
      const response = await api.post('/cover-photos/user/cover-photo', {
        walletAddress,
        coverPhotoUrl
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update cover photo:', error);
      throw error;
    }
  },

  removeUserCoverPhoto: async (walletAddress) => {
    try {
      const response = await api.delete('/cover-photos/user/cover-photo', {
        data: { walletAddress }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to remove cover photo:', error);
      throw error;
    }
  },

  getUserProfile: async (walletAddress) => {
    try {
      const response = await api.get(`/cover-photos/user/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  // Collection cover photos
  updateCollectionCoverPhoto: async (collectionId, coverPhotoUrl) => {
    try {
      const response = await api.post('/cover-photos/collection/cover-photo', {
        collectionId,
        coverPhotoUrl
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update collection cover photo:', error);
      throw error;
    }
  },

  removeCollectionCoverPhoto: async (collectionId) => {
    try {
      const response = await api.delete('/cover-photos/collection/cover-photo', {
        data: { collectionId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to remove collection cover photo:', error);
      throw error;
    }
  },

  updateCollectionBanner: async (collectionId, bannerUrl) => {
    try {
      const response = await api.post('/cover-photos/collection/banner', {
        collectionId,
        bannerUrl
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update collection banner:', error);
      throw error;
    }
  },

  // Get collection cover photo (renamed from getCollection to avoid conflict)
  getCollectionCoverPhoto: async (collectionId) => {
    try {
      const response = await api.get(`/cover-photos/collection/${collectionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch collection cover photo:', error);
      throw error;
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

// Marketplace settings: sale fee % and treasury wallet per network (stored in DB)
export const marketplaceSettingsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/settings/marketplace');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch marketplace settings:', error);
      throw error;
    }
  },
  getByNetwork: async (network) => {
    try {
      const response = await api.get(`/settings/marketplace/${encodeURIComponent(String(network).toLowerCase())}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch marketplace settings for network:', error);
      throw error;
    }
  },
  upsert: async (network, { saleFeeBps, treasuryWallet, updatedBy }) => {
    try {
      const response = await api.put(`/settings/marketplace/${encodeURIComponent(String(network).toLowerCase())}`, {
        saleFeeBps,
        treasuryWallet,
        updatedBy,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upsert marketplace settings:', error);
      throw error;
    }
  }
};

// Lazy Mint API functions
export const lazyMintAPI = {
  // Get creator's current nonce
  getCreatorNonce: async (creatorAddress) => {
    try {
      const response = await api.get(`/lazy-mint/creator/${creatorAddress}/nonce`);
      return response.data;
    } catch (error) {
      console.error('Failed to get creator nonce:', error);
      throw error;
    }
  },

  // Create voucher (prepare signing message)
  createVoucher: async (data) => {
    try {
      const response = await api.post('/lazy-mint/create-voucher', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create voucher:', error);
      throw error;
    }
  },

  // Submit lazy mint (after signing)
  submitLazyMint: async (data) => {
    try {
      const response = await api.post('/lazy-mint/submit', data);
      return response.data;
    } catch (error) {
      console.error('Failed to submit lazy mint:', error);
      throw error;
    }
  },

  // Get creator's lazy mints
  getCreatorLazyMints: async (creatorAddress, page = 1) => {
    try {
      const response = await api.get(`/lazy-mint/creator/${creatorAddress}?page=${page}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get creator lazy mints:', error);
      throw error;
    }
  },

  // Get available lazy mints (marketplace)
  getAvailable: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(`/lazy-mint/available?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get available lazy mints:', error);
      throw error;
    }
  },

  // Get specific lazy mint by ID
  getLazyMint: async (id) => {
    try {
      const response = await api.get(`/lazy-mint/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get lazy mint:', error);
      throw error;
    }
  },

  // Like a lazy mint
  likeLazyMint: async (id) => {
    try {
      const response = await api.post(`/lazy-mint/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Failed to like lazy mint:', error);
      throw error;
    }
  },

  // Unlike a lazy mint
  unlikeLazyMint: async (id) => {
    try {
      const response = await api.post(`/lazy-mint/${id}/unlike`);
      return response.data;
    } catch (error) {
      console.error('Failed to unlike lazy mint:', error);
      throw error;
    }
  },

  // Get redemption data for buy & mint (requires wallet connected – auth). quantity = pieces to buy.
  redeem: async (lazyNftId, salePrice, quantity = 1) => {
    try {
      const response = await api.post(`/lazy-mint/${lazyNftId}/redeem`, { salePrice, quantity });
      return response.data;
    } catch (error) {
      console.error('Failed to get lazy mint redemption data:', error);
      throw error;
    }
  },

  // Confirm redemption after on-chain mint (requires wallet connected – auth). For multi-piece pass firstTokenId + quantity.
  confirmRedemption: async (lazyNftId, { tokenId, firstTokenId, quantity, transactionHash, salePrice }) => {
    try {
      const response = await api.post(`/lazy-mint/${lazyNftId}/confirm-redemption`, {
        tokenId,
        firstTokenId,
        quantity,
        transactionHash,
        salePrice,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to confirm lazy mint redemption:', error);
      throw error;
    }
  },
};

// Batch Mint API functions
export const batchMintAPI = {
  // Create batch mint
  createBatch: async (data) => {
    try {
      const response = await api.post('/batch-mint', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create batch mint:', error);
      throw error;
    }
  },

  // Get batch mint details
  getBatch: async (batchId) => {
    try {
      const response = await api.get(`/batch-mint/${batchId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get batch mint:', error);
      throw error;
    }
  },

  // Get batch statistics
  getBatchStats: async (batchId) => {
    try {
      const response = await api.get(`/batch-mint/${batchId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get batch stats:', error);
      throw error;
    }
  },

  // Get user's batch history
  getUserBatches: async (page = 1, limit = 10, status = null) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (status) params.append('status', status);
      const response = await api.get(`/batch-mint/user/history?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user batches:', error);
      throw error;
    }
  },

  // Publish batch NFTs
  publishBatch: async (batchId, listings) => {
    try {
      const response = await api.post(`/batch-mint/${batchId}/publish`, { listings });
      return response.data;
    } catch (error) {
      console.error('Failed to publish batch:', error);
      throw error;
    }
  },

  // Cancel batch mint
  cancelBatch: async (batchId) => {
    try {
      const response = await api.post(`/batch-mint/${batchId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Failed to cancel batch:', error);
      throw error;
    }
  },

  // Download CSV template
  getTemplate: async () => {
    try {
      const response = await api.get('/batch-mint/template', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get template:', error);
      throw error;
    }
  }
};

// Reviews API – users must be signed in (wallet connected) to submit
export const reviewsAPI = {
  getReviews: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/reviews', { params: { page, limit } });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      throw error;
    }
  },
  getStats: async () => {
    try {
      const response = await api.get('/reviews/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch review stats:', error);
      throw error;
    }
  },
  createReview: async (data) => {
    try {
      const response = await api.post('/reviews', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create review:', error);
      throw error;
    }
  }
};

