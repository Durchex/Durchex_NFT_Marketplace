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
import { FiTrendingUp, FiBarChart, FiEye, FiHeart, FiDollarSign, FiArrowUp } from 'react-icons/fi';
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
      collection: 'Cosmic Dreams'
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
      collection: 'Mythical Creatures'
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
      collection: 'Neon Collection'
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
      collection: 'Abstract Art'
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
      collection: 'Cyber Punk'
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

      {/* Top NFTs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {topNFTs.map((nft, index) => (
          <Link
            key={nft.id}
            to={`/nft/${nft.itemId}`}
            className="group bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-105"
          >
            {/* Rank Badge */}
            <div className="relative bg-gray-800">
              <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                #{index + 1}
              </div>
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            {/* NFT Info */}
            <div className="p-3">
              <h4 className="font-semibold text-white text-sm truncate mb-1">{nft.name}</h4>
              <p className="text-gray-400 text-xs truncate mb-2">{nft.collection}</p>

              {/* Price & Change */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-medium text-sm">{nft.price} ETH</div>
                <div className={`flex items-center gap-1 text-xs ${
                  nft.change24h > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  <FiArrowUp className="text-xs" />
                  {nft.change24h > 0 ? '+' : ''}{nft.change24h}%
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <FiEye className="text-xs" />
                  {nft.views}
                </div>
                <div className="flex items-center gap-1">
                  <FiHeart className="text-xs" />
                  {nft.likes}
                </div>
                <div className="flex items-center gap-1">
                  <FiDollarSign className="text-xs" />
                  {nft.floorPrice}
                </div>
              </div>
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