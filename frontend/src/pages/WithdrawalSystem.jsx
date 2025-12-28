import React, { useState, useEffect, useContext } from 'react';
import { ICOContent } from '../Context';
import { withdrawalAPI } from '../services/withdrawalAPI';
import toast from 'react-hot-toast';
import {
  FiArrowDownCircle,
  FiArrowUpRight,
  FiDollarSign,
  FiClock,
  FiCheck,
  FiX,
  FiTrendingUp,
  FiUsers,
  FiLoader,
} from 'react-icons/fi';

const WithdrawalSystem = () => {
  const { address, selectedChain } = useContext(ICOContent);
  const [activeTab, setActiveTab] = useState('earnings');
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    targetWallet: '',
    amount: '',
    network: selectedChain || 'polygon',
  });
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);

  // Fetch earnings dashboard
  useEffect(() => {
    if (address) {
      fetchEarnings();
    }
  }, [address]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await withdrawalAPI.getEarningsDashboard(address);
      if (response.success) {
        setEarnings(response.dashboard);
        fetchWithdrawalHistory();
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalHistory = async () => {
    try {
      const response = await withdrawalAPI.getWithdrawalHistory(address, {
        limit: 10,
      });
      if (response.success) {
        setWithdrawalHistory(response.withdrawals);
      }
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
    }
  };

  const handleWithdrawalChange = (field, value) => {
    setWithdrawalForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();

    if (
      !withdrawalForm.targetWallet ||
      !withdrawalForm.amount ||
      !withdrawalForm.network
    ) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setProcessingWithdrawal(true);

      const response = await withdrawalAPI.requestWithdrawal({
        userWallet: address,
        targetWallet: withdrawalForm.targetWallet,
        amount: withdrawalForm.amount,
        network: withdrawalForm.network,
        withdrawalType: 'sales_earnings',
      });

      if (response.success) {
        toast.success('Withdrawal request submitted');
        setShowWithdrawalModal(false);
        setWithdrawalForm({
          targetWallet: '',
          amount: '',
          network: selectedChain || 'polygon',
        });
        fetchEarnings();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to request withdrawal';
      toast.error(errorMsg);
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FiLoader className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-400">Loading earnings...</p>
        </div>
      </div>
    );
  }

  const personalEarnings = earnings?.personalEarnings || {};
  const partnerEarnings = earnings?.partnerEarnings || { data: [], totalPending: '0' };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Earnings & Withdrawals</h1>
          <p className="text-gray-400">
            Manage your NFT sales earnings and partner payouts
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('earnings')}
            className={`pb-4 px-2 font-semibold border-b-2 transition-all ${
              activeTab === 'earnings'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5" />
              My Earnings
            </div>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`pb-4 px-2 font-semibold border-b-2 transition-all ${
              activeTab === 'withdrawals'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiArrowDownCircle className="w-5 h-5" />
              Withdrawals
            </div>
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            className={`pb-4 px-2 font-semibold border-b-2 transition-all ${
              activeTab === 'partners'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiUsers className="w-5 h-5" />
              Partner Earnings
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'earnings' && (
          <EarningsTab
            earnings={personalEarnings}
            onWithdraw={() => setShowWithdrawalModal(true)}
          />
        )}

        {activeTab === 'withdrawals' && (
          <WithdrawalsTab
            withdrawalHistory={withdrawalHistory}
            onRefresh={fetchWithdrawalHistory}
          />
        )}

        {activeTab === 'partners' && (
          <PartnersTab partnerData={partnerEarnings} />
        )}

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <WithdrawalModal
            form={withdrawalForm}
            onChange={handleWithdrawalChange}
            onSubmit={handleRequestWithdrawal}
            onClose={() => setShowWithdrawalModal(false)}
            isLoading={processingWithdrawal}
            address={address}
          />
        )}
      </div>
    </div>
  );
};

// Earnings Tab Component
const EarningsTab = ({ earnings, onWithdraw }) => {
  const totalEarnings = earnings.totalEarnings || '0';
  const byNetwork = earnings.byNetwork || {};

  const formatEther = (wei) => {
    try {
      return (parseFloat(wei) / 1e18).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Earnings Card */}
        <div className="bg-gradient-to-br from-purple-900/30 to-purple-700/30 rounded-lg p-6 border border-purple-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-2">Total Earnings</p>
              <p className="text-3xl font-bold">
                {formatEther(totalEarnings)} ETH
              </p>
              <p className="text-gray-500 text-xs mt-2">All networks combined</p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        {/* Network Breakdown */}
        {Object.entries(byNetwork).map(([network, data]) => (
          <div
            key={network}
            className="bg-gradient-to-br from-blue-900/30 to-blue-700/30 rounded-lg p-6 border border-blue-500/30"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium capitalize mb-2">
                  {network} Earnings
                </p>
                <p className="text-2xl font-bold">{formatEther(data.earnings)}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {data.transactionCount} sales
                </p>
              </div>
              <FiDollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">Earnings Breakdown</h2>
        <div className="space-y-3">
          {Object.entries(byNetwork).map(([network, data]) => (
            <div
              key={network}
              className="flex items-center justify-between p-4 bg-gray-800/50 rounded"
            >
              <div>
                <p className="font-medium capitalize">{network}</p>
                <p className="text-xs text-gray-500">
                  {data.transactionCount} transactions
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatEther(data.earnings)} ETH</p>
                <p className="text-xs text-gray-500">
                  Fees: {formatEther(data.platformFees)} ETH
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onWithdraw}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
      >
        <FiArrowDownCircle className="w-5 h-5" />
        Withdraw Earnings
      </button>
    </div>
  );
};

// Withdrawals Tab Component
const WithdrawalsTab = ({ withdrawalHistory, onRefresh }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400';
      case 'processing':
        return 'text-yellow-400';
      case 'pending':
        return 'text-blue-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <FiCheck className="w-4 h-4" />;
      case 'processing':
        return <FiClock className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <FiX className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  const formatEther = (wei) => {
    try {
      return (parseFloat(wei) / 1e18).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recent Withdrawals</h2>
        <button
          onClick={onRefresh}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {withdrawalHistory.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
          <FiArrowDownCircle className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No withdrawals yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawalHistory.map((withdrawal) => (
            <div
              key={withdrawal._id}
              className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-full bg-gray-800 ${getStatusColor(
                      withdrawal.status
                    )}`}
                  >
                    {getStatusIcon(withdrawal.status)}
                  </div>
                  <div>
                    <p className="font-semibold">{formatEther(withdrawal.amount)} ETH</p>
                    <p className="text-xs text-gray-500">
                      {withdrawal.targetWallet.slice(0, 6)}...
                      {withdrawal.targetWallet.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`capitalize font-medium ${getStatusColor(
                      withdrawal.status
                    )}`}
                  >
                    {withdrawal.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(withdrawal.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Partners Tab Component
const PartnersTab = ({ partnerData }) => {
  const formatEther = (wei) => {
    try {
      return (parseFloat(wei) / 1e18).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  return (
    <div className="space-y-6">
      {/* Partner Earnings Summary */}
      <div className="bg-gradient-to-br from-pink-900/30 to-purple-700/30 rounded-lg p-6 border border-pink-500/30">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-2">
              Partner Share Pending
            </p>
            <p className="text-3xl font-bold">
              {formatEther(partnerData.totalPending)} ETH
            </p>
            <p className="text-gray-500 text-xs mt-2">
              {partnerData.data.length} active partnerships
            </p>
          </div>
          <FiUsers className="w-8 h-8 text-pink-400" />
        </div>
      </div>

      {/* Partner List */}
      {partnerData.data.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
          <FiUsers className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No active partner agreements</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partnerData.data.map((partner, idx) => (
            <div
              key={idx}
              className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{partner.ownerName}</p>
                  <p className="text-xs text-gray-500">
                    Share: {partner.sharePercentage}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {formatEther(partner.pendingBalance)} ETH
                  </p>
                  <p className="text-xs text-gray-500">Pending withdrawal</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Withdrawal Modal Component
const WithdrawalModal = ({
  form,
  onChange,
  onSubmit,
  onClose,
  isLoading,
  address,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Request Withdrawal</h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Network Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Network
            </label>
            <select
              value={form.network}
              onChange={(e) => onChange('network', e.target.value)}
              disabled={isLoading}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            >
              <option value="polygon">Polygon</option>
              <option value="ethereum">Ethereum</option>
              <option value="mumbai">Mumbai</option>
              <option value="base">Base</option>
            </select>
          </div>

          {/* Target Wallet */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Wallet Address
            </label>
            <input
              type="text"
              value={form.targetWallet}
              onChange={(e) => onChange('targetWallet', e.target.value)}
              placeholder="0x..."
              disabled={isLoading}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: Your wallet ({address.slice(0, 6)}...
              {address.slice(-4)})
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (ETH)
            </label>
            <input
              type="number"
              step="0.0001"
              value={form.amount}
              onChange={(e) => onChange('amount', e.target.value)}
              placeholder="0.5"
              disabled={isLoading}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <FiLoader className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawalSystem;
