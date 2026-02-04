/**
 * Analytics service: uses real trade data from nftTradeModel for marketplace stats and volume trends.
 */
import { nftTradeModel } from '../models/nftTradeModel.js';
import { nftModel } from '../models/nftModel.js';

function getTimeframeCutoff(timeframe) {
  const now = new Date();
  const cutoff = new Date(now);
  switch (timeframe) {
    case '1h': cutoff.setHours(cutoff.getHours() - 1); break;
    case '24h': cutoff.setDate(cutoff.getDate() - 1); break;
    case '7d': cutoff.setDate(cutoff.getDate() - 7); break;
    case '30d': cutoff.setDate(cutoff.getDate() - 30); break;
    case '90d': cutoff.setDate(cutoff.getDate() - 90); break;
    case '1y': cutoff.setFullYear(cutoff.getFullYear() - 1); break;
    default: cutoff.setDate(cutoff.getDate() - 1);
  }
  return cutoff;
}

function getPreviousPeriod(timeframe) {
  const map = { '1h': '1h', '24h': '24h', '7d': '7d', '30d': '30d', '90d': '90d', '1y': '1y' };
  return map[timeframe] || '24h';
}

class AnalyticsServiceStub {
  async getMarketplaceStats(timeframe = '24h') {
    try {
      const cutoff = getTimeframeCutoff(timeframe);
      const trades = await nftTradeModel.find({ createdAt: { $gte: cutoff } }).lean();
      const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0);
      const totalSales = trades.length;
      const uniqueTraders = new Set([...trades.flatMap(t => [t.buyer, t.seller].filter(Boolean))]).size;
      const averagePrice = totalSales > 0 ? totalVolume / totalSales : 0;
      let floorPrice = 0;
      try {
        const withPrice = await nftModel.find({ $or: [{ price: { $gt: 0 } }, { lastPrice: { $gt: 0 } }] }).sort({ price: 1 }).limit(1).select('price lastPrice').lean();
        if (withPrice.length) {
          floorPrice = parseFloat(withPrice[0].price || withPrice[0].lastPrice || 0);
        }
      } catch (_) {}
      return {
        totalVolume: parseFloat(totalVolume.toFixed(6)),
        totalSales,
        averagePrice: parseFloat(averagePrice.toFixed(6)),
        floorPrice: parseFloat(floorPrice.toFixed(6)),
        uniqueTraders,
        newCollections: 0,
        gasStats: {},
        timeframe,
      };
    } catch (e) {
      console.warn('[AnalyticsServiceStub] getMarketplaceStats', e?.message);
      return { totalVolume: 0, totalSales: 0, averagePrice: 0, floorPrice: 0, uniqueTraders: 0, newCollections: 0, gasStats: {}, timeframe };
    }
  }

  async getVolumeTrends(timeframe = '7d', interval = 'daily') {
    try {
      const now = new Date();
      const cutoff = getTimeframeCutoff(timeframe);
      const duration = interval === 'hourly' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const maxIntervals = interval === 'hourly' ? (timeframe === '7d' ? 24 : 24) : (timeframe === '30d' ? 30 : 7);
      const intervals = [];
      let current = new Date(now);
      for (let i = 0; i < maxIntervals; i++) {
        const start = new Date(current.getTime() - duration);
        const periodTrades = await nftTradeModel.find({
          createdAt: { $gte: start, $lt: current },
        }).lean();
        const volume = periodTrades.reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0);
        intervals.unshift({
          timestamp: start.toISOString(),
          date: start.toLocaleDateString(),
          volume: parseFloat(volume.toFixed(6)),
          sales: periodTrades.length,
          avgPrice: periodTrades.length ? parseFloat((volume / periodTrades.length).toFixed(6)) : 0,
        });
        current = start;
      }
      return intervals;
    } catch (e) {
      console.warn('[AnalyticsServiceStub] getVolumeTrends', e?.message);
      return [];
    }
  }

  async getTrendingCollections(limit = 10, timeframe = '7d') {
    return [];
  }
  async getTrendingNfts(limit = 10, timeframe = '7d') {
    return [];
  }
  async getTrendingNFTs(limit = 10, timeframe = '7d') {
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
    try {
      const current = await this.getMarketplaceStats(timeframe);
      const previous = await this.getMarketplaceStats(getPreviousPeriod(timeframe));
      const volumeChange = previous.totalVolume > 0 ? ((current.totalVolume - previous.totalVolume) / previous.totalVolume) * 100 : 0;
      const salesChange = previous.totalSales > 0 ? ((current.totalSales - previous.totalSales) / previous.totalSales) * 100 : 0;
      let sentiment = 'neutral';
      if (volumeChange > 20 || salesChange > 20) sentiment = 'bullish';
      else if (volumeChange < -20 || salesChange < -20) sentiment = 'bearish';
      return { sentiment, volumeChange: parseFloat(volumeChange.toFixed(2)), salesChange: parseFloat(salesChange.toFixed(2)), score: (volumeChange + salesChange) / 2 };
    } catch (_) {
      return { sentiment: 'neutral', volumeChange: 0, salesChange: 0, score: 0 };
    }
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
    try {
      const stats = await this.getMarketplaceStats(timeframe);
      return {
        totalTransactions: stats.totalSales,
        totalValue: stats.totalVolume,
        averageValue: stats.averagePrice,
        medianValue: 0,
        successRate: 95,
      };
    } catch (_) {
      return { totalTransactions: 0, totalValue: 0, averageValue: 0, medianValue: 0, successRate: 95 };
    }
  }
}

export default AnalyticsServiceStub;
