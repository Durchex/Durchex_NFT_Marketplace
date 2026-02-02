/**
 * Minimal MonetizationService stub (ESM) so monetization routes don't 500.
 */
class MonetizationServiceStub {
  async getCreatorEarnings(creatorAddress) { return { total: 0, breakdown: [] }; }
  async getPayoutHistory(userAddress) { return []; }
  async getMonetizationStats(userAddress) { return { totalEarned: 0, royaltyRate: 0, collections: 0, totalSales: 0 }; }
  async getRevenueTrends(userAddress, days) { return []; }
  async sendTip(creatorAddress, amount, message) { return { tipId: '1', amount }; }
  async getTipsReceived(creatorAddress) { return []; }
  async getTipsSent(userAddress) { return []; }
  async createSubscriptionTier(creatorAddress, name, price, benefits) { return { tierId: '1' }; }
  async subscribeToTier(tierId, paymentToken) { return { subscriptionId: '1' }; }
  async cancelSubscription(tierId) { return { cancelled: true }; }
  async getCreatorTiers(creatorAddress) { return []; }
  async getUserSubscriptions(userAddress) { return []; }
  async createMerchandiseItem(creatorAddress, item) { return { itemId: '1' }; }
  async purchaseMerchandise(itemId, buyerAddress, quantity) { return { orderId: '1' }; }
  async getCreatorMerchandise(creatorAddress) { return []; }
  getAllMerchandise() { return []; }
  async requestPayout(userAddress, amount, currency) { return { requestId: '1' }; }
}

export default MonetizationServiceStub;
