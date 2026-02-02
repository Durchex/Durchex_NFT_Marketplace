/**
 * Minimal AnalyticsService stub (ESM) so analytics routes don't 500.
 */
class AnalyticsServiceStub {
  async getMarketplaceStats(timeframe = '24h') {
    return { totalVolume: 0, totalSales: 0, averagePrice: 0, floorPrice: 0, uniqueTraders: 0, newCollections: 0, gasStats: {}, timeframe };
  }
  async getVolumeTrends(timeframe = '7d', interval = 'daily') {
    return [];
  }
  async getTrendingCollections(limit = 10, timeframe = '7d') {
    return [];
  }
  async getTrendingNfts(limit = 10, timeframe = '7d') {
    return [];
  }
  async getTopCreators(limit = 10, timeframe = '7d') {
    return [];
  }
  async getTopCollectors(limit = 10, timeframe = '7d') {
    return [];
  }
  async getPriceDistribution(timeframe = '7d') {
    return [];
  }
  async getMarketSentiment(timeframe = '7d') {
    return { bullish: 0, bearish: 0, neutral: 0 };
  }
  async getNftMetrics(nftId) {
    return {};
  }
  async getCollectionMetrics(collectionId) {
    return {};
  }
  async getUserMetrics(userAddress, timeframe = '7d') {
    return {};
  }
  async getTransactionMetrics(timeframe = '7d') {
    return {};
  }
}

export default AnalyticsServiceStub;
