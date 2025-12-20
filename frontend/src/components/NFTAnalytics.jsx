import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { FiTrendingUp, FiTrendingDown, FiEye, FiHeart, FiDollarSign, FiBarChart, FiClock, FiUsers } from 'react-icons/fi';
import { analyticsAPI } from '../services/api.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const NFTAnalytics = ({ nftData, analyticsData }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('price');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (analyticsData) {
        setAnalytics(analyticsData);
        setLoading(false);
        return;
      }

      if (!nftData) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Extract network, itemId, tokenId from nftData
        const network = nftData.network || 'ethereum';
        const itemId = nftData.itemId || nftData.id;
        const tokenId = nftData.tokenId || '1';

        const data = await analyticsAPI.getNftAnalytics(network, itemId, tokenId, timeRange);
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching NFT analytics:', err);
        setError('Failed to load analytics data');
        // Fallback to mock data if API fails
        setAnalytics({
          priceHistory: [
            { date: '2024-01-01', price: 0.5 },
            { date: '2024-01-02', price: 0.6 },
            { date: '2024-01-03', price: 0.55 },
            { date: '2024-01-04', price: 0.7 },
            { date: '2024-01-05', price: 0.8 },
            { date: '2024-01-06', price: 0.9 },
            { date: '2024-01-07', price: 1.2 },
          ],
          volumeHistory: [
            { date: '2024-01-01', volume: 2.5 },
            { date: '2024-01-02', volume: 3.1 },
            { date: '2024-01-03', volume: 2.8 },
            { date: '2024-01-04', volume: 4.2 },
            { date: '2024-01-05', volume: 5.1 },
            { date: '2024-01-06', volume: 4.8 },
            { date: '2024-01-07', volume: 6.3 },
          ],
          viewsHistory: [
            { date: '2024-01-01', views: 120 },
            { date: '2024-01-02', views: 145 },
            { date: '2024-01-03', views: 132 },
            { date: '2024-01-04', views: 189 },
            { date: '2024-01-05', views: 201 },
            { date: '2024-01-06', views: 178 },
            { date: '2024-01-07', views: 245 },
          ],
          stats: {
            totalViews: 1250,
            totalLikes: 89,
            floorPrice: 0.8,
            highestBid: 1.5,
            totalVolume: 28.8,
            uniqueOwners: 45,
            averagePrice: 1.1,
            priceChange24h: 12.5,
            volumeChange24h: 8.3
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [nftData, analyticsData, timeRange]);

  // Mock analytics data - used as fallback
  const mockAnalytics = {
    priceHistory: [
      { date: '2024-01-01', price: 0.5 },
      { date: '2024-01-02', price: 0.6 },
      { date: '2024-01-03', price: 0.55 },
      { date: '2024-01-04', price: 0.7 },
      { date: '2024-01-05', price: 0.8 },
      { date: '2024-01-06', price: 0.9 },
      { date: '2024-01-07', price: 1.2 },
    ],
    volumeHistory: [
      { date: '2024-01-01', volume: 2.5 },
      { date: '2024-01-02', volume: 3.1 },
      { date: '2024-01-03', volume: 2.8 },
      { date: '2024-01-04', volume: 4.2 },
      { date: '2024-01-05', volume: 5.1 },
      { date: '2024-01-06', volume: 4.8 },
      { date: '2024-01-07', volume: 6.3 },
    ],
    viewsHistory: [
      { date: '2024-01-01', views: 120 },
      { date: '2024-01-02', views: 145 },
      { date: '2024-01-03', views: 132 },
      { date: '2024-01-04', views: 189 },
      { date: '2024-01-05', views: 201 },
      { date: '2024-01-06', views: 178 },
      { date: '2024-01-07', views: 245 },
    ],
    stats: {
      totalViews: 1250,
      totalLikes: 89,
      floorPrice: 0.8,
      highestBid: 1.5,
      totalVolume: 28.8,
      uniqueOwners: 45,
      averagePrice: 1.1,
      priceChange24h: 12.5,
      volumeChange24h: 8.3
    }
  };

  const displayAnalytics = analytics || mockAnalytics;

  const getChartData = () => {
    let data, labels;

    switch (chartType) {
      case 'price':
        data = displayAnalytics.priceHistory.map(item => item.price);
        labels = displayAnalytics.priceHistory.map(item => new Date(item.date).toLocaleDateString());
        break;
      case 'volume':
        data = displayAnalytics.volumeHistory.map(item => item.volume);
        labels = displayAnalytics.volumeHistory.map(item => new Date(item.date).toLocaleDateString());
        break;
      case 'views':
        data = displayAnalytics.viewsHistory.map(item => item.views);
        labels = displayAnalytics.viewsHistory.map(item => new Date(item.date).toLocaleDateString());
        break;
      default:
        data = displayAnalytics.priceHistory.map(item => item.price);
        labels = displayAnalytics.priceHistory.map(item => new Date(item.date).toLocaleDateString());
    }

    return {
      labels,
      datasets: [{
        label: chartType === 'price' ? 'Price (ETH)' :
               chartType === 'volume' ? 'Volume (ETH)' : 'Views',
        data,
        borderColor: chartType === 'price' ? '#8b5cf6' :
                    chartType === 'volume' ? '#06b6d4' : '#10b981',
        backgroundColor: chartType === 'price' ? 'rgba(139, 92, 246, 0.1)' :
                        chartType === 'volume' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#8b5cf6',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
  };

  const StatCard = ({ icon: Icon, label, value, change, changeType }) => (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <Icon className="text-gray-400 text-lg" />
        {change && (
          <div className={`flex items-center gap-1 text-sm ${
            changeType === 'positive' ? 'text-green-400' : 'text-red-400'
          }`}>
            {changeType === 'positive' ? <FiTrendingUp /> : <FiTrendingDown />}
            {change}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
        <span className="ml-2 text-gray-400">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-2">⚠️ {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-purple-400 hover:text-purple-300 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FiEye}
          label="Total Views"
          value={displayAnalytics.stats.totalViews.toLocaleString()}
        />
        <StatCard
          icon={FiHeart}
          label="Likes"
          value={displayAnalytics.stats.totalLikes}
        />
        <StatCard
          icon={FiDollarSign}
          label="Floor Price"
          value={`${displayAnalytics.stats.floorPrice} ETH`}
          change={displayAnalytics.stats.priceChange24h}
          changeType={displayAnalytics.stats.priceChange24h > 0 ? 'positive' : 'negative'}
        />
        <StatCard
          icon={FiBarChart}
          label="24h Volume"
          value={`${displayAnalytics.stats.totalVolume} ETH`}
          change={displayAnalytics.stats.volumeChange24h}
          changeType={displayAnalytics.stats.volumeChange24h > 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('price')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chartType === 'price'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Price History
          </button>
          <button
            onClick={() => setChartType('volume')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chartType === 'volume'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Trading Volume
          </button>
          <button
            onClick={() => setChartType('views')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chartType === 'views'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            View Analytics
          </button>
        </div>

        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
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

      {/* Chart */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <div className="h-80">
          <Line data={getChartData()} options={chartOptions} />
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ownership Distribution */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiUsers className="text-purple-400" />
            Ownership Analytics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Unique Owners</span>
              <span className="text-white font-medium">{displayAnalytics.stats.uniqueOwners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Average Price</span>
              <span className="text-white font-medium">{displayAnalytics.stats.averagePrice} ETH</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Highest Bid</span>
              <span className="text-white font-medium">{displayAnalytics.stats.highestBid} ETH</span>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiClock className="text-purple-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="flex-1">
                <div className="text-white text-sm">Listed for 1.2 ETH</div>
                <div className="text-gray-400 text-xs">2 hours ago</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="flex-1">
                <div className="text-white text-sm">Received offer of 1.1 ETH</div>
                <div className="text-gray-400 text-xs">5 hours ago</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <div className="flex-1">
                <div className="text-white text-sm">Transferred to new owner</div>
                <div className="text-gray-400 text-xs">1 day ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTAnalytics;