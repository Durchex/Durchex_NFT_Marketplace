import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiFilter, FiClock, FiUser, FiShield, FiAlertTriangle, FiCheck, FiX, FiInfo, FiActivity, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';

const Activity = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const socketRef = useRef(null);

  const fetchActivities = async (page = 1) => {
    setIsLoading(true);
    try {
      const filters = {};
      if (filterLevel !== 'all') filters.type = filterLevel; // align with backend type filter
      if (filterCategory !== 'all') filters.category = filterCategory; // category is client-side annotation
      const data = await adminAPI.getActivityLog(page, pagination.limit, {
        ...filters,
        search: searchTerm
      });
      setActivities(data.activities || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch (error) {
      console.error('Failed to load activity log', error);
      toast.error('Failed to load activity log');
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(pagination.page);
  }, [pagination.page, filterLevel, filterCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivities(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Optional realtime via Socket.io if available globally as window.io
    if (window.io && !socketRef.current) {
      try {
        const socket = window.io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');
        socketRef.current = socket;
        socket.emit('join_trending_updates');
        socket.on('user_activity_update', () => {
          // Refresh on incoming activity
          fetchActivities(1);
        });
      } catch (e) {
        // fallback silently
      }
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const filteredActivities = activities; // server already filters and paginates

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

  if (isLoading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-display">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 font-display">Monitor system activities and user actions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchActivities(pagination.page)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-display flex items-center space-x-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
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
                  {getLevelIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-display font-medium text-gray-900">
                        {activity.action || activity.description?.split(' ')[0] || 'Activity'}
                      </h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getLevelBadge(activity.type)}`}>
                        {activity.type}
                      </span>
                      {activity.metadata?.category && (
                        <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getCategoryBadge(activity.metadata.category)}`}>
                          {activity.metadata.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(activity.status || 'info')}
                      <span className="text-sm font-display text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
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
                    {activity.metadata?.collection && (
                      <div className="flex items-center space-x-1">
                        {getCategoryIcon('transaction')}
                        <span>{activity.metadata.collection}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-display text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchActivities(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors font-display"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchActivities(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors font-display"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
