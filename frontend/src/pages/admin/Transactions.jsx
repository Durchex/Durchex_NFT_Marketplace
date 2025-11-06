import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiDollarSign, FiClock, FiCheck, FiX, FiTrendingUp, FiTrendingDown, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterNetwork, setFilterNetwork] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  const fetchTransactions = async (page = 1, filters = {}) => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getTransactions(page, pagination.limit, {
        ...filters,
        search: searchTerm
      });
      setTransactions(data.transactions || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filters = {};
    if (filterStatus !== 'all') filters.status = filterStatus;
    if (filterType !== 'all') filters.type = filterType;
    if (filterNetwork !== 'all') filters.network = filterNetwork;
    fetchTransactions(pagination.page, filters);
  }, [pagination.page, filterStatus, filterType, filterNetwork]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchTransactions(1, { status: filterStatus, type: filterType, network: filterNetwork });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-display">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 font-display">View and manage all marketplace transactions</p>
        </div>
        <button
          onClick={() => fetchTransactions(pagination.page, { status: filterStatus, type: filterType, network: filterNetwork })}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-display"
        >
          <FiRefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by hash, NFT name, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={filterNetwork}
              onChange={(e) => setFilterNetwork(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
            >
              <option value="all">All Networks</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="bsc">BSC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Hash</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">NFT</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">To</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono text-gray-900 font-display">{tx.hash}</span>
                        <button className="text-blue-600 hover:text-blue-900">
                          <FiEye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {tx.nft?.image && (
                          <img src={tx.nft.image} alt={tx.nft.name} className="w-10 h-10 rounded-lg" />
                        )}
                        <div>
                          <div className="text-sm font-display font-medium text-gray-900">
                            {tx.nft?.name || 'Unknown NFT'}
                          </div>
                          <div className="text-xs text-gray-500 font-display">
                            {tx.nft?.collection || 'No collection'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 font-display">
                      {formatAddress(tx.from)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 font-display">
                      {formatAddress(tx.to)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display font-semibold text-gray-900">
                      {tx.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500">
                      {formatDate(tx.timestamp)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-gray-500 font-display">No transactions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-display text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchTransactions(pagination.page - 1, { status: filterStatus, type: filterType, network: filterNetwork })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 font-display"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchTransactions(pagination.page + 1, { status: filterStatus, type: filterType, network: filterNetwork })}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 font-display"
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

export default Transactions;
