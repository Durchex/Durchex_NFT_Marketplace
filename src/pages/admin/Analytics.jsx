import React, { useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiDollarSign, FiImage, FiActivity, FiCalendar, FiDownload, FiRefreshCw } from 'react-icons/fi';

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('volume');

  // Mock data - in real app, this would come from API
  const analyticsData = {
    overview: {
      totalUsers: 1234,
      totalNFTs: 5678,
      totalVolume: 89.2,
      totalTransactions: 3456,
      userGrowth: 12.5,
      volumeGrowth: 8.3,
      nftGrowth: 15.2,
      transactionGrowth: 6.7
    },
    topCollections: [
      { name: 'Bored Ape Yacht Club', volume: 120.5, items: 10000, change: 12.5, color: 'bg-blue-500' },
      { name: 'CryptoPunks', volume: 98.2, items: 10000, change: -3.1, color: 'bg-green-500' },
      { name: 'Mutant Ape Yacht Club', volume: 75.1, items: 20000, change: 8.9, color: 'bg-purple-500' },
      { name: 'Azuki', volume: 55.3, items: 10000, change: 6.7, color: 'bg-pink-500' },
      { name: 'Clone X', volume: 48.9, items: 20000, change: 4.2, color: 'bg-orange-500' }
    ],
    recentActivity: [
      { type: 'sale', nft: 'Cool Cat #123', price: '2.5 ETH', user: '0x1234...5678', time: '2 hours ago' },
      { type: 'listing', nft: 'Space Ape #456', price: '1.8 ETH', user: '0x9876...5432', time: '5 hours ago' },
      { type: 'bid', nft: 'Digital Art #789', price: '3.2 ETH', user: '0xabcd...efgh', time: '1 day ago' },
      { type: 'transfer', nft: 'Pixel Punks #321', price: '0 ETH', user: '0x5678...1234', time: '2 days ago' }
    ],
    volumeData: [
      { date: '2024-01-09', volume: 12.5, transactions: 45 },
      { date: '2024-01-10', volume: 15.2, transactions: 52 },
      { date: '2024-01-11', volume: 18.7, transactions: 61 },
      { date: '2024-01-12', volume: 22.1, transactions: 73 },
      { date: '2024-01-13', volume: 19.8, transactions: 68 },
      { date: '2024-01-14', volume: 25.3, transactions: 89 },
      { date: '2024-01-15', volume: 28.9, transactions: 95 }
    ]
  };

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? (
      <FiTrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <FiTrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'sale':
        return <FiDollarSign className="w-4 h-4 text-green-600" />;
      case 'listing':
        return <FiImage className="w-4 h-4 text-blue-600" />;
      case 'bid':
        return <FiTrendingUp className="w-4 h-4 text-orange-600" />;
      case 'transfer':
        return <FiActivity className="w-4 h-4 text-gray-600" />;
      default:
        return <FiActivity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 font-display">Comprehensive insights into your NFT marketplace</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-display">
            <FiDownload className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-display">
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Total Users</p>
              <p className="text-2xl font-display font-bold text-gray-900">{analyticsData.overview.totalUsers.toLocaleString()}</p>
              <div className="flex items-center space-x-1 mt-1">
                {getGrowthIcon(analyticsData.overview.userGrowth)}
                <span className={`text-sm font-display ${getGrowthColor(analyticsData.overview.userGrowth)}`}>
                  {analyticsData.overview.userGrowth > 0 ? '+' : ''}{analyticsData.overview.userGrowth}%
                </span>
              </div>
            </div>
            <FiUsers className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Total NFTs</p>
              <p className="text-2xl font-display font-bold text-gray-900">{analyticsData.overview.totalNFTs.toLocaleString()}</p>
              <div className="flex items-center space-x-1 mt-1">
                {getGrowthIcon(analyticsData.overview.nftGrowth)}
                <span className={`text-sm font-display ${getGrowthColor(analyticsData.overview.nftGrowth)}`}>
                  {analyticsData.overview.nftGrowth > 0 ? '+' : ''}{analyticsData.overview.nftGrowth}%
                </span>
              </div>
            </div>
            <FiImage className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Total Volume</p>
              <p className="text-2xl font-display font-bold text-gray-900">{analyticsData.overview.totalVolume} ETH</p>
              <div className="flex items-center space-x-1 mt-1">
                {getGrowthIcon(analyticsData.overview.volumeGrowth)}
                <span className={`text-sm font-display ${getGrowthColor(analyticsData.overview.volumeGrowth)}`}>
                  {analyticsData.overview.volumeGrowth > 0 ? '+' : ''}{analyticsData.overview.volumeGrowth}%
                </span>
              </div>
            </div>
            <FiDollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Transactions</p>
              <p className="text-2xl font-display font-bold text-gray-900">{analyticsData.overview.totalTransactions.toLocaleString()}</p>
              <div className="flex items-center space-x-1 mt-1">
                {getGrowthIcon(analyticsData.overview.transactionGrowth)}
                <span className={`text-sm font-display ${getGrowthColor(analyticsData.overview.transactionGrowth)}`}>
                  {analyticsData.overview.transactionGrowth > 0 ? '+' : ''}{analyticsData.overview.transactionGrowth}%
                </span>
              </div>
            </div>
            <FiActivity className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-semibold text-gray-900">Volume Trend</h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
            >
              <option value="volume">Volume</option>
              <option value="transactions">Transactions</option>
            </select>
          </div>
          <div className="space-y-4">
            {analyticsData.volumeData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-display text-gray-600">{data.date}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-display font-medium text-gray-900">
                    {selectedMetric === 'volume' ? `${data.volume} ETH` : `${data.transactions} txns`}
                  </span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(selectedMetric === 'volume' ? data.volume : data.transactions) / 30 * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Collections */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-6">Top Collections</h3>
          <div className="space-y-4">
            {analyticsData.topCollections.map((collection, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${collection.color}`}></div>
                  <div>
                    <p className="text-sm font-display font-medium text-gray-900">{collection.name}</p>
                    <p className="text-xs font-display text-gray-500">{collection.items.toLocaleString()} items</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-display font-semibold text-gray-900">{collection.volume} ETH</p>
                  <div className="flex items-center space-x-1">
                    {getGrowthIcon(collection.change)}
                    <span className={`text-xs font-display ${getGrowthColor(collection.change)}`}>
                      {collection.change > 0 ? '+' : ''}{collection.change}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display font-semibold text-gray-900">Recent Activity</h3>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-display">View All</button>
        </div>
        <div className="space-y-4">
          {analyticsData.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getActivityIcon(activity.type)}
                <div>
                  <p className="text-sm font-display font-medium text-gray-900">
                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}: {activity.nft}
                  </p>
                  <p className="text-xs font-display text-gray-500">{activity.user}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-display font-semibold text-gray-900">{activity.price}</p>
                <p className="text-xs font-display text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h4 className="text-lg font-display font-semibold text-gray-900 mb-4">User Engagement</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-display text-gray-600">Active Users</span>
              <span className="text-sm font-display font-semibold text-gray-900">892</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-display text-gray-600">New Users</span>
              <span className="text-sm font-display font-semibold text-gray-900">156</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-display text-gray-600">Returning Users</span>
              <span className="text-sm font-display font-semibold text-gray-900">736</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h4 className="text-lg font-display font-semibold text-gray-900 mb-4">Market Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-display text-gray-600">Avg. Sale Price</span>
              <span className="text-sm font-display font-semibold text-gray-900">2.3 ETH</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-display text-gray-600">Success Rate</span>
              <span className="text-sm font-display font-semibold text-gray-900">94.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-display text-gray-600">Avg. Time to Sale</span>
              <span className="text-sm font-display font-semibold text-gray-900">3.2 days</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h4 className="text-lg font-display font-semibold text-gray-900 mb-4">Platform Health</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-display text-gray-600">Uptime</span>
              <span className="text-sm font-display font-semibold text-green-600">99.9%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-display text-gray-600">Response Time</span>
              <span className="text-sm font-display font-semibold text-gray-900">245ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-display text-gray-600">Error Rate</span>
              <span className="text-sm font-display font-semibold text-green-600">0.1%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
