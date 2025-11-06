import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiImage, 
  FiDollarSign, 
  FiTrendingUp,
  FiActivity,
  FiShoppingCart,
  FiRefreshCw
} from 'react-icons/fi';
import { adminAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNFTs: 0,
    totalVolume: '0',
    activeSales: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [topCollections, setTopCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getDashboardStats();
      
      setStats({
        totalUsers: data.totalUsers || 0,
        totalNFTs: data.totalNFTs || 0,
        totalVolume: data.totalVolume || '0',
        activeSales: data.activeSales || 0
      });
      
      setRecentActivities(data.recentActivities || []);
      setTopCollections(data.topCollections || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const statsData = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+0%', // Can be calculated from historical data
      changeType: 'positive',
      icon: FiUsers,
      color: 'blue'
    },
    {
      title: 'NFTs Listed',
      value: stats.totalNFTs.toLocaleString(),
      change: '+0%',
      changeType: 'positive',
      icon: FiImage,
      color: 'green'
    },
    {
      title: 'Total Volume',
      value: `${stats.totalVolume} ETH`,
      change: '+0%',
      changeType: 'positive',
      icon: FiDollarSign,
      color: 'purple'
    },
    {
      title: 'Active Sales',
      value: stats.activeSales.toLocaleString(),
      change: '+0%',
      changeType: 'positive',
      icon: FiShoppingCart,
      color: 'orange'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-display">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-full">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">Dashboard Overview</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500 font-display mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-display transition-colors"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-display text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-display font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-display ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 font-display ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-semibold text-gray-900">
              Recent Activity
            </h3>
            <FiActivity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'sale' ? 'bg-green-500' :
                    activity.type === 'listing' ? 'bg-blue-500' :
                    'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-display text-gray-900">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500 font-display">
                        {formatTimeAgo(activity.time)}
                      </span>
                      <span className="text-xs text-gray-400 font-display">
                        by {formatAddress(activity.user)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8 font-display">No recent activity</p>
            )}
          </div>
        </div>

        {/* Top Collections */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-semibold text-gray-900">
              Top Collections
            </h3>
            <FiTrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {topCollections.length > 0 ? (
              topCollections.map((collection, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-display font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-display font-medium text-gray-900">
                        {collection.name}
                      </p>
                      <p className="text-sm text-gray-500 font-display">
                        {collection.items} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-semibold text-gray-900">
                      {parseFloat(collection.volume).toFixed(2)} ETH
                    </p>
                    <p className={`text-sm font-display ${
                      collection.change?.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {collection.change || '+0%'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8 font-display">No collections yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
