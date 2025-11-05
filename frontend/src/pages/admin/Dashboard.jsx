import React from 'react';
import { 
  FiUsers, 
  FiImage, 
  FiDollarSign, 
  FiTrendingUp,
  FiActivity,
  FiShoppingCart,
  FiEye,
  FiHeart
} from 'react-icons/fi';

const Dashboard = () => {
  // Mock data - in real app, this would come from API
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12.5%',
      changeType: 'positive',
      icon: FiUsers,
      color: 'blue'
    },
    {
      title: 'NFTs Listed',
      value: '5,678',
      change: '+8.2%',
      changeType: 'positive',
      icon: FiImage,
      color: 'green'
    },
    {
      title: 'Total Volume',
      value: '89.2 ETH',
      change: '+15.3%',
      changeType: 'positive',
      icon: FiDollarSign,
      color: 'purple'
    },
    {
      title: 'Active Sales',
      value: '234',
      change: '-2.1%',
      changeType: 'negative',
      icon: FiShoppingCart,
      color: 'orange'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'sale',
      description: 'NFT "Cool Cat #123" sold for 2.5 ETH',
      time: '2 minutes ago',
      user: '0x1234...5678'
    },
    {
      id: 2,
      type: 'listing',
      description: 'New NFT collection "Space Apes" listed',
      time: '15 minutes ago',
      user: '0x9876...5432'
    },
    {
      id: 3,
      type: 'user',
      description: 'New user registered',
      time: '1 hour ago',
      user: '0xabcd...efgh'
    },
    {
      id: 4,
      type: 'sale',
      description: 'NFT "Digital Art #456" sold for 1.8 ETH',
      time: '2 hours ago',
      user: '0x5678...1234'
    }
  ];

  const topCollections = [
    { name: 'Cool Cats', volume: '45.2 ETH', items: 1234, change: '+12.5%' },
    { name: 'Space Apes', volume: '32.8 ETH', items: 856, change: '+8.2%' },
    { name: 'Digital Art', volume: '28.5 ETH', items: 642, change: '+15.3%' },
    { name: 'Pixel Punks', volume: '22.1 ETH', items: 423, change: '-2.1%' }
  ];

  return (
    <div className="space-y-6 min-h-full">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-display text-gray-900">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 font-display">
                      {activity.time}
                    </span>
                    <span className="text-xs text-gray-400 font-display">
                      by {activity.user}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
          <div className="space-y-4">
            {topCollections.map((collection, index) => (
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
                    {collection.volume}
                  </p>
                  <p className={`text-sm font-display ${
                    collection.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {collection.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <FiUsers className="w-5 h-5 text-blue-600" />
            <span className="font-display text-gray-900">Manage Users</span>
          </button>
          <button className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
            <FiImage className="w-5 h-5 text-green-600" />
            <span className="font-display text-gray-900">Review NFTs</span>
          </button>
          <button className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <FiDollarSign className="w-5 h-5 text-purple-600" />
            <span className="font-display text-gray-900">View Transactions</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
