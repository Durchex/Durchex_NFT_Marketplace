/**
 * MonetizationService - Creator Monetization and Revenue System
 * Features:
 * - Tips and donations from supporters
 * - Subscription tiers and recurring revenue
 * - Merchandise sales integration
 * - Revenue sharing and payouts
 * - Creator analytics and earnings tracking
 */

const mongoose = require('mongoose');
const ethers = require('ethers');
const logger = require('../utils/logger');

class MonetizationService {
  constructor(contractAddress, contractABI, provider, signer) {
    this.contractAddress = contractAddress;
    this.contractABI = contractABI;
    this.provider = provider;
    this.signer = signer;
    this.contract = null;
    
    this.tips = new Map();
    this.subscriptions = new Map();
    this.merchandise = new Map();
    this.earnings = new Map();
    this.payouts = [];
    
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
      logger.info('CreatorMonetization contract initialized', { address: this.contractAddress });
    } catch (error) {
      logger.error('Failed to initialize contract', { error: error.message });
    }
  }

  // ========== Tips and Donations ==========

  /**
   * Send tip to creator
   */
  async sendTip(creatorAddress, amount, message = '', tokenAddress = null) {
    try {
      logger.info('Sending tip', { creatorAddress, amount, message });
      
      if (!ethers.isAddress(creatorAddress)) {
        throw new Error('Invalid creator address');
      }
      
      if (amount <= 0) {
        throw new Error('Tip amount must be positive');
      }

      // Call contract to send tip
      let tx;
      if (tokenAddress) {
        // ERC20 token tip
        tx = await this.contract.sendTokenTip(
          creatorAddress,
          ethers.parseUnits(amount.toString(), 18),
          tokenAddress
        );
      } else {
        // Native ETH tip
        tx = await this.contract.sendTip(
          creatorAddress,
          { value: ethers.parseUnits(amount.toString(), 18) }
        );
      }
      
      const receipt = await tx.wait();
      
      // Record tip locally
      this._recordTip({
        from: this.signer.address,
        to: creatorAddress,
        amount,
        message,
        timestamp: new Date(),
        txHash: receipt.transactionHash
      });
      
      logger.info('Tip sent successfully', { creatorAddress, amount });
      
      return {
        success: true,
        amount,
        creatorAddress,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to send tip', { error: error.message });
      throw error;
    }
  }

  /**
   * Get tips received by creator
   */
  async getTipsReceived(creatorAddress) {
    try {
      const creatorTips = Array.from(this.tips.values()).filter(
        tip => tip.to.toLowerCase() === creatorAddress.toLowerCase()
      );
      
      const totalAmount = creatorTips.reduce((sum, tip) => sum + tip.amount, 0);
      const tipCount = creatorTips.length;
      
      return {
        tips: creatorTips,
        totalAmount,
        tipCount,
        averageTip: tipCount > 0 ? totalAmount / tipCount : 0
      };
    } catch (error) {
      logger.error('Failed to get tips', { error: error.message });
      throw error;
    }
  }

  /**
   * Get tips sent by user
   */
  async getTipsSent(userAddress) {
    try {
      const userTips = Array.from(this.tips.values()).filter(
        tip => tip.from.toLowerCase() === userAddress.toLowerCase()
      );
      
      return userTips;
    } catch (error) {
      logger.error('Failed to get sent tips', { error: error.message });
      throw error;
    }
  }

  // ========== Subscriptions ==========

  /**
   * Create subscription tier
   */
  async createSubscriptionTier(
    creatorAddress,
    tierName,
    monthlyPrice,
    benefits,
    maxSubscribers = null
  ) {
    try {
      logger.info('Creating subscription tier', { creatorAddress, tierName, monthlyPrice });
      
      if (!ethers.isAddress(creatorAddress)) {
        throw new Error('Invalid creator address');
      }
      
      if (monthlyPrice <= 0) {
        throw new Error('Monthly price must be positive');
      }

      const tierId = ethers.keccak256(
        ethers.solidityPack(
          ['address', 'string', 'uint256'],
          [creatorAddress, tierName, Math.random()]
        )
      );

      const tier = {
        id: tierId,
        creator: creatorAddress,
        name: tierName,
        monthlyPrice,
        benefits: Array.isArray(benefits) ? benefits : [],
        maxSubscribers,
        currentSubscribers: 0,
        isActive: true,
        createdAt: new Date()
      };

      this.subscriptions.set(tierId, tier);
      
      logger.info('Subscription tier created', { tierId, tierName });
      
      return tier;
    } catch (error) {
      logger.error('Failed to create subscription tier', { error: error.message });
      throw error;
    }
  }

  /**
   * Subscribe to creator tier
   */
  async subscribeToTier(tierId, paymentToken) {
    try {
      logger.info('Subscribing to tier', { tierId });
      
      const tier = this.subscriptions.get(tierId);
      if (!tier) {
        throw new Error('Subscription tier not found');
      }
      
      if (tier.maxSubscribers && tier.currentSubscribers >= tier.maxSubscribers) {
        throw new Error('Subscription tier is full');
      }

      // Call contract to subscribe
      const tx = await this.contract.subscribe(
        tierId,
        ethers.parseUnits(tier.monthlyPrice.toString(), 18),
        paymentToken
      );
      
      const receipt = await tx.wait();
      
      tier.currentSubscribers += 1;
      
      // Record in earnings
      this._recordEarning(tier.creator, 'subscription', tier.monthlyPrice, tierId);
      
      logger.info('Subscription successful', { tierId });
      
      return {
        success: true,
        tierId,
        monthlyPrice: tier.monthlyPrice,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to subscribe', { error: error.message });
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(tierId) {
    try {
      logger.info('Cancelling subscription', { tierId });
      
      const tier = this.subscriptions.get(tierId);
      if (!tier) {
        throw new Error('Subscription tier not found');
      }

      const tx = await this.contract.cancelSubscription(tierId);
      const receipt = await tx.wait();
      
      tier.currentSubscribers = Math.max(0, tier.currentSubscribers - 1);
      
      logger.info('Subscription cancelled', { tierId });
      
      return {
        success: true,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to cancel subscription', { error: error.message });
      throw error;
    }
  }

  /**
   * Get subscription tiers for creator
   */
  async getCreatorTiers(creatorAddress) {
    try {
      const creatorTiers = Array.from(this.subscriptions.values()).filter(
        tier => tier.creator.toLowerCase() === creatorAddress.toLowerCase()
      );
      
      return creatorTiers;
    } catch (error) {
      logger.error('Failed to get creator tiers', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(userAddress) {
    try {
      // Get active subscriptions for user
      const subscriptions = Array.from(this.subscriptions.values());
      
      return subscriptions;
    } catch (error) {
      logger.error('Failed to get user subscriptions', { error: error.message });
      throw error;
    }
  }

  // ========== Merchandise ==========

  /**
   * Create merchandise item
   */
  async createMerchandiseItem(
    creatorAddress,
    name,
    description,
    price,
    imageUrl,
    inventory = 100
  ) {
    try {
      logger.info('Creating merchandise item', { creatorAddress, name, price });
      
      const itemId = ethers.keccak256(
        ethers.solidityPack(
          ['address', 'string', 'uint256'],
          [creatorAddress, name, Math.random()]
        )
      );

      const item = {
        id: itemId,
        creator: creatorAddress,
        name,
        description,
        price,
        imageUrl,
        inventory,
        sold: 0,
        isActive: true,
        createdAt: new Date()
      };

      this.merchandise.set(itemId, item);
      
      logger.info('Merchandise item created', { itemId, name });
      
      return item;
    } catch (error) {
      logger.error('Failed to create merchandise', { error: error.message });
      throw error;
    }
  }

  /**
   * Purchase merchandise
   */
  async purchaseMerchandise(itemId, quantity = 1, shippingAddress) {
    try {
      logger.info('Purchasing merchandise', { itemId, quantity });
      
      const item = this.merchandise.get(itemId);
      if (!item) {
        throw new Error('Merchandise item not found');
      }
      
      if (item.sold + quantity > item.inventory) {
        throw new Error('Insufficient inventory');
      }

      const totalPrice = item.price * quantity;

      // Call contract to purchase
      const tx = await this.contract.purchaseMerchandise(
        itemId,
        quantity,
        ethers.parseUnits(totalPrice.toString(), 18)
      );
      
      const receipt = await tx.wait();
      
      item.sold += quantity;
      
      // Record earning
      this._recordEarning(item.creator, 'merchandise', totalPrice, itemId);
      
      logger.info('Merchandise purchased', { itemId, quantity });
      
      return {
        success: true,
        itemId,
        quantity,
        totalPrice,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to purchase merchandise', { error: error.message });
      throw error;
    }
  }

  /**
   * Get creator merchandise
   */
  async getCreatorMerchandise(creatorAddress) {
    try {
      const items = Array.from(this.merchandise.values()).filter(
        item => item.creator.toLowerCase() === creatorAddress.toLowerCase()
      );
      
      return items;
    } catch (error) {
      logger.error('Failed to get creator merchandise', { error: error.message });
      throw error;
    }
  }

  // ========== Earnings and Payouts ==========

  /**
   * Get creator earnings
   */
  async getCreatorEarnings(creatorAddress) {
    try {
      const earnings = this.earnings.get(creatorAddress.toLowerCase()) || {
        tips: 0,
        subscriptions: 0,
        merchandise: 0,
        total: 0,
        transactions: []
      };
      
      return earnings;
    } catch (error) {
      logger.error('Failed to get creator earnings', { error: error.message });
      throw error;
    }
  }

  /**
   * Request payout
   */
  async requestPayout(creatorAddress, payoutAddress, amount) {
    try {
      logger.info('Requesting payout', { creatorAddress, amount });
      
      if (!ethers.isAddress(payoutAddress)) {
        throw new Error('Invalid payout address');
      }

      const tx = await this.contract.requestPayout(
        ethers.parseUnits(amount.toString(), 18),
        payoutAddress
      );
      
      const receipt = await tx.wait();
      
      this.payouts.push({
        creator: creatorAddress,
        amount,
        payoutAddress,
        status: 'pending',
        timestamp: new Date(),
        txHash: receipt.transactionHash
      });
      
      logger.info('Payout requested', { creatorAddress, amount });
      
      return {
        success: true,
        amount,
        payoutAddress,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to request payout', { error: error.message });
      throw error;
    }
  }

  /**
   * Get payout history
   */
  async getPayoutHistory(creatorAddress) {
    try {
      const history = this.payouts.filter(
        payout => payout.creator.toLowerCase() === creatorAddress.toLowerCase()
      );
      
      return history;
    } catch (error) {
      logger.error('Failed to get payout history', { error: error.message });
      throw error;
    }
  }

  // ========== Analytics ==========

  /**
   * Get creator monetization stats
   */
  async getMonetizationStats(creatorAddress) {
    try {
      const tips = await this.getTipsReceived(creatorAddress);
      const tiers = await this.getCreatorTiers(creatorAddress);
      const merchandise = await this.getCreatorMerchandise(creatorAddress);
      const earnings = await this.getCreatorEarnings(creatorAddress);
      
      const totalSubscribers = tiers.reduce((sum, tier) => sum + tier.currentSubscribers, 0);
      const totalMerchandiseSold = merchandise.reduce((sum, item) => sum + item.sold, 0);
      
      return {
        totalEarnings: earnings.total,
        earningsByType: {
          tips: earnings.tips,
          subscriptions: earnings.subscriptions,
          merchandise: earnings.merchandise
        },
        tips: tips.tipCount,
        averageTip: tips.averageTip,
        subscriptionTiers: tiers.length,
        totalSubscribers,
        merchandiseItems: merchandise.length,
        totalMerchandiseSold,
        merchandiseRevenue: earnings.merchandise
      };
    } catch (error) {
      logger.error('Failed to get monetization stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(creatorAddress, daysBack = 30) {
    try {
      const earnings = this.earnings.get(creatorAddress.toLowerCase()) || { transactions: [] };
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      
      const recentTransactions = earnings.transactions.filter(
        tx => new Date(tx.timestamp) >= cutoffDate
      );
      
      // Group by day
      const trends = {};
      recentTransactions.forEach(tx => {
        const date = new Date(tx.timestamp).toISOString().split('T')[0];
        if (!trends[date]) {
          trends[date] = 0;
        }
        trends[date] += tx.amount;
      });
      
      return trends;
    } catch (error) {
      logger.error('Failed to get revenue trends', { error: error.message });
      throw error;
    }
  }

  // ========== Private Helper Methods ==========

  /**
   * Record tip
   */
  _recordTip(tipData) {
    const tipId = ethers.keccak256(ethers.solidityPack(['address', 'uint256'], [tipData.from, Date.now()]));
    this.tips.set(tipId, tipData);
    
    this._recordEarning(tipData.to, 'tips', tipData.amount, tipId);
  }

  /**
   * Record earning
   */
  _recordEarning(creatorAddress, type, amount, referenceId) {
    const key = creatorAddress.toLowerCase();
    
    if (!this.earnings.has(key)) {
      this.earnings.set(key, {
        tips: 0,
        subscriptions: 0,
        merchandise: 0,
        total: 0,
        transactions: []
      });
    }
    
    const earnings = this.earnings.get(key);
    earnings[type] = (earnings[type] || 0) + amount;
    earnings.total += amount;
    earnings.transactions.push({
      type,
      amount,
      timestamp: new Date(),
      referenceId
    });
  }

  /**
   * Get all tips
   */
  getAllTips() {
    return Array.from(this.tips.values());
  }

  /**
   * Get all subscriptions
   */
  getAllSubscriptions() {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get all merchandise
   */
  getAllMerchandise() {
    return Array.from(this.merchandise.values());
  }
}

module.exports = MonetizationService;
