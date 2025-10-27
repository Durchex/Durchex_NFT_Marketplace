import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiDollarSign, FiClock, FiCheck, FiX, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedTransactions, setSelectedTransactions] = useState([]);

  // Mock data - in real app, this would come from API
  const transactions = [
    {
      id: 1,
      hash: '0x1234567890abcdef1234567890abcdef12345678',
      type: 'sale',
      from: '0x1234...5678',
      to: '0x9876...5432',
      amount: '2.5 ETH',
      nftName: 'Cool Cat #123',
      collection: 'Cool Cats',
      status: 'completed',
      timestamp: '2024-01-15 14:30:25',
      gasUsed: '45,000',
      gasPrice: '20 Gwei',
      blockNumber: 18945678
    },
    {
      id: 2,
      hash: '0xabcdef1234567890abcdef1234567890abcdef12',
      type: 'listing',
      from: '0xabcd...efgh',
      to: '0x5678...1234',
      amount: '1.8 ETH',
      nftName: 'Space Ape #456',
      collection: 'Space Apes',
      status: 'pending',
      timestamp: '2024-01-15 13:45:12',
      gasUsed: '32,000',
      gasPrice: '18 Gwei',
      blockNumber: 18945645
    },
    {
      id: 3,
      hash: '0x9876543210fedcba9876543210fedcba98765432',
      type: 'bid',
      from: '0x5678...1234',
      to: '0xefgh...ijkl',
      amount: '3.2 ETH',
      nftName: 'Digital Art #789',
      collection: 'Digital Art',
      status: 'failed',
      timestamp: '2024-01-15 12:15:08',
      gasUsed: '0',
      gasPrice: '25 Gwei',
      blockNumber: null
    },
    {
      id: 4,
      hash: '0x456789abcdef0123456789abcdef0123456789ab',
      type: 'transfer',
      from: '0xefgh...ijkl',
      to: '0x1234...5678',
      amount: '0 ETH',
      nftName: 'Pixel Punks #321',
      collection: 'Pixel Punks',
      status: 'completed',
      timestamp: '2024-01-15 11:20:45',
      gasUsed: '28,000',
      gasPrice: '15 Gwei',
      blockNumber: 18945612
    }
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        transaction.nftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        transaction.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        transaction.to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSelectTransaction = (transactionId) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(transaction => transaction.id));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || styles.pending;
  };

  const getTypeBadge = (type) => {
    const styles = {
      sale: 'bg-blue-100 text-blue-800',
      listing: 'bg-purple-100 text-purple-800',
      bid: 'bg-orange-100 text-orange-800',
      transfer: 'bg-gray-100 text-gray-800'
    };
    return styles[type] || styles.transfer;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'sale':
        return <FiTrendingUp className="w-4 h-4 text-green-600" />;
      case 'listing':
        return <FiDollarSign className="w-4 h-4 text-blue-600" />;
      case 'bid':
        return <FiTrendingDown className="w-4 h-4 text-orange-600" />;
      case 'transfer':
        return <FiClock className="w-4 h-4 text-gray-600" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-600" />;
    }
  };

  const totalVolume = transactions
    .filter(t => t.status === 'completed' && t.type === 'sale')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 font-display">Monitor and manage all blockchain transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-display">
            Export CSV
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-display">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Total Volume</p>
              <p className="text-2xl font-display font-bold text-gray-900">{totalVolume.toFixed(2)} ETH</p>
            </div>
            <FiDollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Total Transactions</p>
              <p className="text-2xl font-display font-bold text-gray-900">{totalTransactions}</p>
            </div>
            <FiCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Completed</p>
              <p className="text-2xl font-display font-bold text-gray-900">{completedTransactions}</p>
            </div>
            <FiCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Pending</p>
              <p className="text-2xl font-display font-bold text-gray-900">{pendingTransactions}</p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-600" />
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
                placeholder="Search by hash, NFT name, or wallet address..."
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
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
            >
              <option value="all">All Types</option>
              <option value="sale">Sales</option>
              <option value="listing">Listings</option>
              <option value="bid">Bids</option>
              <option value="transfer">Transfers</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-display">
              <FiFilter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-display text-sm text-gray-700">
                {selectedTransactions.length} of {filteredTransactions.length} selected
              </span>
            </div>
            {selectedTransactions.length > 0 && (
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-display">
                  Bulk Actions
                </button>
                <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-display">
                  Export Selected
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  NFT
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-right text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction.id)}
                        onChange={() => handleSelectTransaction(transaction.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                      />
                      <div>
                        <div className="text-sm font-display font-medium text-gray-900">
                          {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          Block #{transaction.blockNumber || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(transaction.type)}
                      <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getTypeBadge(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-display font-medium text-gray-900">
                        {transaction.nftName}
                      </div>
                      <div className="text-sm text-gray-500 font-display">
                        {transaction.collection}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display font-semibold text-gray-900">
                    {transaction.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getStatusBadge(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500">
                    {transaction.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-display font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1">
                        <FiDownload className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-display text-gray-700">
              Showing 1 to {filteredTransactions.length} of {transactions.length} results
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

export default Transactions;
