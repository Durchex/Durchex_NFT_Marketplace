import React from 'react';
import { FiEye, FiLock, FiBarChart, FiTrendingUp, FiTrendingDown, FiUsers, FiDollarSign } from 'react-icons/fi';

const PartnerAnalytics = () => {
  const stats = [
    { id: 1, name: 'Total Users', value: '1,234', icon: FiUsers, color: 'text-blue-600', bgColor: 'bg-blue-50', change: '+12.5%' },
    { id: 2, name: 'NFTs Listed', value: '5,678', icon: FiBarChart, color: 'text-green-600', bgColor: 'bg-green-50', change: '+8.9%' },
    { id: 3, name: 'Total Volume', value: '89.2 ETH', icon: FiDollarSign, color: 'text-purple-600', bgColor: 'bg-purple-50', change: '+6.7%' },
    { id: 4, name: 'Active Listings', value: '3,456', icon: FiTrendingUp, color: 'text-yellow-600', bgColor: 'bg-yellow-50', change: '+4.2%' },
  ];

  const topCollections = [
    { name: 'Bored Ape Yacht Club', volume: '120.5 ETH', items: 10000, change: '+12.5%' },
    { name: 'CryptoPunks', volume: '98.2 ETH', items: 10000, change: '-3.1%' },
    { name: 'Mutant Ape Yacht Club', volume: '75.1 ETH', items: 20000, change: '+8.9%' },
    { name: 'Azuki', volume: '55.3 ETH', items: 10000, change: '+6.7%' },
    { name: 'Clone X', volume: '48.9 ETH', items: 20000, change: '+4.2%' },
  ];

  return (
    <div className="space-y-6 min-h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2 text-yellow-600">
          <FiEye className="w-5 h-5" />
          <span className="font-display text-sm">Read-only access</span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-display">
          You can view analytics data but cannot modify system settings. Contact the main administrator for configuration changes.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4 ${stat.bgColor}`}>
              <div className={`p-3 rounded-full ${stat.color} ${stat.bgColor.replace('bg-', 'bg-opacity-50 bg-')}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 font-display text-sm">{stat.name}</p>
                <p className="text-2xl font-display font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm font-display ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FiBarChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 font-display">Revenue chart would be displayed here</p>
            </div>
          </div>
        </div>

        {/* User Growth Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FiTrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 font-display">User growth chart would be displayed here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Collections */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Top Collections</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Change</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCollections.map((collection, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display font-medium text-gray-900">{collection.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-display">{collection.volume}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-display">{collection.items}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-display ${collection.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {collection.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartnerAnalytics;
