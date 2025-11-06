import React, { useState, useEffect } from 'react';
import { FiEye, FiSearch, FiFilter, FiClock } from 'react-icons/fi';
import { adminAPI } from '../../services/adminAPI';

const PartnerNFTs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterNetwork, setFilterNetwork] = useState('all');
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  const fetchNFTs = async (page = 1) => {
    setIsLoading(true);
    try {
      const filters = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterNetwork !== 'all') filters.network = filterNetwork;
      const data = await adminAPI.getAllNFTsAdmin(page, pagination.limit, { ...filters, search: searchTerm });
      setNfts(data.nfts || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch (e) {
      setNfts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs(pagination.page);
  }, [pagination.page, filterStatus, filterNetwork]);

  useEffect(() => {
    const t = setTimeout(() => fetchNFTs(1), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const formatAddress = (address) => (address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Unknown');
  const formatDate = (date) => (date ? new Date(date).toLocaleString() : '—');

  if (isLoading && nfts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900">NFTs (Read-only)</h2>
        <div className="flex items-center space-x-2 text-yellow-600">
          <FiClock className="w-5 h-5" />
          <span className="font-display text-sm">Data refreshes periodically</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search NFTs by name, collection, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="listed">Listed</option>
            <option value="unlisted">Unlisted</option>
          </select>
          <select
            value={filterNetwork}
            onChange={(e) => setFilterNetwork(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Networks</option>
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="bsc">BSC</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">NFT</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Collection</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-display font-medium text-gray-500 uppercase">Updated</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {nfts.map((nft) => (
              <tr key={nft._id || nft.itemId}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <img src={nft.image} alt={nft.name} className="w-10 h-10 rounded-lg object-cover" onError={(e)=>{e.target.src='https://via.placeholder.com/100'}} />
                    <div>
                      <div className="text-sm font-display font-medium text-gray-900">{nft.name}</div>
                      <div className="text-xs text-gray-500 font-display">#{nft.tokenId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-display text-gray-900">{nft.collection || 'Single NFT'}</td>
                <td className="px-6 py-4 text-sm font-display text-gray-500 font-mono">{formatAddress(nft.owner)}</td>
                <td className="px-6 py-4 text-sm font-display text-gray-900">{parseFloat(nft.price||0).toFixed(4)} ETH</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${nft.currentlyListed? 'bg-green-100 text-green-800':'bg-gray-100 text-gray-800'}`}>
                    {nft.currentlyListed? 'Listed':'Unlisted'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-display text-gray-500">{formatDate(nft.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartnerNFTs;
