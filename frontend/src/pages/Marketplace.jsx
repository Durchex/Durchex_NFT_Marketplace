import React, { useState, useEffect, useContext } from 'react';
import { FiFilter, FiSearch, FiGrid, FiList, FiClock, FiTag } from 'react-icons/fi';
import { ICOContent } from '../Context';
import { marketplaceAPI, auctionAPI } from '../services/api';
import { getCurrencySymbol } from '../Context/constants';
import BuyModal from '../components/BuyModal';
import Loader from '../components/Loader';

const Marketplace = () => {
  const { address } = useContext(ICOContent);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [filters, setFilters] = useState({
    network: '',
    collection: '',
    minPrice: '',
    maxPrice: '',
    listingType: '',
    sortBy: 'recent',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');

  const normalizeAuctionListing = (auction) => {
    const priceValue = auction.currentBid || auction.reservePrice || 0;
    return {
      _id: `auction-${auction.id}`,
      nftName: auction.nftName || auction.name || `NFT #${auction.tokenId}`,
      nftImage: auction.nftImage || auction.image || auction.thumbnail || auction.mediaUrl || '',
      tokenId: auction.tokenId,
      network: auction.network || 'ethereum',
      listingType: 'auction',
      price: priceValue,
      currentBid: auction.currentBid,
      reservePrice: auction.reservePrice,
      endTime: auction.endTime,
      auctionId: auction.id,
      seller: auction.seller,
      nftContract: auction.nftContract,
    };
  };

  const isAuctionFilterActive = filters.listingType === 'auction';
  const isFixedFilterActive = filters.listingType === 'fixed';

  const matchesAuctionFilter = (auction) => {
    if (isFixedFilterActive) return false;
    if (filters.network && auction.network !== filters.network) return false;
    if (!searchQuery) return true;

    const search = searchQuery.toLowerCase();
    return [
      auction.nftName,
      auction.tokenId?.toString(),
      auction.seller,
      auction.nftContract,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  };

  const fetchListings = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page,
        limit: pagination.limit,
        search: searchQuery,
      };

      const [response, auctionData] = await Promise.all([
        marketplaceAPI.getListings(params),
        auctionAPI.list(),
      ]);

      const marketplaceListings = response.listings || [];
      const auctions = Array.isArray(auctionData) ? auctionData : [];
      const normalizedAuctions = auctions
        .map(normalizeAuctionListing)
        .filter(matchesAuctionFilter);

      const existingAuctionKeys = new Set(
        marketplaceListings
          .filter((item) => item.listingType === 'auction')
          .map((item) => `${item.nftContract || ''}_${item.tokenId}`)
      );

      const uniqueAuctionListings = normalizedAuctions.filter(
        (auction) => !existingAuctionKeys.has(`${auction.nftContract || ''}_${auction.tokenId}`)
      );

      const allListings = isFixedFilterActive
        ? marketplaceListings.filter((item) => item.listingType !== 'auction')
        : [...marketplaceListings, ...uniqueAuctionListings];

      setListings(allListings);
      setPagination({
        ...pagination,
        page: response.pagination?.page || 1,
        total: (response.pagination?.total || marketplaceListings.length) + uniqueAuctionListings.length,
        totalPages: response.pagination?.totalPages || Math.ceil(allListings.length / pagination.limit),
      });
      setError('');
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setError(error?.message || 'Unable to load marketplace listings. Please try again.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [filters, searchQuery]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchListings(1);
  };

  const handleBuyClick = (listing) => {
    setSelectedListing(listing);
    setShowBuyModal(true);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchListings(newPage);
  };

  const clearFilters = () => {
    setFilters({
      network: '',
      collection: '',
      minPrice: '',
      maxPrice: '',
      listingType: '',
      sortBy: 'recent',
      sortOrder: 'desc',
    });
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">NFT Marketplace</h1>
              <p className="text-gray-400 mt-1">Discover and collect unique digital assets</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {viewMode === 'grid' ? <FiList className="text-xl" /> : <FiGrid className="text-xl" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search NFTs, collections, or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Filters:</span>
            </div>

            <select
              value={filters.network}
              onChange={(e) => handleFilterChange('network', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Networks</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="bsc">BSC</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="base">Base</option>
            </select>

            <select
              value={filters.listingType}
              onChange={(e) => handleFilterChange('listingType', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Types</option>
              <option value="fixed">Fixed Price</option>
              <option value="auction">Auction</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="recent">Recently Listed</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="ending_soon">Ending Soon</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-white mb-2">Unable to load listings</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => fetchListings(pagination.page)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-semibold"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
            <p className="text-gray-400">Try adjusting your filters or check back later for new listings.</p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-400">
                {pagination.total} listing{pagination.total !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Listings Grid/List */}
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {listings.map((listing) => (
                <MarketplaceListingCard
                  key={listing._id}
                  listing={listing}
                  viewMode={viewMode}
                  onBuyClick={handleBuyClick}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        pageNum === pagination.page
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Buy Modal */}
      <BuyModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        listing={selectedListing}
      />
    </div>
  );
};

// Individual listing card component
const MarketplaceListingCard = ({ listing, viewMode, onBuyClick }) => {
  const symbol = getCurrencySymbol(listing.network || 'ethereum');
  const isAuction = listing.listingType === 'auction';
  const isEnded = isAuction && listing.endTime && Date.now() / 1000 > listing.endTime;
  const endsLabel = listing.endTime ? formatEnds(listing.endTime) : 'No end date';
  const displayPrice = isAuction
    ? listing.currentBid || listing.reservePrice || listing.price || 0
    : listing.price || 0;

  const priceLabel = isAuction ? 'Current Bid' : 'Price';

  if (viewMode === 'list') {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
        <div className="flex items-center gap-4">
          {listing.nftImage && (
            <img
              src={listing.nftImage}
              alt={listing.nftName}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-white">{listing.nftName || 'Unnamed NFT'}</h3>
            <p className="text-sm text-gray-400">Token ID: {listing.tokenId}</p>
            <p className="text-xs text-gray-500 capitalize">{listing.network}</p>
            {isAuction && (
              <p className="text-xs text-blue-300 mt-1">Ends in {endsLabel}</p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              {isAuction ? (
                <FiClock className="text-blue-400" />
              ) : (
                <FiTag className="text-emerald-400" />
              )}
              <span className="text-lg font-bold text-white">
                {displayPrice} {symbol}
              </span>
            </div>
            <button
              onClick={() => onBuyClick(listing)}
              disabled={isAuction && isEnded}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
            >
              {isAuction ? (isEnded ? 'Ended' : 'Bid') : 'Buy'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors">
      {listing.nftImage && (
        <div className="aspect-square overflow-hidden">
          <img
            src={listing.nftImage}
            alt={listing.nftName}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate">
          {listing.nftName || 'Unnamed NFT'}
        </h3>
        <p className="text-sm text-gray-400 mb-2">Token ID: {listing.tokenId}</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1 mb-1">
              {isAuction ? (
                <FiClock className="text-blue-400 text-sm" />
              ) : (
                <FiTag className="text-emerald-400 text-sm" />
              )}
              <span className="text-sm text-gray-400 capitalize">
                {isAuction ? 'Auction' : 'Fixed Price'}
              </span>
            </div>
            {isAuction && (
              <p className="text-xs text-blue-300">Ends in {endsLabel}</p>
            )}
          </div>
          <span className="text-xs text-gray-500 capitalize">{listing.network}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">{priceLabel}</p>
            <span className="text-lg font-bold text-emerald-400">
              {displayPrice} {symbol}
            </span>
          </div>
          <button
            onClick={() => onBuyClick(listing)}
            disabled={isAuction && isEnded}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-semibold transition-colors"
          >
            {isAuction ? (isEnded ? 'Ended' : 'Bid') : 'Buy'}
          </button>
        </div>
      </div>
    </div>
  );
};

const formatEnds = (endTime) => {
  if (!endTime) return 'TBD';
  const timestamp = Number(endTime);
  const seconds = timestamp > 1e12 ? Math.floor(timestamp / 1000) : timestamp;
  const diff = seconds - Math.floor(Date.now() / 1000);
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export default Marketplace;