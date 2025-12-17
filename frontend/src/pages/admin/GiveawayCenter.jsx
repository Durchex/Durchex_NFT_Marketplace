import React, { useState, useEffect } from 'react';
import { FiGift, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const GiveawayCenter = () => {
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, offered, claimed, minted

  // Fetch giveaway NFTs
  const fetchGiveaways = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filter !== 'all') {
        queryParams.append('status', filter);
      }

      const response = await api.get(`/admin/nfts/giveaways/list?${queryParams}`);
      setGiveaways(response.data.giveaways || []);
    } catch (error) {
      toast.error('Failed to fetch giveaway NFTs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiveaways();
  }, [filter]);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600';
      case 'offered':
        return 'bg-blue-600';
      case 'claimed':
        return 'bg-purple-600';
      case 'minted':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiRefreshCw />;
      case 'offered':
        return <FiGift />;
      case 'claimed':
        return <FiCheck />;
      case 'minted':
        return <FiCheck />;
      default:
        return null;
    }
  };

  // Statistics
  const stats = {
    total: giveaways.length,
    pending: giveaways.filter(g => g.giveawayStatus === 'pending').length,
    offered: giveaways.filter(g => g.giveawayStatus === 'offered').length,
    claimed: giveaways.filter(g => g.giveawayStatus === 'claimed').length,
    minted: giveaways.filter(g => g.giveawayStatus === 'minted').length
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
          <FiGift className="text-green-400" /> Giveaway Center
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total" value={stats.total} color="bg-slate-700" />
          <StatCard label="Pending" value={stats.pending} color="bg-yellow-900" />
          <StatCard label="Offered" value={stats.offered} color="bg-blue-900" />
          <StatCard label="Claimed" value={stats.claimed} color="bg-purple-900" />
          <StatCard label="Minted" value={stats.minted} color="bg-green-900" />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['all', 'pending', 'offered', 'claimed', 'minted'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg transition-all capitalize ${
              filter === status
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:text-white'
            }`}
          >
            {status === 'all' ? 'All Giveaways' : status}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading giveaways...</div>
      ) : giveaways.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No giveaway NFTs in this category yet.
        </div>
      ) : (
        <div className="space-y-3">
          {giveaways.map((giveaway) => (
            <GiveawayRow 
              key={giveaway._id} 
              giveaway={giveaway} 
              onUpdate={fetchGiveaways}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, color }) => (
  <div className={`${color} rounded-lg p-4 text-center`}>
    <p className="text-gray-300 text-sm">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

// Giveaway Row Component
const GiveawayRow = ({ giveaway, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRevoke = async () => {
    if (!window.confirm('Revoke this giveaway offer?')) return;

    setLoading(true);
    try {
      const response = await api.post('/admin/nfts/offer/revoke', {
        itemId: giveaway.itemId
      });

      if (response.data.success) {
        toast.success('Giveaway offer revoked');
        onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to revoke offer');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkMinted = async () => {
    const tokenId = prompt('Enter Token ID:');
    const txHash = prompt('Enter Transaction Hash:');

    if (!tokenId || !txHash) {
      toast.error('Token ID and TX Hash required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/nfts/minted/mark', {
        itemId: giveaway.itemId,
        tokenId,
        txHash,
        nftContract: giveaway.nftContract
      });

      if (response.data.success) {
        toast.success('Giveaway marked as minted');
        onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark as minted');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-700 rounded-lg border border-slate-600 hover:border-purple-500 transition-all overflow-hidden">
      {/* Row Content */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-600 transition-colors"
      >
        {/* Image */}
        <img
          src={giveaway.image}
          alt={giveaway.name}
          className="w-16 h-16 rounded object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/64?text=NFT';
          }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white">{giveaway.name}</h3>
          <p className="text-sm text-gray-400">{giveaway.collection}</p>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="bg-slate-600 text-gray-300 px-2 py-1 rounded">
              {giveaway.network}
            </span>
            {giveaway.feeSubsidyEnabled && (
              <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded">
                {giveaway.feeSubsidyPercentage}% Subsidy
              </span>
            )}
          </div>
        </div>

        {/* Offered To */}
        {giveaway.offeredTo && (
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">Offered to:</p>
            <p className="text-xs text-gray-300 font-mono truncate">
              {giveaway.offeredTo}
            </p>
          </div>
        )}

        {/* Status Badge */}
        <div className={`${getStatusColor(giveaway.giveawayStatus)} text-white px-3 py-2 rounded flex items-center gap-1 whitespace-nowrap`}>
          {getStatusIcon(giveaway.giveawayStatus)}
          <span className="capitalize text-xs font-semibold">
            {giveaway.giveawayStatus}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="bg-slate-600 border-t border-slate-500 p-4 space-y-3">
          {/* Description */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Description:</p>
            <p className="text-sm text-gray-300">{giveaway.description}</p>
          </div>

          {/* Admin Notes */}
          {giveaway.adminNotes && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Admin Notes:</p>
              <p className="text-sm text-gray-300">{giveaway.adminNotes}</p>
            </div>
          )}

          {/* Created Date */}
          <div>
            <p className="text-xs text-gray-400">
              Created: {new Date(giveaway.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {giveaway.giveawayStatus === 'offered' && (
              <button
                onClick={handleRevoke}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiX /> Revoke
              </button>
            )}

            {giveaway.giveawayStatus !== 'minted' && (
              <button
                onClick={handleMarkMinted}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiCheck /> Mark Minted
              </button>
            )}

            {giveaway.giveawayStatus === 'minted' && (
              <div className="flex-1 bg-green-900 text-green-200 px-3 py-2 rounded text-sm flex items-center justify-center gap-2">
                <FiCheck /> Completed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GiveawayCenter;
