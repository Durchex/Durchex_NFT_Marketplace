import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiDollarSign, FiImage, FiActivity, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async (period = selectedPeriod) => {
    setIsLoading(true);
    try {
      const res = await adminAPI.getAnalytics(period);
      setData(res);
    } catch (e) {
      console.error('Failed to load analytics', e);
      toast.error('Failed to load analytics');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
  }, [selectedPeriod]);

  const getGrowth = (value) => {
    const num = Number(value);
    if (isNaN(num)) return 0;
    return num;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-display">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 font-display">Key metrics and trends</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => fetchAnalytics(selectedPeriod)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-display"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Total Users</p>
              <p className="text-3xl font-display font-bold text-gray-900 mt-2">
                {data?.users?.total || 0}
              </p>
              <div className="flex items-center mt-2 text-sm font-display">
                {getGrowth(data?.users?.growth) >= 0 ? (
                  <FiTrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <FiTrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`${getGrowth(data?.users?.growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{data?.users?.growth || '0'}%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Total NFTs</p>
              <p className="text-3xl font-display font-bold text-gray-900 mt-2">
                {data?.nfts?.total || 0}
              </p>
              <div className="flex items-center mt-2 text-sm font-display">
                {getGrowth(data?.nfts?.growth) >= 0 ? (
                  <FiTrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <FiTrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`${getGrowth(data?.nfts?.growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{data?.nfts?.growth || '0'}%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <FiImage className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Total Volume</p>
              <p className="text-3xl font-display font-bold text-gray-900 mt-2">
                {data?.volume?.total || '0'} ETH
              </p>
              <div className="flex items-center mt-2 text-sm font-display">
                <FiDollarSign className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600">Sales: {data?.volume?.sales || '0'} ETH</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Sales</p>
              <p className="text-3xl font-display font-bold text-gray-900 mt-2">
                {data?.sales?.total || 0}
              </p>
              <div className="flex items-center mt-2 text-sm font-display text-gray-600">
                <FiActivity className="w-4 h-4 mr-1" />
                <span>Last {data?.sales?.period || 7} days</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <FiActivity className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Stats (simple list representation) */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold text-gray-900">Daily Stats</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.dailyStats?.map((d) => (
            <div key={d.date} className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 font-display">{d.date}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500 font-display">Users</p>
                  <p className="text-lg font-display font-semibold">{d.users}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-display">NFTs</p>
                  <p className="text-lg font-display font-semibold">{d.nfts}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-display">Sales</p>
                  <p className="text-lg font-display font-semibold">{d.sales}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;


export default Analytics;
