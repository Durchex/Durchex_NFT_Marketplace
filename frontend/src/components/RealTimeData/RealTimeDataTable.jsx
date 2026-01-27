import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { nftAPI } from '../../services/api';
import { getCurrencySymbol } from '../../Context/constants';

/**
 * RealTimeDataTable - Shows 8 actual NFTs from database (newest to oldest) with real floor prices
 * Other data (price24h, change, volume, trending) is simulated
 */
const RealTimeDataTable = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('24h');
  const navigate = useNavigate();

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
      
      // ✅ De-duplicate NFTs so the same NFT across networks only appears once
      const uniqueMap = new Map();
      allNFTs.forEach((nft) => {
        const key =
          nft._id ||
          `${nft.network || nft.chain || 'unknown'}-${nft.itemId || nft.tokenId || nft.name || Math.random()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, nft);
        }
      });
      const uniqueNFTs = Array.from(uniqueMap.values());

      // Sort by creation date (newest to oldest)
      uniqueNFTs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : (a._id ? new Date(a._id.toString().substring(0, 8)) : new Date(0));
        const dateB = b.createdAt ? new Date(b.createdAt) : (b._id ? new Date(b._id.toString().substring(0, 8)) : new Date(0));
        return dateB - dateA;
      });
      
      // Get first 8 NFTs (newest to oldest)
      const nftList = uniqueNFTs.slice(0, 8);
      
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
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Real-Time Data</h2>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
          {/* Category Filters */}
          <div className="flex gap-1 sm:gap-2 bg-gray-800/50 rounded-lg p-1">
            {['All', 'Trending', 'Top', 'Watchlist'].map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition ${
                  categoryFilter === category
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Time Filters */}
          <div className="flex gap-1 sm:gap-2 bg-gray-800/50 rounded-lg p-1">
            {['1H', '6h', '24h', '7D', '1M', '6M', '1Y'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition ${
                  timeFilter === period
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {/* Table - Mobile: Full width, Desktop: 2/3 width */}
        <div className="w-full min-w-0 lg:col-span-2 bg-gray-800/50 rounded-lg border border-gray-700 overflow-x-auto">
          <div className="min-w-0 w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-3 py-3 text-left text-gray-400 text-xs sm:text-sm font-semibold">#</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-xs sm:text-sm font-semibold">Collection</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-xs sm:text-sm font-semibold hidden sm:table-cell">Volume</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-xs sm:text-sm font-semibold">Floor Price</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-xs sm:text-sm font-semibold hidden md:table-cell">Sales</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-xs sm:text-sm font-semibold hidden lg:table-cell">Floor Price %</th>
                  <th className="px-3 py-3 text-left text-gray-400 text-xs sm:text-sm font-semibold hidden sm:table-cell">Last 1D</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className="border-b border-gray-700/50 hover:bg-gray-800/50 transition cursor-pointer"
                    onClick={() => navigate(`/nft/${row._id}`)}
                  >
                    {/* Rank */}
                    <td className="px-3 py-3 text-gray-400 text-xs sm:text-sm">
                      {idx + 1}
                    </td>

                    {/* Collection */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={row.image || `https://via.placeholder.com/50x50?text=${row.name?.substring(0, 3)}`}
                          alt={row.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
                        />
                        <span className="text-white font-medium text-xs sm:text-sm truncate min-w-0">{row.name || `NFT #${idx + 1}`}</span>
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="px-3 py-3 text-white font-mono text-xs sm:text-sm hidden sm:table-cell">
                      {row.volume24h || '0.05'}{' '}
                      {getCurrencySymbol(row.network || row.chain || 'ethereum')}
                    </td>

                    {/* Floor Price */}
                    <td className="px-3 py-3 text-white font-mono text-xs sm:text-sm">
                      {row.floorPrice}{' '}
                      {getCurrencySymbol(row.network || row.chain || 'ethereum')}
                    </td>

                    {/* Sales */}
                    <td className="px-3 py-3 text-white font-mono text-xs sm:text-sm hidden md:table-cell">
                      {row.volume7d || Math.floor(Math.random() * 1000) + 100}
                    </td>

                    {/* Floor Price % */}
                    <td className="px-3 py-3 text-white font-mono text-xs sm:text-sm hidden lg:table-cell">
                      {((parseFloat(row.floorPrice) / (parseFloat(row.price24h) || 1)) * 100).toFixed(1)}%
                    </td>

                    {/* Sparkline - Last 1D */}
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <ResponsiveContainer width={60} height={30}>
                        <LineChart data={row.trending}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={parseFloat(row.change) >= 0 ? "#10b981" : "#ef4444"}
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
