import React, { useState, useEffect } from 'react';
import { FiPercent, FiSearch, FiEdit2, FiSave } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FeeSubsidyDashboard = () => {
  const [subsidizedNFTs, setSubsidizedNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchItemId, setSearchItemId] = useState('');
  const [selectedNFT, setSelectedNFT] = useState(null);

  // Fetch unminted NFTs (which can have subsidies)
  const fetchSubsidizedNFTs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/nfts/unminted/list');
      const subsidized = response.data.nfts.filter(nft => nft.feeSubsidyEnabled);
      setSubsidizedNFTs(subsidized);
    } catch (error) {
      toast.error('Failed to fetch NFTs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubsidizedNFTs();
  }, []);

  // Filter by search
  const filtered = subsidizedNFTs.filter(nft =>
    nft.itemId.toLowerCase().includes(searchItemId.toLowerCase()) ||
    nft.name.toLowerCase().includes(searchItemId.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    totalSubsidized: subsidizedNFTs.length,
    avgSubsidy: subsidizedNFTs.length > 0
      ? Math.round(subsidizedNFTs.reduce((sum, nft) => sum + nft.feeSubsidyPercentage, 0) / subsidizedNFTs.length)
      : 0,
    totalRecipients: subsidizedNFTs.reduce((sum, nft) => sum + (nft.feeSubsidyRecipients?.length || 0), 0),
    claimedCount: subsidizedNFTs.reduce((sum, nft) => 
      sum + (nft.feeSubsidyRecipients?.filter(r => r.claimed).length || 0), 0
    )
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
          <FiPercent className="text-blue-400" /> Fee Subsidy Dashboard
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Subsidized NFTs" value={stats.totalSubsidized} color="bg-slate-700" />
          <StatBox label="Avg Subsidy %" value={`${stats.avgSubsidy}%`} color="bg-blue-900" />
          <StatBox label="Total Recipients" value={stats.totalRecipients} color="bg-purple-900" />
          <StatBox label="Subsidies Claimed" value={stats.claimedCount} color="bg-green-900" />
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-2">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or item ID..."
            value={searchItemId}
            onChange={(e) => setSearchItemId(e.target.value)}
            className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 pl-10 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={fetchSubsidizedNFTs}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-all"
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading subsidized NFTs...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {subsidizedNFTs.length === 0
            ? 'No subsidized NFTs yet.'
            : 'No matching NFTs found.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((nft) => (
            <SubsidyRow
              key={nft._id}
              nft={nft}
              onSelect={() => setSelectedNFT(nft)}
              onUpdate={fetchSubsidizedNFTs}
            />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedNFT && (
        <SubsidyDetailPanel
          nft={selectedNFT}
          onClose={() => setSelectedNFT(null)}
          onUpdate={fetchSubsidizedNFTs}
        />
      )}
    </div>
  );
};

// Stat Box Component
const StatBox = ({ label, value, color }) => (
  <div className={`${color} rounded-lg p-4`}>
    <p className="text-gray-300 text-sm">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

// Subsidy Row Component
const SubsidyRow = ({ nft, onSelect, onUpdate }) => {
  const claimedCount = nft.feeSubsidyRecipients?.filter(r => r.claimed).length || 0;
  const totalRecipients = nft.feeSubsidyRecipients?.length || 0;

  return (
    <div
      onClick={onSelect}
      className="bg-slate-700 rounded-lg border border-slate-600 hover:border-blue-500 transition-all p-4 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        {/* Image */}
        <img
          src={nft.image}
          alt={nft.name}
          className="w-20 h-20 rounded object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/80?text=NFT';
          }}
        />

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">{nft.name}</h3>
          <p className="text-sm text-gray-400 mb-2">{nft.collection}</p>
          
          <div className="flex gap-2 mb-2">
            <span className="bg-slate-600 text-gray-300 px-2 py-1 rounded text-xs">
              {nft.network}
            </span>
            <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs font-semibold">
              {nft.feeSubsidyPercentage}% Subsidy
            </span>
          </div>

          {/* Recipients Bar */}
          {totalRecipients > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex-1 bg-slate-600 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all"
                  style={{ width: `${(claimedCount / totalRecipients) * 100}%` }}
                />
              </div>
              <span className="text-gray-300">
                {claimedCount}/{totalRecipients} claimed
              </span>
            </div>
          )}
        </div>

        {/* Subsidy Badge */}
        <div className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-center min-w-20">
          <div className="text-2xl">{nft.feeSubsidyPercentage}%</div>
          <div className="text-xs">subsidy</div>
        </div>
      </div>
    </div>
  );
};

// Detail Panel Component
const SubsidyDetailPanel = ({ nft, onClose, onUpdate }) => {
  const [newSubsidy, setNewSubsidy] = useState(nft.feeSubsidyPercentage);
  const [newRecipient, setNewRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleUpdateSubsidy = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/nfts/subsidy/set', {
        itemId: nft.itemId,
        percentage: parseInt(newSubsidy),
        recipients: nft.feeSubsidyRecipients || []
      });

      if (response.data.success) {
        toast.success('Fee subsidy updated');
        setEditing(false);
        onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update subsidy');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipient = async () => {
    if (!newRecipient) {
      toast.error('Please enter wallet address');
      return;
    }

    setLoading(true);
    try {
      const recipients = [...(nft.feeSubsidyRecipients || [])];
      
      // Check if already exists
      if (recipients.some(r => r.walletAddress.toLowerCase() === newRecipient.toLowerCase())) {
        toast.error('Wallet already in recipients list');
        setLoading(false);
        return;
      }

      recipients.push({
        walletAddress: newRecipient,
        subsidy: '0',
        claimed: false
      });

      const response = await api.post('/admin/nfts/subsidy/set', {
        itemId: nft.itemId,
        percentage: nft.feeSubsidyPercentage,
        recipients
      });

      if (response.data.success) {
        toast.success('Recipient added');
        setNewRecipient('');
        onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add recipient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{nft.name}</h3>
            <p className="text-sm text-gray-400">{nft.collection}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Subsidy Setting */}
        <div className="mb-6 p-4 bg-slate-700 rounded border border-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-300 mb-2">Fee Subsidy Percentage</label>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newSubsidy}
                    onChange={(e) => setNewSubsidy(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="flex-1 bg-slate-600 text-white border border-slate-500 rounded px-3 py-2"
                  />
                  <button
                    onClick={handleUpdateSubsidy}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 flex items-center gap-2"
                  >
                    <FiSave /> Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setNewSubsidy(nft.feeSubsidyPercentage);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-blue-400">{nft.feeSubsidyPercentage}%</div>
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <FiEdit2 /> Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Recipient */}
        <div className="mb-6 p-4 bg-slate-700 rounded border border-slate-600">
          <label className="block text-sm text-gray-300 mb-2">Add Recipient Wallet</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              placeholder="0x..."
              className="flex-1 bg-slate-600 text-white border border-slate-500 rounded px-3 py-2 text-sm"
            />
            <button
              onClick={handleAddRecipient}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Recipients List */}
        {nft.feeSubsidyRecipients && nft.feeSubsidyRecipients.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Recipients ({nft.feeSubsidyRecipients.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {nft.feeSubsidyRecipients.map((recipient, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-600 rounded border border-slate-500"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 font-mono truncate">
                      {recipient.walletAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {recipient.claimed && (
                      <span className="bg-green-900 text-green-200 px-2 py-1 rounded text-xs">
                        ✓ Claimed
                      </span>
                    )}
                    {!recipient.claimed && (
                      <span className="bg-yellow-900 text-yellow-200 px-2 py-1 rounded text-xs">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeSubsidyDashboard;
