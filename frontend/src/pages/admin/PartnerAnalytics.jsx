import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiUsers, FiImage, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../../services/adminAPI';

const PartnerAnalytics = () => {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await adminAPI.getAnalytics(period);
      setData(res);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900">Analytics (Read-only)</h2>
        <div className="flex items-center space-x-3">
          <select value={period} onChange={(e)=>setPeriod(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="7d">7d</option>
            <option value="30d">30d</option>
            <option value="90d">90d</option>
          </select>
          <button onClick={fetchData} className="px-3 py-2 bg-gray-800 text-white rounded-lg flex items-center space-x-2">
            <FiRefreshCw />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-display">Users</p>
                <p className="text-2xl font-display font-bold">{data?.users?.total || 0}</p>
              </div>
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-display">NFTs</p>
                <p className="text-2xl font-display font-bold">{data?.nfts?.total || 0}</p>
              </div>
              <FiImage className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-display">Volume</p>
                <p className="text-2xl font-display font-bold">{data?.volume?.total || '0'} ETH</p>
              </div>
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-display">Sales</p>
                <p className="text-2xl font-display font-bold">{data?.sales?.total || 0}</p>
              </div>
              <FiTrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerAnalytics;
