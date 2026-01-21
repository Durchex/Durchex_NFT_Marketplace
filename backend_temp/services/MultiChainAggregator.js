// Multi-Chain Aggregator - Data aggregation and query service
import MultiChainService from './MultiChainService.js';
import NodeCache from 'node-cache';

/**
 * MultiChainAggregator - Aggregates data from multiple chains
 */
class MultiChainAggregator {
  constructor() {
    this.multiChainService = new MultiChainService();
    this.cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10 min cache
    this.rateLimitStore = new Map();
  }

  /**
   * Get aggregated portfolio across all chains
   */
  async getAggregatedPortfolio(userAddress, options = {}) {
    const cacheKey = `portfolio_${userAddress}`;
    const cached = this.cache.get(cacheKey);
    if (cached && !options.noCache) {
      return cached;
    }

    try {
      const [balances, blockInfo] = await Promise.all([
        this.multiChainService.getMultiChainBalance(userAddress),
        this.multiChainService.getMultiChainBlockInfo(),
      ]);

      const portfolio = {
        address: userAddress,
        chains: balances.balances,
        totalValue: balances.totalBalances,
        chainBreakdown: this._calculateChainBreakdown(balances.balances),
        blockInfo,
        aggregatedAt: new Date().toISOString(),
        errors: balances.errors,
      };

      this.cache.set(cacheKey, portfolio);
      return portfolio;
    } catch (error) {
      throw new Error(`Portfolio aggregation failed: ${error.message}`);
    }
  }

  /**
   * Get aggregated NFT portfolio
   */
  async getAggregatedNFTPortfolio(userAddress, contractsByChain = {}) {
    const cacheKey = `nft_portfolio_${userAddress}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const nftData = await this.multiChainService.getMultiChainNFTBalance(
        userAddress,
        contractsByChain
      );

      const portfolio = {
        address: userAddress,
        nftsByChain: nftData.nftBalances,
        totalNFTs: this._countTotalNFTs(nftData.nftBalances),
        chainBreakdown: this._calculateNFTChainBreakdown(
          nftData.nftBalances
        ),
        aggregatedAt: new Date().toISOString(),
      };

      this.cache.set(cacheKey, portfolio);
      return portfolio;
    } catch (error) {
      throw new Error(`NFT portfolio aggregation failed: ${error.message}`);
    }
  }

  /**
   * Compare token prices across chains
   */
  async compareTokenPrices(tokenAddresses = {}) {
    const priceComparison = {};

    for (const [chainName, addresses] of Object.entries(tokenAddresses)) {
      priceComparison[chainName] = [];

      for (const tokenAddress of addresses) {
        priceComparison[chainName].push({
          token: tokenAddress,
          chain: chainName,
          // Mock price data - would integrate with real price feed
          price: Math.random() * 100,
          volume24h: Math.random() * 1000000,
          change24h: (Math.random() - 0.5) * 20,
        });
      }
    }

    return priceComparison;
  }

  /**
   * Find best gas prices across chains
   */
  async getBestGasPrices() {
    const gasPrices = await this.multiChainService.getMultiChainGasPrices();
    const sorted = [];

    for (const [chain, priceData] of Object.entries(gasPrices.gasPrices)) {
      if (!priceData.error) {
        sorted.push({
          chain,
          gwei: parseFloat(priceData.gwei),
          usd: parseFloat(priceData.usd),
        });
      }
    }

    sorted.sort((a, b) => a.gwei - b.gwei);

    return {
      cheapest: sorted[0] || null,
      mostExpensive: sorted[sorted.length - 1] || null,
      all: sorted,
      timestamp: Date.now(),
    };
  }

  /**
   * Aggregate transaction history across chains
   */
  async getAggregatedTransactionHistory(userAddress, chainNames = []) {
    if (chainNames.length === 0) {
      chainNames = this.multiChainService.getSupportedChains().map(c => c.name);
    }

    const history = {
      address: userAddress,
      transactions: [],
      chainBreakdown: {},
    };

    // This would integrate with existing transaction tracking
    // For now returning structure

    return history;
  }

  /**
   * Get cross-chain arbitrage opportunities
   */
  async getArbitrageOpportunities(tokenAddresses = {}) {
    const opportunities = [];

    const prices = await this.compareTokenPrices(tokenAddresses);

    // Analyze price differences across chains
    for (const [tokenName, chainPrices] of Object.entries(prices)) {
      const sorted = Object.entries(chainPrices).sort(
        (a, b) => a[1].price - b[1].price
      );

      if (sorted.length >= 2) {
        const cheapest = sorted[0];
        const expensive = sorted[sorted.length - 1];
        const spread = ((expensive[1].price - cheapest[1].price) / cheapest[1].price) * 100;

        if (spread > 2) {
          // > 2% spread
          opportunities.push({
            token: tokenName,
            buyChain: cheapest[0],
            buyPrice: cheapest[1].price,
            sellChain: expensive[0],
            sellPrice: expensive[1].price,
            profitMargin: spread.toFixed(2),
            volume24h: expensive[1].volume24h,
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(userId, limit = 100, windowMs = 60000) {
    const key = `ratelimit_${userId}`;
    const now = Date.now();

    if (!this.rateLimitStore.has(key)) {
      this.rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: limit - 1 };
    }

    const record = this.rateLimitStore.get(key);

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return { allowed: true, remaining: limit - 1 };
    }

    record.count++;

    if (record.count > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    return { allowed: true, remaining: limit - record.count };
  }

  /**
   * Get network status
   */
  async getNetworkStatus() {
    const health = await this.multiChainService.healthCheck();
    const gasPrices = await this.multiChainService.getMultiChainGasPrices();

    return {
      providers: health,
      gasPrices: gasPrices.gasPrices,
      timestamp: Date.now(),
    };
  }

  /**
   * Clear aggregated cache
   */
  clearCache() {
    this.cache.flushAll();
    this.multiChainService.clearCache();
  }

  /**
   * Get aggregator statistics
   */
  getStats() {
    return {
      multiChainStats: this.multiChainService.getStats(),
      cachedItems: this.cache.keys().length,
      rateLimitEntries: this.rateLimitStore.size,
    };
  }

  // Helper methods

  /**
   * Calculate chain breakdown percentages
   */
  _calculateChainBreakdown(balances) {
    const total = Object.values(balances).reduce(
      (sum, b) => sum + parseFloat(b.ether || 0),
      0
    );

    const breakdown = {};
    for (const [chain, balance] of Object.entries(balances)) {
      breakdown[chain] = {
        ether: balance.ether,
        percentage: total > 0 ? ((parseFloat(balance.ether) / total) * 100).toFixed(2) : 0,
      };
    }

    return breakdown;
  }

  /**
   * Calculate NFT chain breakdown
   */
  _calculateNFTChainBreakdown(nftBalances) {
    const breakdown = {};
    for (const [chain, balances] of Object.entries(nftBalances)) {
      let total = 0;
      if (Array.isArray(balances)) {
        total = balances.reduce((sum, b) => sum + parseInt(b.balance || 0), 0);
      }
      breakdown[chain] = total;
    }
    return breakdown;
  }

  /**
   * Count total NFTs across chains
   */
  _countTotalNFTs(nftBalances) {
    let total = 0;
    for (const balances of Object.values(nftBalances)) {
      if (Array.isArray(balances)) {
        total += balances.reduce((sum, b) => sum + parseInt(b.balance || 0), 0);
      }
    }
    return total;
  }
}

export default MultiChainAggregator;
