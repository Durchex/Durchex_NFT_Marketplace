import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiImage, FiEye, FiEdit, FiTrash2, FiCheck, FiX, FiClock, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../../services/adminAPI';
import { nftAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const NFTs = () => {
  const [nfts, setNfts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterNetwork, setFilterNetwork] = useState('all');
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [editingNFT, setEditingNFT] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchNFTs = async (page = 1, filters = {}) => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getAllNFTsAdmin(page, pagination.limit, {
        ...filters,
        search: searchTerm
      });
      setNfts(data.nfts || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast.error('Failed to load NFTs');
      setNfts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filters = {};
    if (filterStatus !== 'all') {
      filters.status = filterStatus;
    }
    if (filterNetwork !== 'all') {
      filters.network = filterNetwork;
    }
    fetchNFTs(pagination.page, filters);
  }, [pagination.page, filterStatus, filterNetwork]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchNFTs(1, { status: filterStatus, network: filterNetwork });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectNFT = (itemId) => {
    setSelectedNFTs(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNFTs.length === nfts.length) {
      setSelectedNFTs([]);
    } else {
      setSelectedNFTs(nfts.map(nft => nft.itemId));
    }
  };

  const handleEditNFT = (nft) => {
    setEditingNFT(nft);
    setShowEditModal(true);
  };

  const handleUpdateNFT = async (updates) => {
    try {
      await adminAPI.updateNFTStatus(editingNFT.network, editingNFT.itemId, updates);
      toast.success('NFT updated successfully');
      setShowEditModal(false);
      setEditingNFT(null);
      fetchNFTs(pagination.page, { status: filterStatus, network: filterNetwork });
    } catch (error) {
      toast.error('Failed to update NFT');
    }
  };

  const handleDeleteNFT = async (network, itemId) => {
    if (!window.confirm('Are you sure you want to delete this NFT?')) return;
    
    try {
      if (editingNFT?.collection) {
        await nftAPI.deleteNftInCollection(network, editingNFT.collection, itemId);
      } else {
        await nftAPI.deleteSingleNft(network, itemId);
      }
      toast.success('NFT deleted successfully');
      fetchNFTs(pagination.page, { status: filterStatus, network: filterNetwork });
    } catch (error) {
      toast.error('Failed to delete NFT');
    }
  };

  const handleToggleListing = async (nft) => {
    try {
      await adminAPI.updateNFTStatus(nft.network, nft.itemId, {
        currentlyListed: !nft.currentlyListed
      });
      toast.success(`NFT ${nft.currentlyListed ? 'unlisted' : 'listed'} successfully`);
      fetchNFTs(pagination.page, { status: filterStatus, network: filterNetwork });
    } catch (error) {
      toast.error('Failed to update listing status');
    }
  };

  const filteredNFTs = nfts;

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
  };

  if (isLoading && nfts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-display">Loading NFTs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">NFTs</h1>
          <p className="text-gray-600 font-display">Manage NFT listings and collections</p>
        </div>
        <button
          onClick={() => fetchNFTs(pagination.page, { status: filterStatus, network: filterNetwork })}
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
                placeholder="Search NFTs by name, collection, or owner..."
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
              <option value="listed">Listed</option>
              <option value="unlisted">Unlisted</option>
            </select>
            <select
              value={filterNetwork}
              onChange={(e) => setFilterNetwork(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
            >
              <option value="all">All Networks</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="bsc">BSC</option>
              <option value="arbitrum">Arbitrum</option>
            </select>
          </div>
        </div>
      </div>

      {/* NFTs Grid/Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedNFTs.length === filteredNFTs.length && filteredNFTs.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">NFT</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Network</th>
                <th className="px-6 py-3 text-right text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNFTs.length > 0 ? (
                filteredNFTs.map((nft) => (
                  <tr key={nft._id || nft.itemId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedNFTs.includes(nft.itemId)}
                        onChange={() => handleSelectNFT(nft.itemId)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <img
                          src={nft.image || '/placeholder-nft.png'}
                          alt={nft.name}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150';
                          }}
                        />
                        <div>
                          <div className="text-sm font-display font-medium text-gray-900">
                            {nft.name || 'Unnamed NFT'}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            #{nft.tokenId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-900">
                      {nft.collection || 'Single NFT'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500 font-mono">
                      {formatAddress(nft.owner)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-900">
                      {parseFloat(nft.price || 0).toFixed(4)} ETH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleListing(nft)}
                        className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${
                          nft.currentlyListed
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {nft.currentlyListed ? 'Listed' : 'Unlisted'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500 capitalize">
                      {nft.network || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-display font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/nft/${nft.itemId}`}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View NFT"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleEditNFT(nft)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Edit NFT"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNFT(nft.network, nft.itemId)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete NFT"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <p className="text-gray-500 font-display">No NFTs found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-display text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchNFTs(pagination.page - 1, { status: filterStatus, network: filterNetwork })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-display"
                >
                  Previous
                </button>
                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchNFTs(pageNum, { status: filterStatus, network: filterNetwork })}
                      className={`px-3 py-1 text-sm border rounded transition-colors font-display ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchNFTs(pagination.page + 1, { status: filterStatus, network: filterNetwork })}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-display"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit NFT Modal */}
      {showEditModal && editingNFT && (
        <EditNFTModal
          nft={editingNFT}
          onClose={() => {
            setShowEditModal(false);
            setEditingNFT(null);
          }}
          onSave={handleUpdateNFT}
        />
      )}
    </div>
  );
};

// Edit NFT Modal Component
const EditNFTModal = ({ nft, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: nft.name || '',
    description: nft.description || '',
    price: nft.price || '',
    currentlyListed: nft.currentlyListed || false,
    category: nft.category || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-display font-bold text-gray-900 mb-4">Edit NFT</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-display font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
            />
          </div>
          <div>
            <label className="block text-sm font-display font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-display font-medium text-gray-700 mb-1">Price (ETH)</label>
            <input
              type="number"
              step="0.0001"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
            />
          </div>
          <div>
            <label className="block text-sm font-display font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.currentlyListed}
              onChange={(e) => setFormData({ ...formData, currentlyListed: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-display text-gray-700">Currently Listed</label>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-display"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-display"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NFTs;
