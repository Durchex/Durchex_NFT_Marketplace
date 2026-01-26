// Multi-Chain Provider Service - Unified Blockchain API
import { ethers } from 'ethers';
import NodeCache from 'node-cache';

/**
 * MultiChainService - Manages providers for multiple chains and queries
 */
class MultiChainService {
  constructor() {
    this.providers = new Map();
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 min cache
    this.chainConfigs = this.getChainConfigs();
    this.initializeProviders();
    this.requestStats = {
      totalRequests: 0,
      chainRequests: {},
      methodCalls: {},
      errors: 0,
      cacheHits: 0,
    };
  }

  /**
   * Get chain configurations
   */
  getChainConfigs() {
    return {
      ethereum: {
        chainId: 1,
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
        name: 'Ethereum',
        symbol: 'ETH',
        nativeCurrency: 'ETH',
        blockTime: 12,
        explorer: 'https://etherscan.io',
      },
      polygon: {
        chainId: 137,
        rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        name: 'Polygon',
        symbol: 'MATIC',
        nativeCurrency: 'MATIC',
        blockTime: 2,
        explorer: 'https://polygonscan.com',
      },
      arbitrum: {
        chainId: 42161,
        rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
        name: 'Arbitrum',
        symbol: 'ETH',
        nativeCurrency: 'ETH',
        blockTime: 0.25,
        explorer: 'https://arbiscan.io',
      },
      optimism: {
        chainId: 10,
        rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
        name: 'Optimism',
        symbol: 'ETH',
        nativeCurrency: 'ETH',
        blockTime: 2,
        explorer: 'https://optimistic.etherscan.io',
      },
      avalanche: {
        chainId: 43114,
        rpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
        name: 'Avalanche',
        symbol: 'AVAX',
        nativeCurrency: 'AVAX',
        blockTime: 2,
        explorer: 'https://snowtrace.io',
      },
    };
  }

  /**
   * Initialize providers for all chains
   */
  initializeProviders() {
    // Check if ethers is available
    if (!ethers || !ethers.providers) {
      console.error('⚠️  ethers library not available - blockchain providers disabled');
      console.error('   This is usually due to a dependency issue. Check: npm install ethers');
      return;
    }

    for (const [chainName, config] of Object.entries(this.chainConfigs)) {
      try {
        // Try ethers v5 syntax first, fallback to v6
        let provider;
        if (ethers.providers && ethers.providers.JsonRpcProvider) {
          provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
        } else if (ethers.JsonRpcProvider) {
          provider = new ethers.JsonRpcProvider(config.rpcUrl);
        } else {
          console.error(`✗ ethers.JsonRpcProvider not available for ${chainName}`);
          continue;
        }
        
        this.providers.set(chainName, provider);
        console.log(`✓ Initialized ${chainName} provider`);
      } catch (error) {
        console.error(`✗ Failed to initialize ${chainName} provider:`, error.message);
        // Don't throw - allow server to continue without this provider
      }
    }
  }

  /**
   * Get provider for a chain
   */
  getProvider(chainName) {
    const provider = this.providers.get(chainName.toLowerCase());
    if (!provider) {
      throw new Error(`Provider not found for chain: ${chainName}`);
    }
    return provider;
  }

  /**
   * Get all supported chains
   */
  getSupportedChains() {
    return Array.from(this.providers.keys()).map((name) => ({
      name,
      ...this.chainConfigs[name],
    }));
  }

  /**
   * Query balance across chains
   */
  async getMultiChainBalance(address) {
    const cacheKey = `balance_${address}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.requestStats.cacheHits++;
      return cached;
    }

    const balances = {};
    const errors = [];

    try {
      for (const [chainName, provider] of this.providers) {
        try {
          this._recordRequest(chainName, 'getBalance');
          const balance = await provider.getBalance(address);
          balances[chainName] = {
            wei: balance.toString(),
            ether: ethers.utils.formatEther(balance),
          };
        } catch (error) {
          errors.push({ chain: chainName, error: error.message });
          this.requestStats.errors++;
        }
      }

      const result = {
        address,
        balances,
        totalBalances: this._sumBalances(balances),
        errors: errors.length > 0 ? errors : null,
        timestamp: Date.now(),
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      this.requestStats.errors++;
      throw error;
    }
  }

  /**
   * Query NFT balances across chains
   */
  async getMultiChainNFTBalance(address, contractAddresses = {}) {
    const cacheKey = `nft_balance_${address}_${JSON.stringify(contractAddresses)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.requestStats.cacheHits++;
      return cached;
    }

    const nftBalances = {};
    const ERC721_ABI = [
      'function balanceOf(address owner) public view returns (uint256)',
    ];

    for (const [chainName, addresses] of Object.entries(contractAddresses)) {
      nftBalances[chainName] = [];

      try {
        const provider = this.getProvider(chainName);

        for (const contractAddress of addresses) {
          try {
            this._recordRequest(chainName, 'getNFTBalance');
            const contract = new ethers.Contract(
              contractAddress,
              ERC721_ABI,
              provider
            );
            const balance = await contract.balanceOf(address);

            nftBalances[chainName].push({
              contract: contractAddress,
              balance: balance.toString(),
            });
          } catch (error) {
            nftBalances[chainName].push({
              contract: contractAddress,
              error: error.message,
            });
          }
        }
      } catch (error) {
        nftBalances[chainName] = {
          error: error.message,
        };
        this.requestStats.errors++;
      }
    }

    const result = {
      address,
      nftBalances,
      timestamp: Date.now(),
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Get transaction status across chains
   */
  async getTransactionStatus(chainName, txHash) {
    const cacheKey = `tx_status_${chainName}_${txHash}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.requestStats.cacheHits++;
      return cached;
    }

    try {
      this._recordRequest(chainName, 'getTransactionStatus');
      const provider = this.getProvider(chainName);
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return {
          chainName,
          txHash,
          status: 'pending',
          receipt: null,
        };
      }

      const result = {
        chainName,
        txHash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        receipt: {
          blockNumber: receipt.blockNumber,
          blockHash: receipt.blockHash,
          transactionIndex: receipt.transactionIndex,
          from: receipt.from,
          to: receipt.to,
          gasUsed: receipt.gasUsed.toString(),
          cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
          contractAddress: receipt.contractAddress,
          logs: receipt.logs.length,
          confirmations: receipt.confirmations,
        },
        timestamp: Date.now(),
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      this.requestStats.errors++;
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  /**
   * Get gas prices across chains
   */
  async getMultiChainGasPrices() {
    const cacheKey = 'gas_prices';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.requestStats.cacheHits++;
      return cached;
    }

    const gasPrices = {};

    for (const [chainName, provider] of this.providers) {
      try {
        this._recordRequest(chainName, 'getGasPrice');
        const gasPrice = await provider.getGasPrice();
        const gasInGwei = ethers.utils.formatUnits(gasPrice, 'gwei');

        gasPrices[chainName] = {
          wei: gasPrice.toString(),
          gwei: gasInGwei,
          usd: this._estimateGasUSD(gasInGwei, chainName),
        };
      } catch (error) {
        gasPrices[chainName] = { error: error.message };
        this.requestStats.errors++;
      }
    }

    const result = {
      gasPrices,
      timestamp: Date.now(),
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Get token balances across chains
   */
  async getMultiChainTokenBalance(address, tokenAddresses = {}) {
    const cacheKey = `token_balance_${address}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.requestStats.cacheHits++;
      return cached;
    }

    const ERC20_ABI = [
      'function balanceOf(address account) public view returns (uint256)',
      'function decimals() public view returns (uint8)',
    ];

    const tokenBalances = {};

    for (const [chainName, addresses] of Object.entries(tokenAddresses)) {
      tokenBalances[chainName] = [];

      try {
        const provider = this.getProvider(chainName);

        for (const tokenAddress of addresses) {
          try {
            this._recordRequest(chainName, 'getTokenBalance');
            const contract = new ethers.Contract(
              tokenAddress,
              ERC20_ABI,
              provider
            );
            const [balance, decimals] = await Promise.all([
              contract.balanceOf(address),
              contract.decimals(),
            ]);

            tokenBalances[chainName].push({
              token: tokenAddress,
              balance: balance.toString(),
              decimals: decimals,
              formatted: ethers.utils.formatUnits(balance, decimals),
            });
          } catch (error) {
            tokenBalances[chainName].push({
              token: tokenAddress,
              error: error.message,
            });
          }
        }
      } catch (error) {
        tokenBalances[chainName] = { error: error.message };
        this.requestStats.errors++;
      }
    }

    const result = {
      address,
      tokenBalances,
      timestamp: Date.now(),
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Get block information across chains
   */
  async getMultiChainBlockInfo() {
    const cacheKey = 'block_info';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.requestStats.cacheHits++;
      return cached;
    }

    const blockInfo = {};

    for (const [chainName, provider] of this.providers) {
      try {
        this._recordRequest(chainName, 'getBlockInfo');
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);

        blockInfo[chainName] = {
          blockNumber,
          blockHash: block.hash,
          timestamp: block.timestamp,
          miner: block.miner,
          gasLimit: block.gasLimit.toString(),
          gasUsed: block.gasUsed.toString(),
          transactions: block.transactions.length,
        };
      } catch (error) {
        blockInfo[chainName] = { error: error.message };
        this.requestStats.errors++;
      }
    }

    const result = {
      blockInfo,
      timestamp: Date.now(),
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.requestStats,
      cachedKeys: this.cache.keys().length,
      supportedChains: Array.from(this.providers.keys()),
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.flushAll();
  }

  /**
   * Health check all providers
   */
  async healthCheck() {
    const health = {};

    for (const [chainName, provider] of this.providers) {
      try {
        this._recordRequest(chainName, 'healthCheck');
        const blockNumber = await provider.getBlockNumber();
        health[chainName] = {
          status: 'healthy',
          blockNumber,
          lastCheck: Date.now(),
        };
      } catch (error) {
        health[chainName] = {
          status: 'unhealthy',
          error: error.message,
          lastCheck: Date.now(),
        };
        this.requestStats.errors++;
      }
    }

    return health;
  }

  // Helper methods

  /**
   * Record API request for stats
   */
  _recordRequest(chainName, method) {
    this.requestStats.totalRequests++;
    this.requestStats.chainRequests[chainName] =
      (this.requestStats.chainRequests[chainName] || 0) + 1;
    this.requestStats.methodCalls[method] =
      (this.requestStats.methodCalls[method] || 0) + 1;
  }

  /**
   * Sum balances from multiple chains
   */
  _sumBalances(balances) {
    let totalEther = 0;
    for (const chain of Object.values(balances)) {
      if (chain.ether) {
        totalEther += parseFloat(chain.ether);
      }
    }
    return totalEther.toFixed(4);
  }

  /**
   * Estimate gas cost in USD (mock implementation)
   */
  _estimateGasUSD(gasPriceGwei, chainName) {
    // Mock prices - would integrate with real price feed
    const ethPrice = 2000;
    const prices = {
      ethereum: ethPrice,
      polygon: 0.8,
      arbitrum: ethPrice,
      optimism: ethPrice,
      avalanche: 25,
    };

    const gasPrice = prices[chainName] || ethPrice;
    const costPerGasUnit = (gasPriceGwei / 1e9) * gasPrice;
    return (costPerGasUnit * 21000).toFixed(4); // Standard tx
  }
}

export default MultiChainService;
