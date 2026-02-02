import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Volume2, Users } from 'lucide-react';
import Header from '../components/Header';
import { analyticsAPI } from '../services/api';

const FALLBACK_DAILY = [
  { date: 'Jan 12', volume: 245000, sales: 45, avgPrice: 5444 },
  { date: 'Jan 13', volume: 310000, sales: 62, avgPrice: 5000 },
  { date: 'Jan 14', volume: 280000, sales: 58, avgPrice: 4828 },
  { date: 'Jan 15', volume: 345000, sales: 72, avgPrice: 4792 },
  { date: 'Jan 16', volume: 420000, sales: 89, avgPrice: 4719 },
  { date: 'Jan 17', volume: 380000, sales: 76, avgPrice: 5000 },
  { date: 'Jan 18', volume: 510000, sales: 98, avgPrice: 5204 },
];

const FALLBACK_COLLECTIONS = [
  { name: 'Cyber Punks', volume: 1250, floor: 45.5, owners: 2341, items: 10000 },
  { name: 'Digital Canvas', volume: 890, floor: 12.3, owners: 5621, items: 50000 },
  { name: 'Genesis NFTs', volume: 750, floor: 32.8, owners: 1234, items: 5000 },
  { name: 'Virtual Worlds', volume: 620, floor: 8.5, owners: 8901, items: 100000 },
  { name: 'Art Blocks', volume: 510, floor: 2.1, owners: 12334, items: 250000 },
];

const FALLBACK_NETWORKS = [
  { network: 'Ethereum', volume: 3250, sales: 289, avgPrice: 11.2 },
  { network: 'Polygon', volume: 1890, sales: 456, avgPrice: 4.1 },
  { network: 'Arbitrum', volume: 1240, sales: 198, avgPrice: 6.3 },
  { network: 'Base', volume: 560, sales: 87, avgPrice: 6.4 },
];

/**
 * AnalyticsDashboard - Marketplace analytics (live API + fallback mock)
 */
const AnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalVolume: 2890, totalSales: 500, avgPrice: 5780, activeUsers: 2341 });
  const [dailyData, setDailyData] = useState(FALLBACK_DAILY);
  const [topCollections, setTopCollections] = useState(FALLBACK_COLLECTIONS);
  const [networkMetrics, setNetworkMetrics] = useState(FALLBACK_NETWORKS);

  const apiTimeframe = timeframe === '90d' || timeframe === 'all' ? '30d' : timeframe === '24h' ? '24h' : timeframe;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsAPI.getMarketplaceStats(apiTimeframe).catch(() => ({})),
      analyticsAPI.getVolumeTrends(apiTimeframe, 'daily').catch(() => []),
      analyticsAPI.getTrendingCollections(5, apiTimeframe).catch(() => []),
    ])
      .then(([s, trends, collections]) => {
        if (s && (s.totalVolume != null || s.totalSales != null)) {
          setStats((prev) => ({
            totalVolume: s.totalVolume ?? prev.totalVolume,
            totalSales: s.totalSales ?? prev.totalSales,
            avgPrice: s.avgPrice ?? s.averagePrice ?? prev.avgPrice,
            activeUsers: s.activeUsers ?? s.uniqueBuyers ?? prev.activeUsers,
          }));
        }
        if (Array.isArray(trends) && trends.length > 0) {
          setDailyData(trends.map((t) => ({
            date: t.date ?? t.label ?? t.period ?? '',
            volume: t.volume ?? t.totalVolume ?? 0,
            sales: t.sales ?? t.transactionCount ?? 0,
            avgPrice: t.avgPrice ?? t.averagePrice ?? 0,
          })));
        }
        if (Array.isArray(collections) && collections.length > 0) {
          setTopCollections(collections.map((c) => ({
            name: c.name ?? c.collectionName ?? '—',
            volume: c.volume ?? c.totalVolume ?? 0,
            floor: c.floor ?? c.floorPrice ?? 0,
            owners: c.owners ?? c.ownerCount ?? 0,
            items: c.items ?? c.totalSupply ?? 0,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiTimeframe]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Analytics Dashboard</h1>
          <p className="text-gray-400 mb-4">Real-time marketplace metrics and insights</p>
          
          {/* Timeframe Selector */}
          <div className="flex gap-2">
            {['24h', '7d', '30d', '90d', 'all'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg transition ${
                  timeframe === tf
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <p className="text-gray-400 mb-8">Loading analytics…</p>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Total Volume ({timeframe})</span>
                <DollarSign size={20} className="text-green-400" />
              </div>
              <p className="text-3xl font-bold mb-2">{Number(stats.totalVolume).toLocaleString()} ETH</p>
              <p className="text-sm text-green-400 flex items-center">
                <TrendingUp size={16} className="mr-1" />
                +24.5% from previous period
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Total Sales ({timeframe})</span>
                <Volume2 size={20} className="text-blue-400" />
              </div>
              <p className="text-3xl font-bold mb-2">{Number(stats.totalSales).toLocaleString()}</p>
              <p className="text-sm text-green-400 flex items-center">
                <TrendingUp size={16} className="mr-1" />
                +18.2% from previous period
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Avg. Price ({timeframe})</span>
                <TrendingUp size={20} className="text-purple-400" />
              </div>
              <p className="text-3xl font-bold mb-2">{Number(stats.avgPrice).toLocaleString()} USD</p>
              <p className="text-sm text-red-400 flex items-center">
                <TrendingDown size={16} className="mr-1" />
                -3.2% from previous period
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Active Users ({timeframe})</span>
                <Users size={20} className="text-cyan-400" />
              </div>
              <p className="text-3xl font-bold mb-2">{Number(stats.activeUsers).toLocaleString()}</p>
              <p className="text-sm text-green-400 flex items-center">
                <TrendingUp size={16} className="mr-1" />
                +12.8% from previous period
              </p>
            </div>
          </div>

          {/* Volume & Sales Chart */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Volume & Sales Trend</h2>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }}
                  formatter={(value) => value.toLocaleString()}
                />
                <Area type="monotone" dataKey="volume" stroke="#06b6d4" fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Average Price Trend */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Average Price Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Line type="monotone" dataKey="avgPrice" stroke="#a855f7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Network Comparison */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Volume by Network (7d)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={networkMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="network" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }}
                  formatter={(value) => value.toLocaleString()}
                />
                <Legend />
                <Bar dataKey="volume" fill="#06b6d4" />
                <Bar dataKey="sales" fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Collections */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-4">Top Collections (7d Volume)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-700 bg-gray-700/30">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Collection</th>
                    <th className="px-4 py-3 font-semibold">Volume (ETH)</th>
                    <th className="px-4 py-3 font-semibold">Floor Price</th>
                    <th className="px-4 py-3 font-semibold">Owners</th>
                    <th className="px-4 py-3 font-semibold">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {topCollections.map((coll, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/20 transition">
                      <td className="px-4 py-3 font-semibold">{coll.name}</td>
                      <td className="px-4 py-3">{coll.volume.toLocaleString()} ETH</td>
                      <td className="px-4 py-3 text-cyan-400">{coll.floor.toFixed(2)} ETH</td>
                      <td className="px-4 py-3">{coll.owners.toLocaleString()}</td>
                      <td className="px-4 py-3">{coll.items.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Market Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="font-bold mb-2">📈 Trading Activity</h3>
              <p className="text-gray-300 text-sm">
                Trading volume increased 24.5% week-over-week, indicating strong market momentum.
                Average transaction value is up 8.3%.
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="font-bold mb-2">🌐 Network Distribution</h3>
              <p className="text-gray-300 text-sm">
                Ethereum leads with 56% of total volume, followed by Polygon (33%) and Arbitrum (11%).
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="font-bold mb-2">👥 User Engagement</h3>
              <p className="text-gray-300 text-sm">
                Active user count reached 2,341, with average holding period increasing to 45 days.
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="font-bold mb-2">💰 Price Trends</h3>
              <p className="text-gray-300 text-sm">
                Floor prices remain stable with slight consolidation. Top collection showing bullish pressure.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
