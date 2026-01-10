import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';
import { analyticsAPI } from '../services/api.js';

const NFTAnalyticsSection = () => {
  const [timeRange, setTimeRange] = useState('1d');
  const [topNFTs, setTopNFTs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data matching the screenshot exactly
  const mockTopNFTs = [
    {
      id: '1',
      name: 'Nakamigos',
      image: 'https://i.seadn.io/s/raw/files/4d430f0a1e49f7e43e70d607cad68ff3.gif?w=500&auto=format',
      collection: 'Nakamigos',
      floorPrice: '0.11',
      volume24h: '101.62',
      sales: '878',
      listed: '943 / 19.9k',
      change24h: 4.7,
      currency: 'ETH',
      verified: true,
      chartColor: 'red'
    },
    {
      id: '2',
      name: 'Pudgy Penguins',
      image: 'https://i.seadn.io/s/raw/files/87702b54e4d83a04e5e09f4a6033fa0e.jpeg?w=500&auto=format',
      collection: 'Pudgy Penguins',
      floorPrice: '4.56',
      volume24h: '29.28',
      sales: '6',
      listed: '103 / 8,888',
      change24h: 1.2,
      currency: 'ETH',
      verified: true,
      chartColor: 'red'
    },
    {
      id: '3',
      name: 'CryptoPunks',
      image: 'https://i.seadn.io/s/raw/files/db4af4c8e2c6c3f44a26e2b0c0d2f8f8.png?w=500&auto=format',
      collection: 'CryptoPunks',
      floorPrice: '3.00',
      volume24h: '25.72',
      sales: '1',
      listed: '0 / 321',
      change24h: 0.0,
      currency: 'ETH',
      verified: true,
      chartColor: 'red'
    },
    {
      id: '4',
      name: 'Meta Legends',
      image: 'https://i.seadn.io/s/raw/files/9f3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c.gif?w=500&auto=format',
      collection: 'Meta Legends',
      floorPrice: '0.02',
      volume24h: '24.57',
      sales: '1,287',
      listed: '265 / 12.3k',
      change24h: 2.1,
      currency: 'ETH',
      verified: true,
      chartColor: 'red'
    },
    {
      id: '5',
      name: 'Mutant Apes',
      image: 'https://i.seadn.io/s/raw/files/aabbccddee1122334455667788990011.gif?w=500&auto=format',
      collection: 'Mutant Ape Yacht Club',
      floorPrice: '0.66',
      volume24h: '14.80',
      sales: '21',
      listed: '383 / 19.6k',
      change24h: 2.0,
      currency: 'ETH',
      verified: true,
      chartColor: 'red'
    },
    {
      id: '6',
      name: 'DX Terminal',
      image: 'https://i.seadn.io/s/raw/files/1122334455667788990011aabbccddee.gif?w=500&auto=format',
      collection: 'DX Terminal',
      floorPrice: '0.01',
      volume24h: '14.67',
      sales: '3,870',
      listed: '3,205 / 36.0k',
      change24h: 8.7,
      currency: 'ETH',
      verified: true,
      chartColor: 'red'
    },
    {
      id: '7',
      name: 'Mad Lads',
      image: 'https://i.seadn.io/s/raw/files/2233445566778899001122aabbccddee.gif?w=500&auto=format',
      collection: 'Mad Lads',
      floorPrice: '0.47',
      volume24h: '315.68',
      sales: '21',
      listed: '364 / 9,965',
      change24h: 3.7,
      currency: 'SOL',
      verified: true,
      chartColor: 'red'
    },
    {
      id: '8',
      name: 'Doopies',
      image: 'https://i.seadn.io/s/raw/files/3344556677889900112233aabbccddee.gif?w=500&auto=format',
      collection: 'Doopies',
      floorPrice: '0.74',
      volume24h: '301.42',
      sales: '265',
      listed: '1,587 / 8,888',
      change24h: 17.9,
      currency: 'SOL',
      verified: true,
      chartColor: 'red'
    },
    {
      id: '9',
      name: 'ChromieSquiggles',
      image: 'https://i.seadn.io/s/raw/files/4455667788990011223344aabbccddee.gif?w=500&auto=format',
      collection: 'Art Blocks',
      floorPrice: '0.01',
      volume24h: '10.74',
      sales: '4',
      listed: '64 / 10.1k',
      change24h: 0.6,
      currency: 'ETH',
      verified: true,
      chartColor: 'green'
    },
    {
      id: '10',
      name: 'Doodles',
      image: 'https://i.seadn.io/s/raw/files/5566778899001122334455aabbccddee.gif?w=500&auto=format',
      collection: 'Doodles',
      floorPrice: '0.42',
      volume24h: '10.09',
      sales: '23',
      listed: '212 / 9,998',
      change24h: 2.1,
      currency: 'ETH',
      verified: true,
      chartColor: 'red'
    }
  ];

  useEffect(() => {
    const fetchTopNFTs = async () => {
      try {
        setLoading(true);
        const data = await analyticsAPI.getTopPerformingNFTs(timeRange, 10);
        setTopNFTs(Array.isArray(data) && data.length > 0 ? data : mockTopNFTs);
      } catch (err) {
        console.error('Error fetching top NFTs:', err);
        setTopNFTs(mockTopNFTs);
      } finally {
        setLoading(false);
      }
    };

    fetchTopNFTs();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
        <span className="ml-2 text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 bg-gray-800/50 rounded text-sm text-gray-300 hover:bg-gray-800 transition flex items-center gap-2">
            {timeRange}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button className="text-gray-400 hover:text-white transition">
            ★
          </button>
          <button className="px-4 py-2 bg-gray-700/50 rounded text-sm text-white hover:bg-gray-700 transition font-medium">
            Top
          </button>
          <span className="text-gray-400 text-sm">Memecoin NFTs</span>
          <button className="px-3 py-1 bg-gray-800/50 rounded text-sm text-gray-300 hover:bg-gray-800 transition">
            Badged
          </button>
          <button className="w-8 h-4 bg-purple-600 rounded-full relative flex items-center">
            <div className="w-3 h-3 bg-white rounded-full ml-0.5"></div>
          </button>
          <button className="px-3 py-1 bg-gray-800/50 rounded text-sm text-gray-300 hover:bg-gray-800 transition">
            USD
          </button>
          <button className="px-3 py-2 bg-purple-600 rounded text-sm text-white hover:bg-purple-700 transition">
            AI💬
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm text-gray-400 border-b border-gray-700/50 sticky top-0 bg-black/30 backdrop-blur">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Collection</div>
          <div className="col-span-1 text-right">Floor Offer</div>
          <div className="col-span-1 text-right">Volume</div>
          <div className="col-span-1 text-right">Sales</div>
          <div className="col-span-1 text-right">Listed</div>
          <div className="col-span-2 text-right pr-8">Last 1d</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-700/50">
          {(topNFTs.length > 0 ? topNFTs : mockTopNFTs).slice(0, 10).map((nft, index) => (
            <Link
              key={nft.id}
              to={`/nft/${nft.itemId}`}
              className="group grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-800/10 transition-colors"
            >
              {/* Rank */}
              <div className="col-span-1 text-white font-semibold text-base">
                {index + 1}
              </div>

              {/* Collection */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex-shrink-0 overflow-hidden">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex flex-col min-w-0 gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold truncate">{nft.name}</span>
                    {nft.verified && (
                      <FiCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Floor Price */}
              <div className="col-span-1 text-right">
                <span className="text-white font-medium">{nft.floorPrice}</span>
                <span className="text-gray-500 text-xs ml-1">{nft.currency}</span>
              </div>

              {/* Volume */}
              <div className="col-span-1 text-right">
                <span className="text-white font-medium">{nft.volume24h}</span>
                <span className="text-gray-500 text-xs ml-1">{nft.currency}</span>
              </div>

              {/* Sales */}
              <div className="col-span-1 text-right text-white font-medium">
                {nft.sales}
              </div>

              {/* Listed */}
              <div className="col-span-1 text-right">
                <div className={`font-semibold ${
                  nft.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {nft.change24h >= 0 ? '+' : ''}{nft.change24h}%
                </div>
                <div className="text-gray-500 text-xs">{nft.listed}</div>
              </div>

              {/* 7-day sparkline chart */}
              <div className="col-span-2 flex items-end justify-end gap-0.5 h-8 pr-2">
                {[...Array(7)].map((_, i) => {
                  const baseHeightPercent = 40 + Math.random() * 40;
                  const isPositive = nft.chartColor === 'green';
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t ${
                        isPositive ? 'bg-green-500/80' : 'bg-red-500/80'
                      } transition-all`}
                      style={{ height: `${baseHeightPercent}%`, minHeight: '2px' }}
                    />
                  );
                })}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer with pagination */}
      <div className="flex items-center justify-between mt-6 px-4 py-3 text-sm text-gray-400">
        <span>Show top</span>
        <div className="flex items-center gap-2">
          {['10', '25', '50', '100', 'grid'].map((option) => (
            <button
              key={option}
              className={`px-3 py-1 rounded transition ${
                option === '10'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800/50 hover:bg-gray-800 text-gray-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NFTAnalyticsSection;