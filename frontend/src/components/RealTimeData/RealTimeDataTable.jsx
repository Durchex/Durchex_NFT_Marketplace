import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { analyticsAPI } from '../../services/api';

/**
 * RealTimeDataTable - Real NFT data with simulated price movements
 */
const RealTimeDataTable = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    fetchMarketData();
    // Simulate price updates every 5 seconds
    const interval = setInterval(() => {
      setTableData(prevData => 
        prevData.map(item => ({
          ...item,
          price24h: (Math.random() * 2.5 + 0.3).toFixed(2),
          change: (Math.random() * 20 - 10).toFixed(1),
          volume24h: Math.floor(Math.random() * 500) + 50,
          trending: generateSparklineData()
        }))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      console.log('[RealTimeDataTable] Fetching trending NFTs...');
      // Fetch real trending NFTs
      const data = await analyticsAPI.getTrendingNFTs(8, '7d');
      console.log('[RealTimeDataTable] Response:', data);
      
      let nftList = [];
      if (data && Array.isArray(data) && data.length > 0) {
        nftList = data;
      } else if (data && data.nfts) {
        nftList = data.nfts;
      } else {
        nftList = generateMockData();
      }
      
      // Enrich with market data
      const enrichedData = nftList.map(nft => ({
        ...nft,
        floorPrice: (Math.random() * 2 + 0.5).toFixed(2),
        price24h: (Math.random() * 2.5 + 0.3).toFixed(2),
        change: (Math.random() * 20 - 10).toFixed(1),
        volume7d: Math.floor(Math.random() * 1000) + 100,
        volume24h: Math.floor(Math.random() * 500) + 50,
        trending: generateSparklineData()
      }));
      
      setTableData(enrichedData);
      
      // Generate trend data for the right-side chart
      generateTrendData();
    } catch (error) {
      console.error('[RealTimeDataTable] Error fetching market data:', error);
      setTableData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    return Array(8).fill(0).map((_, idx) => ({
      _id: `nft-${idx}`,
      name: `NFT Collection #${idx + 1}`,
      image: `https://via.placeholder.com/50x50?text=NFT%20${idx + 1}`,
      creator: `Creator ${idx + 1}`,
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

  const generateTrendData = () => {
    const points = Array(24).fill(0).map((_, i) => ({
      hour: `${i}:00`,
      price: Math.random() * 2 + 0.5
    }));
    setTrendData(points);
  };

  if (loading) {
    return (
      <div className="mb-8 md:mb-12 lg:mb-16 animate-pulse">
        <div className="h-80 bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="mb-8 md:mb-12 lg:mb-16">
      {/* Header */}
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6">Real-Time Data</h2>

      {/* Table Container - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-gray-800/50 rounded-lg border border-gray-700 overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-max md:min-w-0">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-1.5 sm:px-2 md:px-4 py-2 md:py-3 text-left text-gray-400 text-xs font-semibold">NFT</th>
                  <th className="px-1.5 sm:px-2 md:px-4 py-2 md:py-3 text-left text-gray-400 text-xs font-semibold hidden sm:table-cell">Floor</th>
                  <th className="px-1.5 sm:px-2 md:px-4 py-2 md:py-3 text-left text-gray-400 text-xs font-semibold hidden md:table-cell">24H</th>
                  <th className="px-1.5 sm:px-2 md:px-4 py-2 md:py-3 text-left text-gray-400 text-xs font-semibold">Chg</th>
                  <th className="px-1.5 sm:px-2 md:px-4 py-2 md:py-3 text-left text-gray-400 text-xs font-semibold hidden lg:table-cell">V24H</th>
                  <th className="px-1.5 sm:px-2 md:px-4 py-2 md:py-3 text-left text-gray-400 text-xs font-semibold hidden lg:table-cell">V7D</th>
                  <th className="px-1.5 sm:px-2 md:px-4 py-2 md:py-3 text-left text-gray-400 text-xs font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-800/50 transition">
                    {/* NFT */}
                    <td className="px-1.5 sm:px-2 md:px-4 py-2 md:py-4 flex items-center gap-1.5 sm:gap-2">
                      <img
                        src={row.image || `https://via.placeholder.com/50x50?text=${row.name?.substring(0, 3)}`}
                        alt={row.name}
                        className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <span className="text-white font-medium text-xs md:text-sm line-clamp-1 truncate">{row.name || `NFT #${idx + 1}`}</span>
                    </td>

                    {/* Floor Price */}
                    <td className="px-1.5 sm:px-2 md:px-4 py-2 md:py-4 text-white font-mono text-xs md:text-sm hidden sm:table-cell">
                      {row.floorPrice}
                    </td>

                    {/* 24H Price */}
                    <td className="px-1.5 sm:px-2 md:px-4 py-2 md:py-4 text-white font-mono text-xs md:text-sm hidden md:table-cell">
                      {row.price24h}
                    </td>

                    {/* Change % */}
                    <td className="px-1.5 sm:px-2 md:px-4 py-2 md:py-4">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-semibold ${
                        parseFloat(row.change) >= 0
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {parseFloat(row.change) >= 0 ? '+' : ''}{row.change}%
                      </span>
                    </td>

                    {/* 24H Volume */}
                    <td className="px-1.5 sm:px-2 md:px-4 py-2 md:py-4 text-white font-mono text-xs md:text-sm hidden lg:table-cell">
                      {row.volume24h}
                    </td>

                    {/* 7D Volume */}
                    <td className="px-1.5 sm:px-2 md:px-4 py-2 md:py-4 text-white font-mono text-xs md:text-sm hidden lg:table-cell">
                      {row.volume7d}
                    </td>

                    {/* Sparkline */}
                    <td className="px-2 md:px-4 py-2 md:py-4">
                      <ResponsiveContainer width={50} height={25}>
                        <LineChart data={row.trending}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#a78bfa"
                            strokeWidth={1.5}
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

        {/* Large Trend Chart - Right Side */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-2 sm:p-3 md:p-6">
          <h3 className="text-white font-semibold mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base">Market Trend</h3>
          <ResponsiveContainer width="100%" height={200} className="!h-48 sm:!h-60 md:!h-80">
            <LineChart data={trendData}>
              <XAxis
                dataKey="hour"
                stroke="#666"
                style={{ fontSize: '10px' }}
                tick={{ fill: '#888' }}
              />
              <YAxis
                stroke="#666"
                style={{ fontSize: '10px' }}
                tick={{ fill: '#888' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#a78bfa"
                strokeWidth={2}
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
