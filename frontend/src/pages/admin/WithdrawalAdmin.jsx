import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { cartAPI } from '../../services/api';
import {
  FiArrowDownCircle,
  FiCheckCircle,
  FiLoader,
  FiX,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';

const WithdrawalAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [selectedWithdrawals, setSelectedWithdrawals] = useState(new Set());
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.get(
        `/admin/withdrawals?status=${filter}&limit=100`
      );
      if (response.data.success) {
        setPendingWithdrawals(response.data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawals = async () => {
    try {
      setRefreshing(true);
      const response = await cartAPI.post('/admin/process-withdrawals');
      
      if (response.data.success) {
        toast.success(
          `Processed ${response.data.results.length} withdrawals`
        );
        fetchWithdrawals();
      }
    } catch (error) {
      console.error('Error processing withdrawals:', error);
      toast.error('Failed to process withdrawals');
    } finally {
      setRefreshing(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    // This would be implemented with your admin withdrawal approval logic
    toast.info('Implement withdrawal approval in your admin system');
  };

  const handleRejectWithdrawal = async (withdrawalId, reason) => {
    // This would be implemented with your admin withdrawal rejection logic
    toast.info('Implement withdrawal rejection in your admin system');
  };

  const toggleSelection = (withdrawalId) => {
    const newSelected = new Set(selectedWithdrawals);
    if (newSelected.has(withdrawalId)) {
      newSelected.delete(withdrawalId);
    } else {
      newSelected.add(withdrawalId);
    }
    setSelectedWithdrawals(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedWithdrawals.size === pendingWithdrawals.length) {
      setSelectedWithdrawals(new Set());
    } else {
      setSelectedWithdrawals(new Set(pendingWithdrawals.map((w) => w._id)));
    }
  };

  const formatEther = (wei) => {
    try {
      return (parseFloat(wei) / 1e18).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-900/30 border-green-500/30 text-green-400';
      case 'processing':
        return 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400';
      case 'pending':
        return 'bg-blue-900/30 border-blue-500/30 text-blue-400';
      case 'failed':
        return 'bg-red-900/30 border-red-500/30 text-red-400';
      default:
        return 'bg-gray-900/30 border-gray-500/30 text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'processing':
        return <FiLoader className="w-4 h-4 animate-spin" />;
      case 'pending':
        return <FiAlertCircle className="w-4 h-4" />;
      case 'failed':
        return <FiX className="w-4 h-4" />;
      default:
        return <FiArrowDownCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Withdrawal Management</h2>
        <button
          onClick={handleProcessWithdrawals}
          disabled={refreshing || loading}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          {refreshing && <FiLoader className="w-4 h-4 animate-spin" />}
          <FiRefreshCw className="w-4 h-4" />
          {refreshing ? 'Processing...' : 'Process Pending'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-gray-700">
        {['pending', 'processing', 'confirmed', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`pb-3 px-4 font-semibold capitalize transition-all border-b-2 ${
              filter === status
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Stats */}
      {pendingWithdrawals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Total Pending</p>
            <p className="text-2xl font-bold">
              {pendingWithdrawals
                .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0)
                .toFixed(2)}{' '}
              ETH
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Count</p>
            <p className="text-2xl font-bold">{pendingWithdrawals.length}</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Selected</p>
            <p className="text-2xl font-bold">{selectedWithdrawals.size}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <FiLoader className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : pendingWithdrawals.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
          <FiArrowDownCircle className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No {filter} withdrawals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          {pendingWithdrawals.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={selectedWithdrawals.size === pendingWithdrawals.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-gray-400">
                Select all ({pendingWithdrawals.length})
              </span>
            </div>
          )}

          {/* Withdrawals Table */}
          <div className="space-y-2">
            {pendingWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal._id}
                className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-all flex items-center gap-4"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedWithdrawals.has(withdrawal._id)}
                  onChange={() => toggleSelection(withdrawal._id)}
                  className="w-4 h-4 cursor-pointer"
                />

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">
                      {withdrawal.userWallet.slice(0, 6)}...
                      {withdrawal.userWallet.slice(-4)} →{' '}
                      {withdrawal.targetWallet.slice(0, 6)}...
                      {withdrawal.targetWallet.slice(-4)}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(withdrawal.status)}`}>
                      {getStatusIcon(withdrawal.status)}
                      {withdrawal.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Amount</p>
                      <p className="font-bold">
                        {formatEther(withdrawal.amount)} ETH
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Network</p>
                      <p className="font-bold capitalize">
                        {withdrawal.network}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Type</p>
                      <p className="font-bold capitalize">
                        {withdrawal.withdrawalType.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Requested</p>
                      <p className="font-bold">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {withdrawal.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveWithdrawal(withdrawal._id)}
                      className="px-3 py-2 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-500/30 rounded transition-colors"
                      title="Approve"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleRejectWithdrawal(withdrawal._id, 'Manual rejection')
                      }
                      className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 rounded transition-colors"
                      title="Reject"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedWithdrawals.size > 0 && (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 flex gap-3">
          <button
            onClick={() =>
              toast.success(
                `Would approve ${selectedWithdrawals.size} withdrawals`
              )
            }
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
          >
            Approve ({selectedWithdrawals.size})
          </button>
          <button
            onClick={() => setSelectedWithdrawals(new Set())}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-semibold transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default WithdrawalAdmin;
