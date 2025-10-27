import { nftAPI } from './api';

// NFT Service for managing NFT data and metadata caching
export class NFTService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generate cache key
  generateCacheKey(network, itemId, tokenId, collection = null) {
    return `${network}-${itemId}-${tokenId}${collection ? `-${collection}` : ''}`;
  }

  // Check if cache is valid
  isCacheValid(timestamp) {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  // Get NFT from cache or API
  async getNFT(network, itemId, tokenId, collection = null) {
    const cacheKey = this.generateCacheKey(network, itemId, tokenId, collection);
    const cached = this.cache.get(cacheKey);

    // Return cached data if valid
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('Returning cached NFT data');
      return cached.data;
    }

    try {
      // Fetch from API
      const nftData = await nftAPI.getSingleNft(network, itemId, tokenId, collection);
      
      // Cache the data
      this.cache.set(cacheKey, {
        data: nftData,
        timestamp: Date.now(),
      });

      return nftData;
    } catch (error) {
      console.error('Failed to fetch NFT:', error);
      throw error;
    }
  }

  // Cache NFT metadata
  async cacheNFTMetadata(nftData) {
    try {
      const cacheData = {
        ...nftData,
        cachedAt: new Date().toISOString(),
      };

      await nftAPI.createNft(cacheData);
      console.log('NFT metadata cached successfully');
    } catch (error) {
      console.error('Failed to cache NFT metadata:', error);
      // Don't throw error as this is not critical
    }
  }

  // Get all NFTs by network
  async getNFTsByNetwork(network) {
    try {
      return await nftAPI.getAllNftsByNetwork(network);
    } catch (error) {
      console.error('Failed to get NFTs by network:', error);
      throw error;
    }
  }

  // Get collections by network
  async getCollectionsByNetwork(network) {
    try {
      return await nftAPI.getCollectionsByNetwork(network);
    } catch (error) {
      console.error('Failed to get collections by network:', error);
      throw error;
    }
  }

  // Update NFT metadata
  async updateNFTMetadata(network, itemId, nftData, collection = null) {
    try {
      if (collection) {
        return await nftAPI.editNftInCollection(network, collection, itemId, nftData);
      } else {
        return await nftAPI.editSingleNft(network, itemId, nftData);
      }
    } catch (error) {
      console.error('Failed to update NFT metadata:', error);
      throw error;
    }
  }

  // Delete NFT from cache
  async deleteNFT(network, itemId, collection = null) {
    try {
      if (collection) {
        return await nftAPI.deleteNftInCollection(network, collection, itemId);
      } else {
        return await nftAPI.deleteSingleNft(network, itemId);
      }
    } catch (error) {
      console.error('Failed to delete NFT:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('NFT cache cleared');
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size;
  }
}

// Create singleton instance
export const nftService = new NFTService();

// Helper function to format NFT data for caching
export const formatNFTForCache = (blockchainData, metadata = {}) => {
  return {
    network: 'ethereum-sepolia', // Default network, should be configurable
    itemId: blockchainData.itemId?.toString(),
    tokenId: blockchainData.tokenId?.toString(),
    contractAddress: blockchainData.nftContract,
    owner: blockchainData.owner,
    seller: blockchainData.seller,
    price: blockchainData.price?.toString(),
    currentlyListed: blockchainData.currentlyListed,
    name: metadata.name || `NFT #${blockchainData.tokenId}`,
    description: metadata.description || '',
    image: metadata.image || '',
    attributes: metadata.attributes || [],
    collection: metadata.collection || null,
    metadata: metadata,
    blockchainData: blockchainData,
    cachedAt: new Date().toISOString(),
  };
};

export default nftService;
