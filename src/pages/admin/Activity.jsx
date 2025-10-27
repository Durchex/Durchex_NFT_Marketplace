import React, { useState } from 'react';
import { FiSearch, FiFilter, FiClock, FiUser, FiShield, FiAlertTriangle, FiCheck, FiX, FiInfo, FiActivity } from 'react-icons/fi';

const Activity = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock data - in real app, this would come from API
  const activities = [
    {
      id: 1,
      timestamp: '2024-01-15 14:30:25',
      level: 'info',
      category: 'user',
      action: 'User Registration',
      description: 'New user registered with wallet address 0x1234...5678',
      user: '0x1234...5678',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'success'
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:25:12',
      level: 'warning',
      category: 'security',
      action: 'Failed Login Attempt',
      description: 'Multiple failed login attempts detected from IP 192.168.1.200',
      user: 'admin@durchex.com',
      ipAddress: '192.168.1.200',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'failed'
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:20:08',
      level: 'success',
      category: 'transaction',
      action: 'NFT Sale Completed',
      description: 'NFT Cool Cat #123 sold for 2.5 ETH',
      user: '0x9876...5432',
      ipAddress: '192.168.1.150',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      status: 'success'
    },
    {
      id: 4,
      timestamp: '2024-01-15 14:15:45',
      level: 'error',
      category: 'system',
      action: 'Database Connection Error',
      description: 'Failed to connect to MongoDB database',
      user: 'system',
      ipAddress: '127.0.0.1',
      userAgent: 'Node.js/18.0.0',
      status: 'error'
    },
    {
      id: 5,
      timestamp: '2024-01-15 14:10:30',
      level: 'info',
      category: 'admin',
      action: 'Admin Login',
      description: 'Admin user logged in successfully',
      user: 'admin@durchex.com',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'success'
    },
    {
      id: 6,
      timestamp: '2024-01-15 14:05:15',
      level: 'warning',
      category: 'user',
      action: 'Suspicious Activity',
      description: 'Unusual trading pattern detected for user 0xabcd...efgh',
      user: '0xabcd...efgh',
      ipAddress: '192.168.1.300',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'warning'
    }
  ];

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        activity.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || activity.level === filterLevel;
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const getLevelIcon = (level) => {
    switch (level) {
      case 'success':
        return <FiCheck className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <FiAlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <FiX className="w-4 h-4 text-red-600" />;
      case 'info':
        return <FiInfo className="w-4 h-4 text-blue-600" />;
      default:
        return <FiActivity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLevelBadge = (level) => {
    const styles = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800'
    };
    return styles[level] || styles.info;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'user':
        return <FiUser className="w-4 h-4 text-blue-600" />;
      case 'admin':
        return <FiShield className="w-4 h-4 text-purple-600" />;
      case 'security':
        return <FiShield className="w-4 h-4 text-red-600" />;
      case 'transaction':
        return <FiActivity className="w-4 h-4 text-green-600" />;
      case 'system':
        return <FiActivity className="w-4 h-4 text-gray-600" />;
      default:
        return <FiActivity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryBadge = (category) => {
    const styles = {
      user: 'bg-blue-100 text-blue-800',
      admin: 'bg-purple-100 text-purple-800',
      security: 'bg-red-100 text-red-800',
      transaction: 'bg-green-100 text-green-800',
      system: 'bg-gray-100 text-gray-800'
    };
    return styles[category] || styles.system;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <FiCheck className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <FiX className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <FiAlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <FiX className="w-4 h-4 text-red-600" />;
      default:
        return <FiInfo className="w-4 h-4 text-gray-600" />;
    }
  };

  const totalActivities = activities.length;
  const successActivities = activities.filter(a => a.level === 'success').length;
  const warningActivities = activities.filter(a => a.level === 'warning').length;
  const errorActivities = activities.filter(a => a.level === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 font-display">Monitor system activities and user actions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-display">
            Export Log
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-display">
            Clear Log
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Total Activities</p>
              <p className="text-2xl font-display font-bold text-gray-900">{totalActivities}</p>
            </div>
            <FiActivity className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Success</p>
              <p className="text-2xl font-display font-bold text-gray-900">{successActivities}</p>
            </div>
            <FiCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Warnings</p>
              <p className="text-2xl font-display font-bold text-gray-900">{warningActivities}</p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Errors</p>
              <p className="text-2xl font-display font-bold text-gray-900">{errorActivities}</p>
            </div>
            <FiX className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search activities, users, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
            >
              <option value="all">All Levels</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="info">Info</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
            >
              <option value="all">All Categories</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="security">Security</option>
              <option value="transaction">Transaction</option>
              <option value="system">System</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-display">
              <FiFilter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-display font-semibold text-gray-900">Recent Activities</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getLevelIcon(activity.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-display font-medium text-gray-900">
                        {activity.action}
                      </h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getLevelBadge(activity.level)}`}>
                        {activity.level}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getCategoryBadge(activity.category)}`}>
                        {activity.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(activity.status)}
                      <span className="text-sm font-display text-gray-500">
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-display text-gray-600">
                    {activity.description}
                  </p>
                  <div className="mt-3 flex items-center space-x-6 text-xs font-display text-gray-500">
                    <div className="flex items-center space-x-1">
                      <FiUser className="w-3 h-3" />
                      <span>{activity.user}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiClock className="w-3 h-3" />
                      <span>{activity.ipAddress}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getCategoryIcon(activity.category)}
                      <span>{activity.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-display text-gray-700">
              Showing 1 to {filteredActivities.length} of {activities.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors font-display">
                Previous
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded font-display">
                1
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors font-display">
                2
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors font-display">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activity;
