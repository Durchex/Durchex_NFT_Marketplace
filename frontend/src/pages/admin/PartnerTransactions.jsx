import React, { useState, useEffect } from 'react';
import { FiEye, FiSearch, FiFilter, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { adminAPI } from '../../services/adminAPI';

const PartnerTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  const fetchTransactions = async (page = 1) => {
    setIsLoading(true);
    try {
      const filters = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      const data = await adminAPI.getTransactions(page, pagination.limit, { ...filters, search: searchTerm });
      setTransactions(data.transactions || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch (e) {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(pagination.page);
  }, [pagination.page, filterStatus]);

  useEffect(() => {
    const t = setTimeout(() => fetchTransactions(1), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Sale': return <FiTrendingUp className="w-4 h-4 text-green-600" />;
      case 'Purchase': return <FiTrendingDown className="w-4 h-4 text-red-600" />;
      default: return <FiDollarSign className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatAddress = (addr) => (addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : 'Unknown');
  const formatDate = (date) => (date ? new Date(date).toLocaleString() : '—');

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900">Transactions (Read-only)</h2>
      </div>

      {/* Filters */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by hash, NFT name, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

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
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-display text-gray-900">{tx.hash}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    {tx.nft?.image && (<img src={tx.nft.image} alt={tx.nft.name} className="w-10 h-10 rounded-lg" />)}
                    <div>
                      <div className="text-sm font-display font-medium text-gray-900">{tx.nft?.name || 'NFT'}</div>
                      <div className="text-xs text-gray-500 font-display">{tx.nft?.collection || '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 font-display">{formatAddress(tx.from)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 font-display">{formatAddress(tx.to)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-display font-semibold text-gray-900">{tx.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-display">
                  <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>{tx.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500">{formatDate(tx.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartnerTransactions;
