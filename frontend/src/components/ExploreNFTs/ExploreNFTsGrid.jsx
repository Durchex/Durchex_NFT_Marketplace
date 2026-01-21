import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { nftAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { SuccessToast } from '../../app/Toast/Success.jsx';

/**
 * ExploreNFTsGrid - Grid view of all NFTs from database
 */
const ExploreNFTsGrid = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [liked, setLiked] = useState(new Set());
  const [allNfts, setAllNfts] = useState([]); // Store all NFTs for pagination

  useEffect(() => {
    fetchNFTs();
  }, []);

  useEffect(() => {
    if (allNfts.length > 0) {
      paginateNFTs();
    }
  }, [page, allNfts]);

  const paginateNFTs = () => {
    const itemsPerPage = 6;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const paginatedNFTs = allNfts.slice(startIndex, endIndex);
    setNfts(paginatedNFTs);
    setTotalPages(Math.ceil(allNfts.length / itemsPerPage));
  };

  const fetchNFTs = async () => {
    try {
      setLoading(true);
      console.log('[ExploreNFTsGrid] Fetching NFTs from all networks...');
      
      // ✅ Fetch real NFTs from all networks
      let nftsData = [];
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
      
      for (const network of networks) {
        try {
          console.log(`[ExploreNFTsGrid] Fetching NFTs from ${network}...`);
          const networkNfts = await nftAPI.getAllNftsByNetwork(network);
          if (Array.isArray(networkNfts)) {
            console.log(`[ExploreNFTsGrid] Found ${networkNfts.length} NFTs on ${network}`);
            nftsData = [...nftsData, ...networkNfts];
          }
        } catch (err) {
          console.warn(`[ExploreNFTsGrid] Error fetching from ${network}:`, err.message);
        }
      }

      if (nftsData && nftsData.length > 0) {
        console.log(`[ExploreNFTsGrid] Total NFTs fetched: ${nftsData.length}`);
        setAllNfts(nftsData);
        paginateNFTs();
      } else {
        throw new Error('No NFTs fetched from any network');
      }
    } catch (error) {
      console.error('[ExploreNFTsGrid] Error fetching NFTs:', error);
      setNfts(generateMockNFTs());
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const generateMockNFTs = () => {
    const colors = ['bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-purple-400', 'bg-blue-400', 'bg-pink-400'];
    return Array(6).fill(0).map((_, i) => ({
      _id: `nft-${i}`,
      name: 'Futuristic Artist Portrait',
      price: (Math.random() * 2 + 0.5).toFixed(2),
      image: `https://via.placeholder.com/300x350?text=NFT%20${i + 1}`,
      creatorName: 'Alexander Bias',
      creatorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=artist${i}`,
      backgroundColor: colors[i % colors.length]
    }));
  };

  const toggleLike = (nftId) => {
    const newLiked = new Set(liked);
    if (newLiked.has(nftId)) {
      newLiked.delete(nftId);
    } else {
      newLiked.add(nftId);
    }
    setLiked(newLiked);
    SuccessToast(newLiked.has(nftId) ? 'Added to favorites' : 'Removed from favorites');
  };

  const handleAddToCart = (nftName) => {
    SuccessToast(`${nftName} added to cart`);
  };

  return (
    <div className="mb-6 sm:mb-8 md:mb-12 lg:mb-16">
      {/* Header */}
      <div className="mb-3 xs:mb-4 sm:mb-6">
        <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">Explore NFTs</h2>
        <p className="text-gray-400 text-xs sm:text-sm">All NFTs available on Durchex</p>
      </div>

      {/* NFTs Grid - Responsive Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-40 xs:h-48 sm:h-56 md:h-64 lg:h-80 bg-gray-800 rounded-lg animate-pulse"></div>
          ))
        ) : nfts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400">No NFTs found</p>
          </div>
        ) : (
          nfts.map((nft) => (
            <div key={nft._id} className="group cursor-pointer">
              <div className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-600/50 transition h-full flex flex-col">
                {/* Image Container */}
                <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                  {nft.image ? (
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className={`w-full h-full ${nft.backgroundColor} opacity-50`}></div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-opacity duration-300 flex items-center justify-center gap-2 md:gap-3 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => toggleLike(nft._id)}
                      className={`p-2 md:p-3 rounded-full transition ${
                        liked.has(nft._id)
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700/80 hover:bg-red-600 text-gray-300'
                      }`}
                    >
                      <Heart
                        size={20}
                        fill={liked.has(nft._id) ? 'currentColor' : 'none'}
                      />
                    </button>
                    <button
                      onClick={() => handleAddToCart(nft.name)}
                      className="p-2 md:p-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-black/80 backdrop-blur px-2 md:px-3 py-1 rounded-lg">
                    <p className="text-white font-semibold text-xs md:text-sm">{nft.price} ETH</p>
                  </div>
                </div>

                {/* NFT Info */}
                <div className="p-3 md:p-4 flex-grow flex flex-col justify-between">
                  <h3 className="font-bold text-white text-xs md:text-sm group-hover:text-purple-400 transition line-clamp-2 mb-2">
                    {nft.name}
                  </h3>

                  {/* Creator */}
                  <div className="flex items-center gap-2 mt-auto pt-2 md:pt-3 border-t border-gray-700/50">
                    <img
                      src={nft.creatorAvatar}
                      alt={nft.creatorName}
                      className="w-6 md:w-8 h-6 md:h-8 rounded-full"
                    />
                    <span className="text-gray-400 text-xs line-clamp-1">{nft.creatorName}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1 md:gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = page > 3 ? page - 2 + i : i + 1;
              return pageNum <= totalPages ? (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 md:w-10 h-8 md:h-10 rounded-lg font-semibold transition text-xs md:text-sm ${
                    pageNum === page
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              ) : null;
            })}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ExploreNFTsGrid;
