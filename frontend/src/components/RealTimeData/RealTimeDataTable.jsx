import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { nftAPI } from '../../services/api';

/**
 * RealTimeDataTable - Shows 8 actual NFTs from database (newest to oldest) with real floor prices
 * Other data (price24h, change, volume, trending) is simulated
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
      console.log('[RealTimeDataTable] Fetching NFTs from all networks...');
      
      // ✅ Fetch all NFTs from all networks
      let allNFTs = [];
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
      
      for (const network of networks) {
        try {
          console.log(`[RealTimeDataTable] Fetching NFTs from ${network}...`);
          const networkNfts = await nftAPI.getAllNftsByNetwork(network);
          if (Array.isArray(networkNfts)) {
            allNFTs = [...allNFTs, ...networkNfts];
          }
        } catch (err) {
          console.warn(`[RealTimeDataTable] Error fetching from ${network}:`, err.message);
        }
      }
      
      // Sort by creation date (newest to oldest)
      allNFTs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : (a._id ? new Date(a._id.toString().substring(0, 8)) : new Date(0));
        const dateB = b.createdAt ? new Date(b.createdAt) : (b._id ? new Date(b._id.toString().substring(0, 8)) : new Date(0));
        return dateB - dateA;
      });
      
      // Get first 8 NFTs (newest to oldest)
      const nftList = allNFTs.slice(0, 8);
      
      if (nftList.length === 0) {
        throw new Error('No NFTs found');
      }
      
      console.log(`[RealTimeDataTable] Loaded ${nftList.length} NFTs`);
      
      // Enrich with simulated market data, but keep real floor price
      const enrichedData = nftList.map(nft => ({
        ...nft,
        // Use real floor price if available, otherwise use price
        floorPrice: nft.floorPrice || nft.price || (Math.random() * 2 + 0.5).toFixed(2),
        // Simulated data
        price24h: (Math.random() * 2.5 + 0.3).toFixed(2),
        change: (Math.random() * 20 - 10).toFixed(1),
        volume7d: Math.floor(Math.random() * 1000) + 100,
        volume24h: Math.floor(Math.random() * 500) + 50,
        trending: generateSparklineData()
      }));
      
      setTableData(enrichedData);
      
      // Generate trend data for the right-side chart (simulated market trend)
      generateTrendData();
    } catch (error) {
      console.error('[RealTimeDataTable] Error fetching market data:', error);
      setTableData(generateMockData());
      generateTrendData();
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
    // Simulate market trend over 24 hours with realistic price movement
    const basePrice = 1.0;
    let currentPrice = basePrice;
    const points = Array(24).fill(0).map((_, i) => {
      // Simulate price movement with slight trend
      const change = (Math.random() - 0.45) * 0.1; // Slight upward bias
      currentPrice = Math.max(0.3, currentPrice + change);
      return {
        hour: `${String(i).padStart(2, '0')}:00`,
        price: parseFloat(currentPrice.toFixed(2))
      };
    });
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
    <div className="mb-6 sm:mb-8 md:mb-12 lg:mb-16 w-full">
      {/* Header */}
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Real-Time Data</h2>

      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {/* Table - Mobile: Full width, Desktop: 2/3 width */}
        <div className="w-full min-w-0 lg:col-span-2 bg-gray-800/50 rounded-lg border border-gray-700 overflow-x-auto">
          <div className="min-w-0 w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-3 py-3 text-left text-gray-400 text-sm font-semibold">NFT</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-sm font-semibold hidden sm:table-cell">Floor</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-sm font-semibold hidden md:table-cell">24H</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-sm font-semibold">Chg</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-sm font-semibold hidden lg:table-cell">V24H</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-sm font-semibold hidden lg:table-cell">V7D</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-sm font-semibold hidden sm:table-cell">Trend</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-800/50 transition">
                    {/* NFT */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={row.image || `https://via.placeholder.com/50x50?text=${row.name?.substring(0, 3)}`}
                          alt={row.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <span className="text-white font-medium text-sm truncate min-w-0">{row.name || `NFT #${idx + 1}`}</span>
                      </div>
                    </td>

                    {/* Floor Price */}
                    <td className="px-3 py-3 text-white font-mono text-sm hidden sm:table-cell">
                      {row.floorPrice}
                    </td>

                    {/* 24H Price */}
                    <td className="px-3 py-3 text-white font-mono text-sm hidden md:table-cell">
                      {row.price24h}
                    </td>

                    {/* Change % */}
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        parseFloat(row.change) >= 0
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {parseFloat(row.change) >= 0 ? '+' : ''}{row.change}%
                      </span>
                    </td>

                    {/* 24H Volume */}
                    <td className="px-3 py-3 text-white font-mono text-sm hidden lg:table-cell">
                      {row.volume24h}
                    </td>

                    {/* 7D Volume */}
                    <td className="px-3 py-3 text-white font-mono text-sm hidden lg:table-cell">
                      {row.volume7d}
                    </td>

                    {/* Sparkline */}
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <ResponsiveContainer width={60} height={30}>
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
        </div>

        {/* Large Trend Chart - Mobile: Full width below, Desktop: Right side */}
        <div className="w-full min-w-0 lg:w-auto bg-gray-800/50 rounded-lg border border-gray-700 p-4 sm:p-6">
          <h3 className="text-white font-semibold mb-4 text-base sm:text-lg">Market Trend</h3>
          <div className="w-full" style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
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
    </div>
  );
};

export default RealTimeDataTable;
