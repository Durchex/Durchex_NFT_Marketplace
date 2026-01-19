// Royalty Registry Service - Backend royalty management and distribution
const { ethers } = require('ethers');
const NodeCache = require('node-cache');

/**
 * RoyaltyService
 * Manages royalty configuration, tracking, and distribution
 */
class RoyaltyService {
  constructor(contractAddress, provider) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    this.cache = new NodeCache({ stdTTL: 300 }); // 5-minute cache

    // ABI for RoyaltyRegistry
    this.abi = [
      'function setCollectionRoyalty(address _collection, tuple(address recipient, uint256 percentage)[] _recipients)',
      'function setNFTRoyalty(address _collection, uint256 _tokenId, tuple(address recipient, uint256 percentage)[] _recipients)',
      'function addRoyaltyRecipient(address _collection, address _recipient, uint256 _percentage)',
      'function removeRoyaltyRecipient(address _collection, address _recipient)',
      'function getRoyaltyInfo(address _collection, uint256 _tokenId, uint256 _salePrice) view returns (address[] recipients, uint256[] amounts)',
      'function recordRoyaltyDistribution(address _collection, uint256 _tokenId, address _recipient, uint256 _amount)',
      'function claimRoyalties(address _collection)',
      'function getCollectionRoyalties(address _collection) view returns (tuple(address recipient, uint256 percentage)[])',
      'function getNFTRoyalties(address _collection, uint256 _tokenId) view returns (tuple(address recipient, uint256 percentage)[])',
      'function getPendingRoyalties(address _recipient, address _collection) view returns (uint256)',
      'function getTotalRoyalties(address _collection) view returns (uint256)',
      'function registerCollection(address _collection)',
    ];

    this.contract = new ethers.Contract(contractAddress, this.abi, provider);
    this.royaltyStats = {
      totalDistributed: 0,
      totalCollections: 0,
      totalRecipients: 0,
      distributionsByCollection: {},
    };
  }

  /**
   * Set collection-level royalties
   */
  async setCollectionRoyalty(collection, recipients, signer) {
    try {
      const cacheKey = `collection_royalty_${collection}`;
      this.cache.del(cacheKey);

      // Validate recipients
      this._validateRecipients(recipients);

      const contract = this.contract.connect(signer);
      const tx = await contract.setCollectionRoyalty(collection, recipients);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Error setting collection royalty:', error);
      throw error;
    }
  }

  /**
   * Set NFT-level royalties (overrides collection)
   */
  async setNFTRoyalty(collection, tokenId, recipients, signer) {
    try {
      const cacheKey = `nft_royalty_${collection}_${tokenId}`;
      this.cache.del(cacheKey);

      // Validate recipients
      this._validateRecipients(recipients);

      const contract = this.contract.connect(signer);
      const tx = await contract.setNFTRoyalty(collection, tokenId, recipients);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Error setting NFT royalty:', error);
      throw error;
    }
  }

  /**
   * Add a royalty recipient to collection
   */
  async addRoyaltyRecipient(collection, recipient, percentage, signer) {
    try {
      const cacheKey = `collection_royalty_${collection}`;
      this.cache.del(cacheKey);

      // Validate
      if (!ethers.isAddress(recipient)) {
        throw new Error('Invalid recipient address');
      }
      if (percentage < 10 || percentage > 5000) {
        throw new Error('Percentage must be between 0.1% and 50%');
      }

      const contract = this.contract.connect(signer);
      const tx = await contract.addRoyaltyRecipient(collection, recipient, percentage);
      const receipt = await tx.wait();

      return {
        success: true,
        recipient,
        percentage,
        transactionHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error('Error adding royalty recipient:', error);
      throw error;
    }
  }

  /**
   * Remove a royalty recipient from collection
   */
  async removeRoyaltyRecipient(collection, recipient, signer) {
    try {
      const cacheKey = `collection_royalty_${collection}`;
      this.cache.del(cacheKey);

      if (!ethers.isAddress(recipient)) {
        throw new Error('Invalid recipient address');
      }

      const contract = this.contract.connect(signer);
      const tx = await contract.removeRoyaltyRecipient(collection, recipient);
      const receipt = await tx.wait();

      return {
        success: true,
        recipient,
        transactionHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error('Error removing royalty recipient:', error);
      throw error;
    }
  }

  /**
   * Get royalty info for a sale
   */
  async getRoyaltyInfo(collection, tokenId, salePrice) {
    try {
      const cacheKey = `royalty_info_${collection}_${tokenId}_${salePrice}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const [recipients, amounts] = await this.contract.getRoyaltyInfo(
        collection,
        tokenId,
        salePrice
      );

      const result = {
        recipients,
        amounts: amounts.map(a => a.toString()),
        totalRoyalty: amounts.reduce((acc, a) => acc + BigInt(a.toString()), 0n).toString(),
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error getting royalty info:', error);
      throw error;
    }
  }

  /**
   * Record royalty distribution
   */
  async recordRoyaltyDistribution(collection, tokenId, recipient, amount, signer) {
    try {
      if (!ethers.isAddress(recipient)) {
        throw new Error('Invalid recipient address');
      }

      const contract = this.contract.connect(signer);
      const tx = await contract.recordRoyaltyDistribution(collection, tokenId, recipient, amount);
      const receipt = await tx.wait();

      // Update stats
      this._updateStats(collection, recipient, amount);

      return {
        success: true,
        collection,
        tokenId,
        recipient,
        amount: amount.toString(),
        transactionHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error('Error recording royalty distribution:', error);
      throw error;
    }
  }

  /**
   * Claim pending royalties
   */
  async claimRoyalties(collection, signer) {
    try {
      const contract = this.contract.connect(signer);
      const tx = await contract.claimRoyalties(collection);
      const receipt = await tx.wait();

      return {
        success: true,
        collection,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Error claiming royalties:', error);
      throw error;
    }
  }

  /**
   * Get collection royalties
   */
  async getCollectionRoyalties(collection) {
    try {
      const cacheKey = `collection_royalty_${collection}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const recipients = await this.contract.getCollectionRoyalties(collection);

      const result = recipients.map(r => ({
        recipient: r.recipient,
        percentage: r.percentage.toString(),
        percentageFormatted: (parseInt(r.percentage) / 100).toFixed(2) + '%',
      }));

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error getting collection royalties:', error);
      throw error;
    }
  }

  /**
   * Get NFT royalties
   */
  async getNFTRoyalties(collection, tokenId) {
    try {
      const cacheKey = `nft_royalty_${collection}_${tokenId}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const recipients = await this.contract.getNFTRoyalties(collection, tokenId);

      const result = recipients.map(r => ({
        recipient: r.recipient,
        percentage: r.percentage.toString(),
        percentageFormatted: (parseInt(r.percentage) / 100).toFixed(2) + '%',
      }));

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error getting NFT royalties:', error);
      throw error;
    }
  }

  /**
   * Get pending royalties for a recipient
   */
  async getPendingRoyalties(recipient, collection) {
    try {
      const cacheKey = `pending_royalties_${recipient}_${collection}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const amount = await this.contract.getPendingRoyalties(recipient, collection);

      const result = {
        amount: amount.toString(),
        amountFormatted: ethers.formatEther(amount) + ' ETH',
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error getting pending royalties:', error);
      throw error;
    }
  }

  /**
   * Get all pending royalties for a recipient across all collections
   */
  async getAllPendingRoyalties(recipient, collections) {
    try {
      const pending = {};
      let totalPending = 0n;

      for (const collection of collections) {
        const amount = await this.contract.getPendingRoyalties(recipient, collection);
        pending[collection] = amount.toString();
        totalPending += BigInt(amount.toString());
      }

      return {
        pending,
        totalPending: totalPending.toString(),
        totalFormatted: ethers.formatEther(totalPending) + ' ETH',
      };
    } catch (error) {
      console.error('Error getting all pending royalties:', error);
      throw error;
    }
  }

  /**
   * Calculate royalties for multiple NFTs
   */
  async calculateBatchRoyalties(sales) {
    try {
      const results = [];

      for (const sale of sales) {
        const royaltyInfo = await this.getRoyaltyInfo(
          sale.collection,
          sale.tokenId,
          sale.salePrice
        );
        results.push({
          ...sale,
          royaltyInfo,
        });
      }

      return results;
    } catch (error) {
      console.error('Error calculating batch royalties:', error);
      throw error;
    }
  }

  /**
   * Get royalty statistics
   */
  getStats() {
    return {
      ...this.royaltyStats,
      cacheSize: Object.keys(this.cache.getStats()).length,
    };
  }

  /**
   * Validate recipients array
   */
  _validateRecipients(recipients) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients array cannot be empty');
    }

    if (recipients.length > 10) {
      throw new Error('Maximum 10 recipients allowed');
    }

    let totalPercentage = 0;

    for (const recipient of recipients) {
      if (!ethers.isAddress(recipient.recipient)) {
        throw new Error(`Invalid recipient address: ${recipient.recipient}`);
      }

      const percentage = parseInt(recipient.percentage);
      if (percentage < 10) {
        throw new Error('Minimum recipient percentage is 0.1% (10 basis points)');
      }

      totalPercentage += percentage;
    }

    if (totalPercentage > 5000) {
      throw new Error('Total royalty percentage cannot exceed 50%');
    }
  }

  /**
   * Update statistics
   */
  _updateStats(collection, recipient, amount) {
    this.royaltyStats.totalDistributed += parseInt(ethers.formatEther(amount));

    if (!this.royaltyStats.distributionsByCollection[collection]) {
      this.royaltyStats.distributionsByCollection[collection] = 0;
      this.royaltyStats.totalCollections++;
    }

    this.royaltyStats.distributionsByCollection[collection] += parseInt(
      ethers.formatEther(amount)
    );
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.flushAll();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

module.exports = RoyaltyService;
