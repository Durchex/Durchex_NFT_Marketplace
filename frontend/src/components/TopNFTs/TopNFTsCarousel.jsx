import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { nftAPI, userAPI } from '../../services/api';
import { getCurrencySymbol } from '../../Context/constants';
import { useNavigate } from 'react-router-dom';

/**
 * TopNFTsCarousel - Horizontal scrollable carousel of top NFTs (newest to oldest)
 */
const TopNFTsCarousel = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [creatorProfiles, setCreatorProfiles] = useState(new Map());
  const containerRef = React.useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopNFTs();
  }, []);

  const fetchTopNFTs = async () => {
    try {
      setLoading(true);
      console.log('[TopNFTs] Fetching NFTs...');
      
      // ✅ Fetch all NFTs from all networks
      let allNFTs = [];
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
      
      for (const network of networks) {
        try {
          console.log(`[TopNFTs] Fetching NFTs from ${network}...`);
          const networkNfts = await nftAPI.getAllNftsByNetwork(network);
          if (Array.isArray(networkNfts)) {
            allNFTs = [...allNFTs, ...networkNfts];
          }
        } catch (err) {
          console.warn(`[TopNFTs] Error fetching from ${network}:`, err.message);
        }
      }
      
      // ✅ De-duplicate NFTs so we don't show the same one per-network
      const uniqueMap = new Map();
      allNFTs.forEach((nft) => {
        const key =
          nft._id ||
          `${nft.network || nft.chain || 'unknown'}-${nft.itemId || nft.tokenId || nft.name || Math.random()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, nft);
        }
      });
      const uniqueNFTs = Array.from(uniqueMap.values());

      // Sort by creation date (newest to oldest)
      uniqueNFTs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : (a._id ? new Date(a._id.toString().substring(0, 8)) : new Date(0));
        const dateB = b.createdAt ? new Date(b.createdAt) : (b._id ? new Date(b._id.toString().substring(0, 8)) : new Date(0));
        return dateB - dateA;
      });
      
      // Take first 12 NFTs
      const nftsList = uniqueNFTs.slice(0, 12);
      
      if (nftsList.length === 0) {
        throw new Error('No NFTs found');
      }
      
      setNfts(nftsList);
      console.log(`[TopNFTs] Loaded ${nftsList.length} NFTs`);
      
      // Fetch creator profiles for all NFTs
      const profilesMap = new Map();
      await Promise.all(
        nftsList.map(async (nft) => {
          const walletAddress = nft.creatorWallet || nft.owner || nft.walletAddress;
          if (walletAddress && !profilesMap.has(walletAddress)) {
            try {
              const profile = await userAPI.getUserProfile(walletAddress);
              if (profile) {
                profilesMap.set(walletAddress, {
                  username: profile.username || nft.creatorName || `User ${walletAddress.substring(0, 6)}`,
                  avatar: profile.image || profile.avatar || nft.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`
                });
              } else {
                profilesMap.set(walletAddress, {
                  username: nft.creatorName || `User ${walletAddress.substring(0, 6)}`,
                  avatar: nft.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`
                });
              }
            } catch (error) {
              console.warn(`[TopNFTs] Error fetching profile for ${walletAddress}:`, error);
              profilesMap.set(walletAddress, {
                username: nft.creatorName || `User ${walletAddress.substring(0, 6)}`,
                avatar: nft.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`
              });
            }
          }
        })
      );
      setCreatorProfiles(profilesMap);
    } catch (error) {
      console.error('[TopNFTs] Error fetching NFTs:', error);
      setNfts(generateMockNFTs());
    } finally {
      setLoading(false);
    }
  };

  const generateMockNFTs = () => {
    return Array(12).fill(0).map((_, i) => ({
      _id: `nft-${i}`,
      name: "Alexander's Collectibles",
      price: '0.55',
      image: `https://via.placeholder.com/280x320?text=NFT%20${i + 1}`,
      creatorName: 'Alexander Bias',
      creatorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=creator${i}`
    }));
  };

  const scroll = (direction) => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;

    container.scrollLeft = newPosition;
    setScrollPosition(newPosition);
  };

  if (loading) {
    return (
      <div className="mb-6 sm:mb-8 md:mb-12 lg:mb-16 animate-pulse">
        <div className="h-48 xs:h-56 sm:h-64 md:h-80 bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-8 md:mb-12 lg:mb-16 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Top NFTs</h2>
          <p className="text-gray-400 text-sm">Trending NFTs on Durchex</p>
        </div>

        {/* Navigation Arrows - Hidden on mobile, show on tablet+ */}
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-purple-600 transition"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-purple-600 transition"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Carousel - Mobile: Larger cards, Desktop: Standard size */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 w-full max-w-full snap-x snap-mandatory"
        style={{ scrollBehavior: 'smooth', scrollbarWidth: 'thin' }}
      >
        {nfts.map((nft) => (
          <div
            key={nft._id}
            className="flex-shrink-0 w-[75%] sm:w-56 md:w-64 lg:w-72 snap-start group cursor-pointer"
            onClick={() => navigate(`/nft/${nft._id}`)}
          >
            <div className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-600/50 transition h-full flex flex-col">
              {/* Image */}
              <div className="relative h-64 sm:h-72 md:h-80 lg:h-96 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                <img
                  src={nft.image || 'https://via.placeholder.com/280x320'}
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              {/* Info */}
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-bold text-white text-sm sm:text-base mb-2 group-hover:text-purple-400 transition line-clamp-2">
                  {nft.name || "Alexander's Collectibles"}
                </h3>
                {/* Price - positioned below title */}
                <p className="text-purple-400 font-semibold text-sm sm:text-base mb-3">
                  {nft.price || nft.floorPrice || '0.55'}{' '}
                  {getCurrencySymbol(nft.network || nft.chain || 'ethereum')}
                </p>

                {/* Creator */}
                {(() => {
                  const walletAddress = nft.creatorWallet || nft.owner || nft.walletAddress;
                  const profile = walletAddress ? creatorProfiles.get(walletAddress) : null;
                  const username = profile?.username || nft.creatorName || 'Creator';
                  const avatar = profile?.avatar || nft.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress || 'creator'}`;
                  return (
                    <div className="flex items-center gap-2 mb-4">
                      <img
                        src={avatar}
                        alt={username}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 border border-gray-700"
                      />
                      <span className="text-gray-400 text-sm line-clamp-1">{username}</span>
                    </div>
                  );
                })()}

                {/* Action Button */}
                <button 
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-sm mt-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/nft/${nft._id}`);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopNFTsCarousel;
