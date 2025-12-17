import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiGift, FiPercent, FiCheck } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const UnmintedNFTManager = () => {
  const [unmintedNFTs, setUnmintedNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    category: 'art',
    collection: '',
    network: 'Polygon',
    price: '',
    isGiveaway: false,
    adminNotes: '',
    properties: {}
  });
  const [filter, setFilter] = useState({ isGiveaway: 'all', network: 'all' });

  // Fetch unminted NFTs
  const fetchUnmintedNFTs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filter.isGiveaway !== 'all') {
        queryParams.append('isGiveaway', filter.isGiveaway === 'true');
      }
      
      if (filter.network !== 'all') {
        queryParams.append('network', filter.network);
      }

      const response = await api.get(`/admin/nfts/unminted/list?${queryParams}`);
      setUnmintedNFTs(response.data.nfts || []);
    } catch (error) {
      toast.error('Failed to fetch unminted NFTs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnmintedNFTs();
  }, [filter]);

  // Create unminted NFT
  const handleCreateNFT = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.image || !formData.collection) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await api.post('/admin/nfts/unminted/create', formData);
      
      if (response.data.success) {
        toast.success('Unminted NFT created successfully');
        setUnmintedNFTs([response.data.nft, ...unmintedNFTs]);
        setFormData({
          name: '',
          description: '',
          image: '',
          category: 'art',
          collection: '',
          network: 'Polygon',
          price: '',
          isGiveaway: false,
          adminNotes: '',
          properties: {}
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create NFT');
      console.error(error);
    }
  };

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Unminted NFTs</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all"
        >
          <FiPlus /> Create Unminted NFT
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6 p-6 bg-slate-700 rounded-lg border border-slate-600">
          <h3 className="text-xl font-semibold text-white mb-4">Create New Unminted NFT</h3>
          
          <form onSubmit={handleCreateNFT} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">NFT Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Summer Collection #1"
                  className="w-full bg-slate-600 text-white border border-slate-500 rounded px-3 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Collection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Collection *</label>
                <input
                  type="text"
                  name="collection"
                  value={formData.collection}
                  onChange={handleInputChange}
                  placeholder="e.g., Summer Collection"
                  className="w-full bg-slate-600 text-white border border-slate-500 rounded px-3 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Network */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Network</label>
                <select
                  name="network"
                  value={formData.network}
                  onChange={handleInputChange}
                  className="w-full bg-slate-600 text-white border border-slate-500 rounded px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option>Ethereum</option>
                  <option>Polygon</option>
                  <option>BSC</option>
                  <option>Arbitrum</option>
                  <option>Base</option>
                  <option>Optimism</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-slate-600 text-white border border-slate-500 rounded px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="art">Art</option>
                  <option value="collectibles">Collectibles</option>
                  <option value="gaming">Gaming</option>
                  <option value="music">Music</option>
                  <option value="virtual">Virtual Worlds</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price (optional)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full bg-slate-600 text-white border border-slate-500 rounded px-3 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL *</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full bg-slate-600 text-white border border-slate-500 rounded px-3 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Detailed description..."
                rows="3"
                className="w-full bg-slate-600 text-white border border-slate-500 rounded px-3 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
              <textarea
                name="adminNotes"
                value={formData.adminNotes}
                onChange={handleInputChange}
                placeholder="Internal notes..."
                rows="2"
                className="w-full bg-slate-600 text-white border border-slate-500 rounded px-3 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Checkboxes */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  name="isGiveaway"
                  checked={formData.isGiveaway}
                  onChange={handleInputChange}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1"><FiGift /> Mark as Giveaway</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all font-semibold"
              >
                <FiPlus className="inline mr-2" /> Create NFT
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={filter.isGiveaway}
          onChange={(e) => setFilter(prev => ({ ...prev, isGiveaway: e.target.value }))}
          className="bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-purple-500"
        >
          <option value="all">All NFTs</option>
          <option value="true">Giveaways Only</option>
          <option value="false">Regular Only</option>
        </select>

        <select
          value={filter.network}
          onChange={(e) => setFilter(prev => ({ ...prev, network: e.target.value }))}
          className="bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Networks</option>
          <option value="Ethereum">Ethereum</option>
          <option value="Polygon">Polygon</option>
          <option value="BSC">BSC</option>
          <option value="Arbitrum">Arbitrum</option>
          <option value="Base">Base</option>
          <option value="Optimism">Optimism</option>
        </select>
      </div>

      {/* NFT List */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading unminted NFTs...</div>
      ) : unmintedNFTs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No unminted NFTs yet. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unmintedNFTs.map((nft) => (
            <UnmintedNFTCard key={nft._id} nft={nft} onUpdate={fetchUnmintedNFTs} />
          ))}
        </div>
      )}
    </div>
  );
};

// Card Component
const UnmintedNFTCard = ({ nft, onUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-slate-700 rounded-lg overflow-hidden border border-slate-600 hover:border-purple-500 transition-all">
      {/* Image */}
      <div className="relative h-48 bg-slate-600 overflow-hidden">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300?text=NFT';
          }}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {nft.isGiveaway && (
            <span className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <FiGift /> Giveaway
            </span>
          )}
          {nft.feeSubsidyEnabled && (
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <FiPercent /> {nft.feeSubsidyPercentage}%
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1">{nft.name}</h3>
        <p className="text-sm text-gray-400 mb-2">{nft.collection}</p>
        
        <div className="flex gap-2 mb-3 text-xs">
          <span className="bg-slate-600 text-gray-300 px-2 py-1 rounded">{nft.network}</span>
          <span className="bg-slate-600 text-gray-300 px-2 py-1 rounded">{nft.category}</span>
        </div>

        <p className="text-sm text-gray-300 mb-3 line-clamp-2">{nft.description}</p>

        {nft.price && (
          <p className="text-lg font-semibold text-purple-400 mb-3">{nft.price} ETH</p>
        )}

        {/* Status */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-gray-400">Status:</span>
          <span className={`text-xs px-2 py-1 rounded ${
            nft.isMinted ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
          }`}>
            {nft.isMinted ? 'Minted' : 'Unminted'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-all"
          >
            <FiEdit2 className="inline mr-1" /> Manage
          </button>
        </div>

        {/* Details */}
        {showDetails && (
          <NFTDetailsPanel nft={nft} onUpdate={onUpdate} onClose={() => setShowDetails(false)} />
        )}
      </div>
    </div>
  );
};

// Details Panel Component
const NFTDetailsPanel = ({ nft, onUpdate, onClose }) => {
  const [subsidyPercentage, setSubsidyPercentage] = useState(nft.feeSubsidyPercentage || 0);
  const [recipientWallet, setRecipientWallet] = useState('');
  const [loading, setLoading] = useState(false);

  // Offer NFT to user
  const handleOfferNFT = async () => {
    if (!recipientWallet) {
      toast.error('Please enter wallet address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/nfts/offer', {
        itemId: nft.itemId,
        walletAddress: recipientWallet,
        subsidyPercentage: parseInt(subsidyPercentage)
      });

      if (response.data.success) {
        toast.success('NFT offered successfully');
        setRecipientWallet('');
        onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to offer NFT');
    } finally {
      setLoading(false);
    }
  };

  // Set fee subsidy
  const handleSetSubsidy = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/nfts/subsidy/set', {
        itemId: nft.itemId,
        percentage: parseInt(subsidyPercentage),
        recipients: []
      });

      if (response.data.success) {
        toast.success(`Fee subsidy set to ${subsidyPercentage}%`);
        onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to set subsidy');
    } finally {
      setLoading(false);
    }
  };

  // Mark as minted
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
        itemId: nft.itemId,
        tokenId,
        txHash,
        nftContract: nft.nftContract
      });

      if (response.data.success) {
        toast.success('NFT marked as minted');
        onUpdate();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark as minted');
    } finally {
      setLoading(false);
    }
  };

  // Revoke offer
  const handleRevokeOffer = async () => {
    if (!window.confirm('Revoke this NFT offer?')) return;

    setLoading(true);
    try {
      const response = await api.post('/admin/nfts/offer/revoke', {
        itemId: nft.itemId
      });

      if (response.data.success) {
        toast.success('Offer revoked');
        onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to revoke offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Manage NFT</h3>

        {/* Current Status */}
        {nft.offeredTo && (
          <div className="mb-4 p-3 bg-blue-900 rounded border border-blue-600">
            <p className="text-sm text-blue-200">
              Offered to: <br />
              <span className="font-mono text-xs break-all">{nft.offeredTo}</span>
            </p>
          </div>
        )}

        {/* Subsidy Input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Fee Subsidy %</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="100"
              value={subsidyPercentage}
              onChange={(e) => setSubsidyPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="flex-1 bg-slate-700 text-white border border-slate-600 rounded px-3 py-2"
            />
            <button
              onClick={handleSetSubsidy}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Set
            </button>
          </div>
        </div>

        {/* Wallet Input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Offer to Wallet</label>
          <input
            type="text"
            value={recipientWallet}
            onChange={(e) => setRecipientWallet(e.target.value)}
            placeholder="0x..."
            className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
          />
          <button
            onClick={handleOfferNFT}
            disabled={loading}
            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded disabled:opacity-50"
          >
            <FiGift className="inline mr-2" /> Offer NFT
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {!nft.isMinted && (
            <button
              onClick={handleMarkMinted}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded disabled:opacity-50"
            >
              <FiCheck className="inline mr-2" /> Mark as Minted
            </button>
          )}

          {nft.offeredTo && (
            <button
              onClick={handleRevokeOffer}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded disabled:opacity-50"
            >
              <FiTrash2 className="inline mr-2" /> Revoke Offer
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UnmintedNFTManager;
