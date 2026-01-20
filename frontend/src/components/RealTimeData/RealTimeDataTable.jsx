import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { userAPI, nftAPI } from '../../services/api';

/**
 * RealTimeDataTable - Market data with live trends
 */
const RealTimeDataTable = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    fetchMarketData();
    // Refresh every 5 seconds for "real-time" feel
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      // Get top creators with market data
      const response = await userAPI.get('/top-creators?limit=8');
      const data = response.data || generateMockData();
      
      setTableData(data);
      
      // Generate trend data for the right-side chart
      generateTrendData(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setTableData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const names = ['Edgar Sain', 'Edgar Sain', 'Edgar Sain', 'Edgar Sain', 'Edgar Sain', 'Edgar Sain', 'Edgar Sain', 'Edgar Sain'];
    return names.map((name, idx) => ({
      _id: `creator-${idx}`,
      username: name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}${idx}`,
      floorPrice: (Math.random() * 2 + 0.5).toFixed(2),
      price24h: (Math.random() * 2.5 + 0.3).toFixed(2),
      change: (Math.random() * 20 - 10).toFixed(1),
      volume7d: Math.floor(Math.random() * 1000) + 100,
      volume24h: Math.floor(Math.random() * 500) + 50,
      trending: generateSparklineData()
    }));
  };

  const generateSparklineData = () => {
    return Array(7).fill(0).map((_, i) => ({
      value: Math.random() * 100 + 50
    }));
  };

  const generateTrendData = (data) => {
    const points = Array(24).fill(0).map((_, i) => ({
      hour: `${i}:00`,
      price: Math.random() * 2 + 0.5
    }));
    setTrendData(points);
  };

  if (loading) {
    return (
      <div className="mb-16 animate-pulse">
        <div className="h-96 bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      {/* Header */}
      <h2 className="text-2xl font-bold text-white mb-4">Real-Time Data</h2>

      {/* Table Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-gray-400 text-xs font-semibold">Creator</th>
                  <th className="px-4 py-3 text-left text-gray-400 text-xs font-semibold">Floor Price</th>
                  <th className="px-4 py-3 text-left text-gray-400 text-xs font-semibold">24H Price</th>
                  <th className="px-4 py-3 text-left text-gray-400 text-xs font-semibold">Change</th>
                  <th className="px-4 py-3 text-left text-gray-400 text-xs font-semibold">24H Vol</th>
                  <th className="px-4 py-3 text-left text-gray-400 text-xs font-semibold">7D Vol</th>
                  <th className="px-4 py-3 text-left text-gray-400 text-xs font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-800/50 transition">
                    {/* Creator */}
                    <td className="px-4 py-4 flex items-center gap-3">
                      <img
                        src={row.avatar}
                        alt={row.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-white font-medium text-sm">{row.username}</span>
                    </td>

                    {/* Floor Price */}
                    <td className="px-4 py-4 text-white font-mono text-sm">
                      {row.floorPrice} <span className="text-gray-400 text-xs">ETH</span>
                    </td>

                    {/* 24H Price */}
                    <td className="px-4 py-4 text-white font-mono text-sm">
                      {row.price24h} <span className="text-gray-400 text-xs">ETH</span>
                    </td>

                    {/* Change % */}
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        parseFloat(row.change) >= 0
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {parseFloat(row.change) >= 0 ? '+' : ''}{row.change}%
                      </span>
                    </td>

                    {/* 24H Volume */}
                    <td className="px-4 py-4 text-white font-mono text-sm">
                      {row.volume24h}
                    </td>

                    {/* 7D Volume */}
                    <td className="px-4 py-4 text-white font-mono text-sm">
                      {row.volume7d}
                    </td>

                    {/* Sparkline */}
                    <td className="px-4 py-4">
                      <ResponsiveContainer width={60} height={30}>
                        <LineChart data={row.trending}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#a78bfa"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Large Trend Chart - Right Side */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          <h3 className="text-white font-semibold mb-4">Market Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <XAxis
                dataKey="hour"
                stroke="#666"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#888' }}
              />
              <YAxis
                stroke="#666"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#888' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#a78bfa"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDataTable;
