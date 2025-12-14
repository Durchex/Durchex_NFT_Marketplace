import React, { useState } from 'react';
import { FiEye, FiLock, FiImage, FiCheckCircle, FiXCircle, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const PartnerNFTs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const nfts = [
    { id: 1, name: 'CryptoPunk #7804', image: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=NFT1', collection: 'CryptoPunks', status: 'listed', price: '120 ETH', views: 1500, likes: 300 },
    { id: 2, name: 'Bored Ape #123', image: 'https://via.placeholder.com/150/00FF00/FFFFFF?text=NFT2', collection: 'Bored Ape Yacht Club', status: 'sold', price: '80 ETH', views: 2000, likes: 450 },
    { id: 3, name: 'Azuki #456', image: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=NFT3', collection: 'Azuki', status: 'pending', price: '30 ETH', views: 800, likes: 120 },
    { id: 4, name: 'Doodle #789', image: 'https://via.placeholder.com/150/FFFF00/000000?text=NFT4', collection: 'Doodles', status: 'listed', price: '25 ETH', views: 1000, likes: 250 },
  ];

  const filteredNfts = nfts.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          nft.collection.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || nft.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'listed': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900">NFT Management</h2>
        <div className="flex items-center space-x-2 text-yellow-600">
          <FiEye className="w-5 h-5" />
          <span className="font-display text-sm">Read-only access</span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 font-display">
          You can view NFT information but cannot modify NFT listings. Contact the main administrator for NFT management actions.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search NFTs..."
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
            <option value="listed">Listed</option>
            <option value="sold">Sold</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredNfts.map((nft) => (
          <div key={nft.id} className="bg-gray-50 rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="nft-image-container">
              <img src={nft.image} alt={nft.name} className="w-full h-48 object-cover" />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-display font-bold text-gray-900 truncate">{nft.name}</h3>
              <p className="text-sm text-gray-600 font-display mb-2">{nft.collection}</p>
              <div className="flex items-center justify-between text-sm mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(nft.status)} font-display`}>
                  {nft.status}
                </span>
                <span className="text-gray-700 font-display font-medium">{nft.price}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 font-display">
                <span>Views: {nft.views}</span>
                <span>Likes: {nft.likes}</span>
              </div>
              <div className="mt-4">
                <button className="w-full bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-display hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1">
                  <FiEye /> <span>View Details</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerNFTs;
