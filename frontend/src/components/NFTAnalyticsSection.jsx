import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { FiTrendingUp, FiBarChart, FiArrowUp } from 'react-icons/fi';
import { analyticsAPI } from '../services/api.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const NFTAnalyticsSection = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [topNFTs, setTopNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock high-performing NFTs data - used as fallback (no generated placeholder images)
  const mockTopNFTs = [
    {
      id: '1',
      name: 'Cosmic Dreamer #42',
      image: null,
      price: 2.5,
      change24h: 15.3,
      volume24h: 8.7,
      views: 1250,
      likes: 89,
      floorPrice: 2.1,
      collection: 'Cosmic Dreams',
      sales: 342
    },
    {
      id: '2',
      name: 'Digital Phoenix',
      image: null,
      price: 1.8,
      change24h: 8.7,
      volume24h: 12.3,
      views: 980,
      likes: 67,
      floorPrice: 1.6,
      collection: 'Mythical Creatures',
      sales: 567
    },
    {
      id: '3',
      name: 'Neon Nights #007',
      image: null,
      price: 3.2,
      change24h: -2.1,
      volume24h: 15.8,
      views: 1450,
      likes: 123,
      floorPrice: 2.9,
      collection: 'Neon Collection',
      sales: 1
    },
    {
      id: '4',
      name: 'Abstract Harmony',
      image: null,
      price: 1.2,
      change24h: 22.5,
      volume24h: 6.4,
      views: 756,
      likes: 45,
      floorPrice: 1.0,
      collection: 'Abstract Art',
      sales: 245
    },
    {
      id: '5',
      name: 'Cyber Punk #1337',
      image: null,
      price: 4.1,
      change24h: 5.8,
      volume24h: 9.2,
      views: 2100,
      likes: 156,
      floorPrice: 3.8,
      collection: 'Cyber Punk',
      sales: 893
    }
  ];

  useEffect(() => {
    const fetchTopNFTs = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await analyticsAPI.getTopPerformingNFTs(timeRange, 5);
        console.log('Top NFTs data received:', data);
        setTopNFTs(data);
      } catch (err) {
        console.error('Error fetching top NFTs:', err);
        setError('Failed to load analytics data');
        // Fallback to mock data
        setTopNFTs(mockTopNFTs);
      } finally {
        setLoading(false);
      }
    };

    fetchTopNFTs();
  }, [timeRange]);

  const volumeChartData = {
    labels: topNFTs.slice(0, 5).map(nft => nft.name.length > 15 ? nft.name.substring(0, 15) + '...' : nft.name),
    datasets: [{
      label: '24h Volume (ETH)',
      data: topNFTs.slice(0, 5).map(nft => parseFloat(nft.volume24h) || 0),
      backgroundColor: [
        'rgba(139, 92, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(147, 51, 234, 0.8)',
        'rgba(126, 34, 206, 0.8)',
        'rgba(102, 14, 207, 0.8)',
      ],
      borderColor: '#8b5cf6',
      borderWidth: 1,
      borderRadius: 4,
      animation: {
        duration: 800,
        easing: 'easeInOutQuart'
      }
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `${parseFloat(context.parsed.x).toFixed(2)} ETH`
        }
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: { size: 10 },
          callback: function(value) {
            return value.toFixed(1) + ' ETH';
          }
        },
      },
      y: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
          <span className="ml-2 text-gray-400">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="text-center py-12">
          <div className="text-red-400 mb-2">⚠️ {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="text-purple-400 hover:text-purple-300 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900/50 rounded-xl border border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiBarChart className="text-purple-400" />
            High-Performing NFTs
          </h2>
          <p className="text-gray-400 text-sm mt-1">Top trending NFTs by volume and engagement</p>
        </div>
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Volume Chart */}
      <div className="mb-6 bg-gray-800/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Trading Volume Leaders</h3>
        <div className="h-64">
          <Bar data={volumeChartData} options={chartOptions} />
        </div>
      </div>

      {/* Top NFTs Table */}
      <div className="grid grid-cols-10 text-sm text-gray-400 pb-4 border-b border-gray-700">
        <div className="col-span-1">#</div>
        <div className="col-span-3">Collection</div>
        <div>Floor Offer</div>
        <div>Volume</div>
        <div>Sales</div>
        <div>Listed</div>
        <div className="col-span-2">Last 7d</div>
      </div>

      <div className="space-y-0">
        {topNFTs.map((nft, index) => (
          <Link
            key={nft.id}
            to={`/nft/${nft.itemId}`}
            className="group grid grid-cols-10 py-4 border-t border-gray-700 items-center hover:bg-gray-800/20 transition-colors"
          >
            {/* Rank */}
            <div className="col-span-1 text-white font-semibold">
              {index + 1}
            </div>

            {/* Collection Name & Image */}
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-semibold truncate">{nft.name}</span>
                <span className="text-gray-500 text-xs truncate">{nft.collection}</span>
              </div>
            </div>

            {/* Floor Price */}
            <div className="text-white font-medium">
              {nft.floorPrice} ETH
            </div>

            {/* 24h Volume */}
            <div className="text-white font-medium">
              {nft.volume24h} ETH
            </div>

            {/* Sales Count */}
            <div className="text-gray-300">
              {nft.sales || Math.floor(Math.random() * 1000)}
            </div>

            {/* Listed Percentage */}
            <div className={`font-semibold ${
              nft.change24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {nft.change24h >= 0 ? '+' : ''}{nft.change24h}%
            </div>

            {/* 7d Chart Placeholder */}
            <div className="col-span-2 h-10 flex items-end justify-end gap-0.5">
              {[...Array(7)].map((_, i) => {
                const height = Math.random() * 100;
                const isPositive = Math.random() > 0.5;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${
                      isPositive ? 'bg-green-500/70' : 'bg-red-500/70'
                    }`}
                    style={{ height: `${30 + height * 0.7}%` }}
                  />
                );
              })}
            </div>
          </Link>
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center mt-6">
        <Link
          to="/analytics"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <FiBarChart />
          View Full Analytics
        </Link>
      </div>
    </div>
  );
};

export default NFTAnalyticsSection;