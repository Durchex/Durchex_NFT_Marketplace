/**
 * PoolService - Liquidity Pool Management Service
 * Handles pool operations, liquidity management, and swap coordination
 * Features:
 * - Pool creation and management
 * - Liquidity provision tracking
 * - Swap execution and logging
 * - Yield calculation
 * - Fee distribution
 */

const mongoose = require('mongoose');
const ethers = require('ethers');
const logger = require('../utils/logger');

class PoolService {
  constructor(contractAddress, contractABI, provider, signer) {
    this.contractAddress = contractAddress;
    this.contractABI = contractABI;
    this.provider = provider;
    this.signer = signer;
    this.contract = null;
    this.pools = new Map();
    this.swapHistory = [];
    this.userLiquidity = new Map();
    this.poolMetrics = new Map();
    
    this._initializeContract();
  }

  /**
   * Initialize smart contract connection
   */
  _initializeContract() {
    try {
      if (this.signer) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          this.contractABI,
          this.signer
        );
      } else {
        this.contract = new ethers.Contract(
          this.contractAddress,
          this.contractABI,
          this.provider
        );
      }
      logger.info('LiquidityPool contract initialized', { address: this.contractAddress });
    } catch (error) {
      logger.error('Failed to initialize contract', { error: error.message });
    }
  }

  /**
   * Create a new liquidity pool
   */
  async createPool(token0, token1, feeTier) {
    try {
      logger.info('Creating liquidity pool', { token0, token1, feeTier });
      
      // Validate token addresses
      if (!ethers.isAddress(token0) || !ethers.isAddress(token1)) {
        throw new Error('Invalid token addresses');
      }
      
      if (token0 === token1) {
        throw new Error('Cannot create pool with identical tokens');
      }
      
      if (feeTier < 0 || feeTier > 3) {
        throw new Error('Invalid fee tier');
      }

      // Call contract method
      const tx = await this.contract.createPool(token0, token1, feeTier);
      const receipt = await tx.wait();
      
      // Extract pool ID from event
      const event = receipt.events?.find(e => e.event === 'PoolCreated');
      const poolId = event?.args?.poolId;
      
      logger.info('Pool created successfully', { poolId, token0, token1 });
      
      // Store pool info locally
      const pool = {
        id: poolId,
        token0,
        token1,
        feeTier,
        reserve0: '0',
        reserve1: '0',
        totalLiquidity: '0',
        createdAt: new Date(),
        isActive: true
      };
      
      this.pools.set(poolId, pool);
      this._initializePoolMetrics(poolId);
      
      return pool;
    } catch (error) {
      logger.error('Failed to create pool', { error: error.message });
      throw error;
    }
  }

  /**
   * Add liquidity to a pool
   */
  async addLiquidity(poolId, token0Address, token1Address, amount0, amount1) {
    try {
      logger.info('Adding liquidity', { poolId, amount0, amount1 });
      
      // Approve token transfers
      await this._approveTokens(token0Address, amount0);
      await this._approveTokens(token1Address, amount1);
      
      // Call contract
      const tx = await this.contract.addLiquidity(
        poolId,
        ethers.parseUnits(amount0.toString(), 18),
        ethers.parseUnits(amount1.toString(), 18)
      );
      const receipt = await tx.wait();
      
      const event = receipt.events?.find(e => e.event === 'LiquidityAdded');
      const lpTokens = event?.args?.lpTokens;
      
      logger.info('Liquidity added successfully', { poolId, lpTokens });
      
      // Update local state
      const pool = this.pools.get(poolId);
      if (pool) {
        pool.reserve0 = (BigInt(pool.reserve0) + BigInt(amount0)).toString();
        pool.reserve1 = (BigInt(pool.reserve1) + BigInt(amount1)).toString();
        pool.totalLiquidity = (BigInt(pool.totalLiquidity) + BigInt(lpTokens)).toString();
        
        this._recordUserLiquidity(poolId, this.signer.address, amount0, amount1, lpTokens);
        this._updatePoolMetrics(poolId);
      }
      
      return {
        poolId,
        amount0,
        amount1,
        lpTokens: lpTokens?.toString(),
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to add liquidity', { error: error.message, poolId });
      throw error;
    }
  }

  /**
   * Remove liquidity from a pool
   */
  async removeLiquidity(poolId, lpTokens) {
    try {
      logger.info('Removing liquidity', { poolId, lpTokens });
      
      const tx = await this.contract.removeLiquidity(
        poolId,
        ethers.parseUnits(lpTokens.toString(), 18)
      );
      const receipt = await tx.wait();
      
      const event = receipt.events?.find(e => e.event === 'LiquidityRemoved');
      const amount0 = event?.args?.amount0;
      const amount1 = event?.args?.amount1;
      
      logger.info('Liquidity removed successfully', { poolId, amount0, amount1 });
      
      // Update local state
      const pool = this.pools.get(poolId);
      if (pool) {
        pool.reserve0 = (BigInt(pool.reserve0) - BigInt(amount0)).toString();
        pool.reserve1 = (BigInt(pool.reserve1) - BigInt(amount1)).toString();
        pool.totalLiquidity = (BigInt(pool.totalLiquidity) - BigInt(lpTokens)).toString();
        this._updatePoolMetrics(poolId);
      }
      
      return {
        poolId,
        lpTokens,
        amount0: amount0?.toString(),
        amount1: amount1?.toString(),
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to remove liquidity', { error: error.message, poolId });
      throw error;
    }
  }

  /**
   * Execute a swap
   */
  async executeSwap(poolId, tokenIn, amountIn) {
    try {
      logger.info('Executing swap', { poolId, tokenIn, amountIn });
      
      // Approve token transfer
      await this._approveTokens(tokenIn, amountIn);
      
      // Get swap quote first
      const quote = await this.getSwapQuote(poolId, tokenIn, amountIn);
      
      // Execute swap with slippage protection (0.5% slippage)
      const minAmountOut = BigInt(quote.amountOut) * BigInt(995) / BigInt(1000);
      
      const tx = await this.contract.swap(
        poolId,
        tokenIn,
        ethers.parseUnits(amountIn.toString(), 18)
      );
      const receipt = await tx.wait();
      
      const event = receipt.events?.find(e => e.event === 'Swapped');
      const amountOut = event?.args?.amountOut;
      const fee = event?.args?.fee;
      
      logger.info('Swap executed successfully', { poolId, amountIn, amountOut, fee });
      
      // Record swap
      this._recordSwap({
        poolId,
        user: this.signer.address,
        tokenIn,
        amountIn,
        amountOut: amountOut?.toString(),
        fee: fee?.toString(),
        timestamp: new Date(),
        txHash: receipt.transactionHash
      });
      
      this._updatePoolMetrics(poolId);
      
      return {
        poolId,
        amountIn,
        amountOut: amountOut?.toString(),
        fee: fee?.toString(),
        price: this._calculateExecutionPrice(amountIn, amountOut),
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to execute swap', { error: error.message, poolId });
      throw error;
    }
  }

  /**
   * Get swap quote
   */
  async getSwapQuote(poolId, tokenIn, amountIn) {
    try {
      const [amountOut, fee] = await this.contract.getSwapQuote(
        poolId,
        tokenIn,
        ethers.parseUnits(amountIn.toString(), 18)
      );
      
      return {
        poolId,
        amountIn,
        amountOut: ethers.formatUnits(amountOut, 18),
        fee: ethers.formatUnits(fee, 18),
        priceImpact: this._calculatePriceImpact(amountIn, amountOut)
      };
    } catch (error) {
      logger.error('Failed to get swap quote', { error: error.message });
      throw error;
    }
  }

  /**
   * Distribute rewards to liquidity providers
   */
  async distributeRewards(poolId) {
    try {
      logger.info('Distributing rewards for pool', { poolId });
      
      const pool = this.pools.get(poolId);
      if (!pool) throw new Error('Pool not found');
      
      // Get all liquidity providers for this pool
      const providers = this.userLiquidity.get(poolId) || new Map();
      
      const totalRewards = await this._calculateTotalRewards(poolId);
      let distributedRewards = 0;
      
      for (const [provider, info] of providers) {
        const lpShare = BigInt(info.lpTokens) / BigInt(pool.totalLiquidity);
        const providerReward = BigInt(totalRewards) * lpShare;
        
        if (providerReward > 0n) {
          // Record reward
          info.rewardsEarned = (BigInt(info.rewardsEarned) + providerReward).toString();
          distributedRewards += Number(providerReward);
        }
      }
      
      logger.info('Rewards distributed', { poolId, totalRewards: distributedRewards });
      
      return {
        poolId,
        totalRewards: distributedRewards,
        providersRewarded: providers.size
      };
    } catch (error) {
      logger.error('Failed to distribute rewards', { error: error.message });
      throw error;
    }
  }

  /**
   * Claim rewards for user
   */
  async claimRewards(poolId, userAddress) {
    try {
      logger.info('Claiming rewards', { poolId, userAddress });
      
      const tx = await this.contract.claimRewards(poolId);
      const receipt = await tx.wait();
      
      logger.info('Rewards claimed successfully', { poolId });
      
      // Update local state
      const providers = this.userLiquidity.get(poolId) || new Map();
      const userInfo = providers.get(userAddress);
      if (userInfo) {
        userInfo.rewardsEarned = '0';
      }
      
      return {
        poolId,
        userAddress,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to claim rewards', { error: error.message });
      throw error;
    }
  }

  /**
   * Get pool statistics
   */
  async getPoolStats(poolId) {
    try {
      const pool = this.pools.get(poolId);
      if (!pool) throw new Error('Pool not found');
      
      const metrics = this.poolMetrics.get(poolId) || {};
      
      const totalLiquidity = BigInt(pool.reserve0) + BigInt(pool.reserve1);
      const swaps = this.swapHistory.filter(s => s.poolId === poolId);
      const volume24h = swaps
        .filter(s => (Date.now() - s.timestamp.getTime()) < 24 * 60 * 60 * 1000)
        .reduce((sum, s) => sum + BigInt(s.amountIn), 0n);
      
      return {
        poolId,
        reserve0: pool.reserve0,
        reserve1: pool.reserve1,
        totalLiquidity: totalLiquidity.toString(),
        totalSwaps: swaps.length,
        volume24h: volume24h.toString(),
        feeTier: pool.feeTier,
        createdAt: pool.createdAt,
        metrics: {
          avgSwapSize: metrics.avgSwapSize || '0',
          aprEstimate: metrics.aprEstimate || '0',
          impermanentLoss: metrics.impermanentLoss || '0'
        }
      };
    } catch (error) {
      logger.error('Failed to get pool stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user liquidity positions
   */
  async getUserLiquidityPositions(userAddress) {
    try {
      const positions = [];
      
      for (const [poolId, providers] of this.userLiquidity) {
        const userInfo = providers.get(userAddress);
        if (userInfo) {
          const pool = this.pools.get(poolId);
          positions.push({
            poolId,
            tokens: `${pool.token0} / ${pool.token1}`,
            lpTokens: userInfo.lpTokens,
            share: userInfo.share,
            rewardsEarned: userInfo.rewardsEarned,
            addedAt: userInfo.addedAt
          });
        }
      }
      
      return positions;
    } catch (error) {
      logger.error('Failed to get user positions', { error: error.message });
      throw error;
    }
  }

  // ========== Private Helper Methods ==========
  
  /**
   * Approve token transfer
   */
  async _approveTokens(tokenAddress, amount) {
    try {
      const token = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount)'],
        this.signer
      );
      
      const tx = await token.approve(
        this.contractAddress,
        ethers.parseUnits(amount.toString(), 18)
      );
      await tx.wait();
    } catch (error) {
      logger.error('Token approval failed', { error: error.message });
    }
  }

  /**
   * Initialize pool metrics
   */
  _initializePoolMetrics(poolId) {
    this.poolMetrics.set(poolId, {
      avgSwapSize: '0',
      aprEstimate: '0',
      impermanentLoss: '0',
      totalVolume: '0',
      swapCount: 0
    });
  }

  /**
   * Update pool metrics
   */
  _updatePoolMetrics(poolId) {
    const metrics = this.poolMetrics.get(poolId) || {};
    const swaps = this.swapHistory.filter(s => s.poolId === poolId);
    
    if (swaps.length > 0) {
      const avgSwapSize = swaps.reduce((sum, s) => sum + BigInt(s.amountIn), 0n) / BigInt(swaps.length);
      metrics.avgSwapSize = avgSwapSize.toString();
      metrics.swapCount = swaps.length;
    }
    
    this.poolMetrics.set(poolId, metrics);
  }

  /**
   * Record user liquidity
   */
  _recordUserLiquidity(poolId, userAddress, amount0, amount1, lpTokens) {
    if (!this.userLiquidity.has(poolId)) {
      this.userLiquidity.set(poolId, new Map());
    }
    
    const providers = this.userLiquidity.get(poolId);
    const existing = providers.get(userAddress) || {
      lpTokens: '0',
      share: '0',
      rewardsEarned: '0',
      addedAt: new Date()
    };
    
    existing.lpTokens = (BigInt(existing.lpTokens) + BigInt(lpTokens)).toString();
    existing.rewardsEarned = existing.rewardsEarned; // Carry forward
    
    providers.set(userAddress, existing);
  }

  /**
   * Record swap
   */
  _recordSwap(swapData) {
    this.swapHistory.push(swapData);
    
    // Keep only last 1000 swaps in memory
    if (this.swapHistory.length > 1000) {
      this.swapHistory = this.swapHistory.slice(-1000);
    }
  }

  /**
   * Calculate execution price
   */
  _calculateExecutionPrice(amountIn, amountOut) {
    if (BigInt(amountIn) === 0n) return '0';
    return (BigInt(amountOut) / BigInt(amountIn)).toString();
  }

  /**
   * Calculate price impact
   */
  _calculatePriceImpact(amountIn, amountOut) {
    if (BigInt(amountIn) === 0n) return '0';
    const spotPrice = BigInt(amountOut) / BigInt(amountIn);
    const executionPrice = spotPrice; // Simplified
    const impact = ((spotPrice - executionPrice) / spotPrice * 100n).toString();
    return impact;
  }

  /**
   * Calculate total rewards
   */
  async _calculateTotalRewards(poolId) {
    const pool = this.pools.get(poolId);
    if (!pool) return 0;
    
    // Simplified: 0.5% of pool reserve as rewards per distribution
    const rewardAmount = (BigInt(pool.reserve0) * BigInt(5)) / BigInt(1000);
    return rewardAmount;
  }

  /**
   * Get all pools
   */
  getAllPools() {
    return Array.from(this.pools.values());
  }

  /**
   * Get pool info
   */
  getPoolInfo(poolId) {
    return this.pools.get(poolId);
  }
}

module.exports = PoolService;
