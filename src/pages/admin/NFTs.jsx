import React, { useState } from 'react';
import { FiSearch, FiFilter, FiImage, FiEye, FiEdit, FiTrash2, FiCheck, FiX, FiClock } from 'react-icons/fi';

const NFTs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedNFTs, setSelectedNFTs] = useState([]);

  // Mock data - in real app, this would come from API
  const nfts = [
    {
      id: 1,
      name: 'Cool Cat #123',
      collection: 'Cool Cats',
      image: '/api/placeholder/150/150',
      owner: '0x1234...5678',
      creator: '0x9876...5432',
      price: '2.5 ETH',
      status: 'listed',
      category: 'Art',
      createdAt: '2024-01-15',
      lastSale: '2.5 ETH',
      views: 1234,
      likes: 89
    },
    {
      id: 2,
      name: 'Space Ape #456',
      collection: 'Space Apes',
      image: '/api/placeholder/150/150',
      owner: '0xabcd...efgh',
      creator: '0x5678...1234',
      price: '1.8 ETH',
      status: 'sold',
      category: 'Collectibles',
      createdAt: '2024-02-20',
      lastSale: '1.8 ETH',
      views: 856,
      likes: 67
    },
    {
      id: 3,
      name: 'Digital Art #789',
      collection: 'Digital Art',
      image: '/api/placeholder/150/150',
      owner: '0xefgh...ijkl',
      creator: '0x1234...5678',
      price: '3.2 ETH',
      status: 'pending',
      category: 'Art',
      createdAt: '2024-03-10',
      lastSale: null,
      views: 234,
      likes: 12
    }
  ];

  const filteredNFTs = nfts.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        nft.collection.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        nft.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || nft.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSelectNFT = (nftId) => {
    setSelectedNFTs(prev => 
      prev.includes(nftId) 
        ? prev.filter(id => id !== nftId)
        : [...prev, nftId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNFTs.length === filteredNFTs.length) {
      setSelectedNFTs([]);
    } else {
      setSelectedNFTs(filteredNFTs.map(nft => nft.id));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      listed: 'bg-green-100 text-green-800',
      sold: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status] || styles.pending;
  };

  const getCategoryBadge = (category) => {
    const styles = {
      Art: 'bg-purple-100 text-purple-800',
      Collectibles: 'bg-pink-100 text-pink-800',
      Gaming: 'bg-green-100 text-green-800',
      Music: 'bg-orange-100 text-orange-800'
    };
    return styles[category] || styles.Art;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">NFTs</h1>
          <p className="text-gray-600 font-display">Manage NFT collections and listings</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-display">
            Export NFTs
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-display">
            Review Pending
          </button>
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
              <option value="sold">Sold</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-display">
              <FiFilter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* NFTs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNFTs.map((nft) => (
          <div key={nft.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* NFT Image */}
            <div className="relative">
              <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FiImage className="w-12 h-12 text-white opacity-50" />
              </div>
              <div className="absolute top-3 left-3">
                <input
                  type="checkbox"
                  checked={selectedNFTs.includes(nft.id)}
                  onChange={() => handleSelectNFT(nft.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="absolute top-3 right-3">
                <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getStatusBadge(nft.status)}`}>
                  {nft.status}
                </span>
              </div>
            </div>

            {/* NFT Details */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-gray-900 truncate">
                    {nft.name}
                  </h3>
                  <p className="text-sm text-gray-600 font-display">
                    {nft.collection}
                  </p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getCategoryBadge(nft.category)}`}>
                  {nft.category}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-display">Price:</span>
                  <span className="font-display font-semibold text-gray-900">{nft.price}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-display">Views:</span>
                  <span className="font-display text-gray-900">{nft.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-display">Likes:</span>
                  <span className="font-display text-gray-900">{nft.likes}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-display">Owner:</span>
                  <span className="font-mono text-xs text-gray-900">{nft.owner}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors">
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors">
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {nft.status === 'pending' && (
                  <div className="flex items-center space-x-1">
                    <button className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors">
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedNFTs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="font-display text-blue-900">
                {selectedNFTs.length} NFTs selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-display">
                Approve Selected
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-display">
                Reject Selected
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-display">
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm font-display text-gray-700">
            Showing 1 to {filteredNFTs.length} of {nfts.length} results
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
  );
};

export default NFTs;
