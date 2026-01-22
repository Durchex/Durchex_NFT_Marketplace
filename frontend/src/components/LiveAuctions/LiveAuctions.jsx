import React, { useState, useEffect } from 'react';
import { Clock, User, Gavel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nftAPI, userAPI } from '../../services/api';
import toast from 'react-hot-toast';

/**
 * LiveAuctions - Grid of active auctions with countdown timers
 * Using mock auction data with real collection information
 */
const LiveAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({});
  const [creatorProfiles, setCreatorProfiles] = useState(new Map());
  const navigate = useNavigate();

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      console.log('[LiveAuctions] Fetching collections for auction data...');
      
      // ✅ Fetch real collections to display
      const collectionsData = await nftAPI.getCollections();
      console.log('[LiveAuctions] Collections:', collectionsData);
      
      if (Array.isArray(collectionsData) && collectionsData.length > 0) {
        // Create mock auctions using real collection data
        const mockAuctions = collectionsData.slice(0, 6).map((collection, idx) => ({
          _id: `auction-${idx}`,
          name: collection.name || `Collection Auction ${idx + 1}`,
          image: collection.image || `https://via.placeholder.com/300x350?text=Auction%20${idx + 1}`,
          currentBid: (Math.random() * 3 + 0.5).toFixed(2),
          bidCount: Math.floor(Math.random() * 50) + 5,
          creatorName: collection.creatorName || `Creator ${idx + 1}`,
          creatorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${collection.creatorWallet || `creator${idx}`}`,
          endTime: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          backgroundColor: ['bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-purple-400', 'bg-blue-400', 'bg-pink-400'][idx]
        }));
        
        setAuctions(mockAuctions);
        
        // Fetch creator profiles for all auctions
        const profilesMap = new Map();
        await Promise.all(
          mockAuctions.map(async (auction) => {
            const walletAddress = auction.creatorWallet || auction.owner || auction.walletAddress;
            if (walletAddress && !profilesMap.has(walletAddress)) {
              try {
                const profile = await userAPI.getUserProfile(walletAddress);
                if (profile) {
                  profilesMap.set(walletAddress, {
                    username: profile.username || auction.creatorName || `User ${walletAddress.substring(0, 6)}`,
                    avatar: profile.image || profile.avatar || auction.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`
                  });
                } else {
                  profilesMap.set(walletAddress, {
                    username: auction.creatorName || `User ${walletAddress.substring(0, 6)}`,
                    avatar: auction.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`
                  });
                }
              } catch (error) {
                console.warn(`[LiveAuctions] Error fetching profile for ${walletAddress}:`, error);
                profilesMap.set(walletAddress, {
                  username: auction.creatorName || `User ${walletAddress.substring(0, 6)}`,
                  avatar: auction.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`
                });
              }
            }
          })
        );
        setCreatorProfiles(profilesMap);
      } else {
        // Fallback to completely mock data if no collections
        setAuctions(generateMockAuctions());
      }
    } catch (error) {
      console.error('[LiveAuctions] Error fetching data:', error);
      // Fallback to mock data
      setAuctions(generateMockAuctions());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAuctions = () => {
    const colors = ['bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-purple-400', 'bg-blue-400', 'bg-pink-400'];
    return Array(6).fill(0).map((_, i) => ({
      _id: `auction-${i}`,
      name: 'Futuristic Artist Portrait',
      image: `https://via.placeholder.com/300x350?text=Auction%20${i + 1}`,
      currentBid: (Math.random() * 3 + 0.5).toFixed(2),
      bidCount: Math.floor(Math.random() * 50) + 5,
      creatorName: 'Alexander Bias',
      creatorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=auctioneer${i}`,
      endTime: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      backgroundColor: colors[i % colors.length]
    }));
  };

  // Countdown timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};
      auctions.forEach((auction) => {
        const endTime = new Date(auction.endTime).getTime();
        const now = Date.now();
        const diff = endTime - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          newTimers[auction._id] = `${hours}h ${minutes}m ${seconds}s`;
        } else {
          newTimers[auction._id] = 'Ended';
        }
      });
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [auctions]);

  if (loading) {
    return (
      <div className="mb-6 sm:mb-8 md:mb-12 lg:mb-16 animate-pulse">
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 xs:h-56 sm:h-64 md:h-72 lg:h-80 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-8 md:mb-12 lg:mb-16 w-full max-w-full">
      {/* Header */}
      <div className="mb-3 sm:mb-4 md:mb-6 w-full">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">Live Auction</h2>
        <p className="text-gray-400 text-xs md:text-sm">You are welcome to participate and bid for NFT from Durchex</p>
      </div>

      {/* Auctions Grid - Mobile: 2 cols, Tablet: 2 cols, Desktop: 3-4 cols */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full">
        {auctions.map((auction) => (
          <div 
            key={auction._id} 
            className="group cursor-pointer w-full min-w-0"
            onClick={() => {
              // Navigate to collection if it's a collection-based auction, otherwise to NFT
              if (auction.collectionId || auction.collection) {
                const network = auction.network || 'polygon';
                const collectionName = auction.collection || auction.name;
                navigate(`/collection/${network}/${encodeURIComponent(collectionName)}`);
              } else if (auction.nftId || auction._id) {
                navigate(`/nft/${auction.nftId || auction._id}`);
              }
            }}
          >
            <div className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-600/50 transition h-full flex flex-col w-full">
              {/* Image Container */}
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                {auction.image ? (
                  <img
                    src={auction.image}
                    alt={auction.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className={`w-full h-full ${auction.backgroundColor} opacity-50`}></div>
                )}

                {/* Timer Badge */}
                <div className="absolute top-1.5 md:top-2 lg:top-3 left-1.5 md:left-2 lg:left-3 bg-black/80 backdrop-blur px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 sm:gap-2">
                  <Clock size={12} className="text-red-500 flex-shrink-0" />
                  <p className="text-white font-mono text-xs">{timers[auction._id] || '...'}</p>
                </div>

                {/* Bid Count Badge */}
                <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-black/80 backdrop-blur px-2 md:px-3 py-1 rounded-lg">
                  <p className="text-white font-semibold text-xs md:text-sm">{auction.bidCount} Bids</p>
                </div>

                {/* Place Bid Overlay */}
                <div 
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-opacity duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (auction.collectionId || auction.collection) {
                        const network = auction.network || 'polygon';
                        const collectionName = auction.collection || auction.name;
                        navigate(`/collection/${network}/${encodeURIComponent(collectionName)}`);
                      } else if (auction.nftId || auction._id) {
                        navigate(`/nft/${auction.nftId || auction._id}`);
                      }
                    }}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-xs sm:text-sm"
                  >
                    <Gavel size={14} className="sm:w-[16px] sm:h-[16px]" />
                    <span className="hidden sm:inline">Place Bid</span>
                    <span className="sm:hidden">Bid</span>
                  </button>
                </div>
              </div>

              {/* Auction Info */}
              <div className="p-3 sm:p-4 flex-grow flex flex-col justify-between">
                <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-purple-400 transition line-clamp-2 mb-3">
                  {auction.name}
                </h3>

                {/* Current Bid */}
                <div className="mb-3 pb-3 border-b border-gray-700/50">
                  <p className="text-gray-400 text-xs sm:text-sm mb-1">Current Bid</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-400">{auction.currentBid} ETH</p>
                </div>

                {/* Creator */}
                {(() => {
                  const walletAddress = auction.creatorWallet || auction.owner || auction.walletAddress;
                  const profile = walletAddress ? creatorProfiles.get(walletAddress) : null;
                  const username = profile?.username || auction.creatorName || 'Creator';
                  const avatar = profile?.avatar || auction.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress || 'creator'}`;
                  return (
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={avatar}
                        alt={username}
                        className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-full flex-shrink-0 border border-gray-700"
                      />
                      <span className="text-gray-400 text-xs sm:text-sm line-clamp-1">{username}</span>
                    </div>
                  );
                })()}

                {/* Place Bid Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (auction.collectionId || auction.collection) {
                      const network = auction.network || 'polygon';
                      const collectionName = auction.collection || auction.name;
                      navigate(`/collection/${network}/${encodeURIComponent(collectionName)}`);
                    } else if (auction.nftId || auction._id) {
                      navigate(`/nft/${auction.nftId || auction._id}`);
                    }
                  }}
                  className="w-full py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <Gavel size={14} className="sm:w-4 sm:h-4" />
                  <span>Place Bid</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveAuctions;
