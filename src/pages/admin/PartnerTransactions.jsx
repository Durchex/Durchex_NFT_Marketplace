import React, { useState } from 'react';
import { FiEye, FiLock, FiDollarSign, FiTrendingUp, FiTrendingDown, FiClock } from 'react-icons/fi';

const PartnerTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const transactions = [
    { id: 1, hash: '0xabc123...', type: 'Purchase', amount: '2.5 ETH', status: 'completed', timestamp: '2024-01-15 10:30:00', from: '0x123...', to: '0x456...' },
    { id: 2, hash: '0xdef456...', type: 'Sale', amount: '1.8 ETH', status: 'completed', timestamp: '2024-01-15 09:15:00', from: '0x789...', to: '0xabc...' },
    { id: 3, hash: '0xghi789...', type: 'Transfer', amount: '0.5 ETH', status: 'pending', timestamp: '2024-01-15 08:45:00', from: '0xdef...', to: '0xghi...' },
    { id: 4, hash: '0xjkl012...', type: 'Purchase', amount: '3.2 ETH', status: 'failed', timestamp: '2024-01-15 07:20:00', from: '0xjkl...', to: '0x012...' },
  ];

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Purchase': return <FiTrendingUp className="w-4 h-4 text-green-500" />;
      case 'Sale': return <FiTrendingDown className="w-4 h-4 text-red-500" />;
      case 'Transfer': return <FiDollarSign className="w-4 h-4 text-blue-500" />;
      default: return <FiDollarSign className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900">Transaction History</h2>
        <div className="flex items-center space-x-2 text-yellow-600">
          <FiEye className="w-5 h-5" />
          <span className="font-display text-sm">Read-only access</span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 font-display">
          You can view transaction history but cannot modify transactions. Contact the main administrator for transaction management actions.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-display text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-2/3 justify-end">
          <select
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-display text-gray-900"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono font-display text-gray-900">{tx.hash}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(tx.type)}
                    <span className="text-sm font-display text-gray-900">{tx.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-display font-medium text-gray-900">
                  {tx.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tx.status)} font-display`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-display">
                  {tx.timestamp}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900">
                    <FiEye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartnerTransactions;
