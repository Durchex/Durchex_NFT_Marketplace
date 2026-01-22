import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ChevronRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { nftAPI, userAPI } from '../../services/api';
import { SuccessToast } from '../../app/Toast/Success.jsx';
import { ErrorToast } from '../../app/Toast/Error.jsx';
import { useNavigate } from 'react-router-dom';

/**
 * FeaturedNFTShowcase - Hero section with collection slider showing 3 NFTs from each collection
 */
const FeaturedNFTShowcase = () => {
  const [collections, setCollections] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [featuredNFTs, setFeaturedNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(new Set());
  const [creatorProfiles, setCreatorProfiles] = useState(new Map()); // Store creator profiles
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (collections.length > 0) {
      fetchNFTsForCollection(collections[currentIndex]);
    }
  }, [currentIndex, collections]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      console.log('[FeaturedNFTShowcase] Fetching collections...');
      
      // ✅ Fetch all collections (newest to oldest)
      const allCollectionsData = await nftAPI.getCollections();
      console.log('[FeaturedNFTShowcase] Collections:', allCollectionsData);
      
      let collectionsList = [];
      if (Array.isArray(allCollectionsData) && allCollectionsData.length > 0) {
        // Sort by creation date (newest first) - assuming _id or createdAt field
        collectionsList = allCollectionsData.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a._id ? a._id.toString().substring(0, 8) : 0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b._id ? b._id.toString().substring(0, 8) : 0);
          return dateB - dateA;
        });
      }
      
      if (collectionsList.length === 0) {
        throw new Error('No collections found');
      }
      
      setCollections(collectionsList);
      console.log(`[FeaturedNFTShowcase] Loaded ${collectionsList.length} collections`);
      
      // Fetch creator profiles for all collections
      const profilesMap = new Map();
      await Promise.all(
        collectionsList.map(async (collection) => {
          const walletAddress = collection.creatorWallet || collection.owner || collection.walletAddress;
          if (walletAddress && !profilesMap.has(walletAddress)) {
            try {
              const profile = await userAPI.getUserProfile(walletAddress);
              if (profile) {
                profilesMap.set(walletAddress, {
                  username: profile.username || collection.creatorName || `User ${walletAddress.substring(0, 6)}`,
                  avatar: profile.image || profile.avatar || collection.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`
                });
              } else {
                profilesMap.set(walletAddress, {
                  username: collection.creatorName || `User ${walletAddress.substring(0, 6)}`,
                  avatar: collection.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`
                });
              }
            } catch (error) {
              console.warn(`[FeaturedNFTShowcase] Error fetching profile for ${walletAddress}:`, error);
              profilesMap.set(walletAddress, {
                username: collection.creatorName || `User ${walletAddress.substring(0, 6)}`,
                avatar: collection.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`
              });
            }
          }
        })
      );
      setCreatorProfiles(profilesMap);
    } catch (error) {
      console.error('[FeaturedNFTShowcase] Error fetching collections:', error);
      // Generate mock data as fallback
      const mockCollections = generateMockCollections();
      setCollections(mockCollections);
    } finally {
      setLoading(false);
    }
  };

  const fetchNFTsForCollection = async (collection) => {
    if (!collection) return;
    
    try {
      console.log(`[FeaturedNFTShowcase] Fetching NFTs for collection: ${collection.name}`);
      
      // Get collection network and name
      const network = collection.network || 'polygon';
      const collectionName = collection.name || collection.collectionName;
      
      // Fetch NFTs from this collection
      let collectionNFTs = [];
      try {
        collectionNFTs = await nftAPI.getCollectionNfts(network, collectionName);
        if (!Array.isArray(collectionNFTs)) {
          collectionNFTs = [];
        }
      } catch (err) {
        console.warn(`[FeaturedNFTShowcase] Error fetching collection NFTs:`, err);
      }
      
      // If no NFTs found in collection, try fetching from all networks and filter
      if (collectionNFTs.length === 0) {
        const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
        for (const net of networks) {
          try {
            const allNfts = await nftAPI.getAllNftsByNetwork(net);
            if (Array.isArray(allNfts)) {
              const filtered = allNfts.filter(nft => 
                nft.collection === collectionName || 
                nft.collectionName === collectionName ||
                (collection._id && nft.collectionId === collection._id)
              );
              collectionNFTs = [...collectionNFTs, ...filtered];
            }
          } catch (err) {
            console.warn(`[FeaturedNFTShowcase] Error fetching from ${net}:`, err.message);
          }
        }
      }
      
      // Get first 3 NFTs from the collection
      const showcaseNFTs = collectionNFTs.slice(0, 3);
      
      // If still no NFTs, generate mock ones
      if (showcaseNFTs.length === 0) {
        showcaseNFTs.push(
          { _id: `${collection._id}-1`, name: `${collection.name} #1`, image: collection.image || 'https://via.placeholder.com/200x200', price: collection.floorPrice || '0.5' },
          { _id: `${collection._id}-2`, name: `${collection.name} #2`, image: collection.image || 'https://via.placeholder.com/200x200', price: collection.floorPrice || '0.5' },
          { _id: `${collection._id}-3`, name: `${collection.name} #3`, image: collection.image || 'https://via.placeholder.com/200x200', price: collection.floorPrice || '0.5' }
        );
      }
      
      setFeaturedNFTs(showcaseNFTs);
      console.log(`[FeaturedNFTShowcase] Loaded ${showcaseNFTs.length} NFTs for collection`);
      
      // Fetch creator profiles for featured NFTs
      const profilesMap = new Map(creatorProfiles);
      await Promise.all(
        showcaseNFTs.map(async (nft) => {
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
              console.warn(`[FeaturedNFTShowcase] Error fetching profile for ${walletAddress}:`, error);
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
      console.error('[FeaturedNFTShowcase] Error fetching NFTs:', error);
      // Generate mock NFTs as fallback
      setFeaturedNFTs(generateMockNFTs(collection));
    }
  };

  const generateMockCollections = () => {
    return [
      {
        _id: 'collection-1',
      name: 'Victory of Olympus',
      image: 'https://via.placeholder.com/600x400?text=Victory+of+Olympus',
      description: 'A collection inspired by ancient Greek mythology',
      itemCount: 250,
        floorPrice: '0.6',
        network: 'polygon'
      },
      {
        _id: 'collection-2',
        name: 'Digital Dreams',
        image: 'https://via.placeholder.com/600x400?text=Digital+Dreams',
        description: 'Futuristic digital art collection',
        itemCount: 180,
        floorPrice: '0.8',
        network: 'ethereum'
      },
      {
        _id: 'collection-3',
        name: 'Cosmic Warriors',
        image: 'https://via.placeholder.com/600x400?text=Cosmic+Warriors',
        description: 'Space-themed warrior collection',
        itemCount: 320,
        floorPrice: '0.5',
        network: 'polygon'
      }
    ];
  };

  const generateMockNFTs = (collection) => {
    return [
      { _id: `${collection._id}-1`, name: `${collection.name} #1`, image: collection.image || 'https://via.placeholder.com/200x200', price: collection.floorPrice || '0.5' },
      { _id: `${collection._id}-2`, name: `${collection.name} #2`, image: collection.image || 'https://via.placeholder.com/200x200', price: collection.floorPrice || '0.5' },
      { _id: `${collection._id}-3`, name: `${collection.name} #3`, image: collection.image || 'https://via.placeholder.com/200x200', price: collection.floorPrice || '0.5' }
    ];
  };

  const handleLike = (collectionId) => {
    setLiked(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
        SuccessToast('Removed from favorites');
      } else {
        newSet.add(collectionId);
        SuccessToast('Added to favorites');
      }
      return newSet;
    });
  };

  const handleViewCollection = (collection) => {
    // Use collectionId if available, otherwise use network/name format
    if (collection._id || collection.collectionId) {
      navigate(`/collection/${collection._id || collection.collectionId}`);
    } else {
      const network = collection.network || 'polygon';
      const collectionName = collection.name || collection.collectionName;
      navigate(`/collection/${network}/${encodeURIComponent(collectionName)}`);
    }
  };

  const nextCollection = () => {
    setCurrentIndex((prev) => (prev + 1) % collections.length);
  };

  const prevCollection = () => {
    setCurrentIndex((prev) => (prev - 1 + collections.length) % collections.length);
  };

  // Auto-advance slider every 5 seconds
  useEffect(() => {
    if (collections.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % collections.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [collections.length]);

  if (loading || collections.length === 0) {
    return (
      <div className="w-full h-96 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl animate-pulse"></div>
    );
  }

  const currentCollection = collections[currentIndex];
  const displayNFTs = featuredNFTs.length > 0 ? featuredNFTs : generateMockNFTs(currentCollection);

  return (
    <div className="mb-6 sm:mb-8 md:mb-12 lg:mb-16 w-full">
      {/* Slider Container - Desktop: Entire hero is one slider with featured items inside on right */}
      <div className="relative w-full rounded-lg overflow-hidden group">
        {/* Desktop: Single container with banner and featured items side by side */}
        <div className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] flex flex-col lg:flex-row">
          {/* Main Collection Banner - Left Side (Desktop) / Full Width (Mobile) */}
          <div className="relative w-full lg:flex-1 h-full">
            <img
              src={currentCollection.image || 'https://via.placeholder.com/600x400'}
              alt={currentCollection.name}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent"></div>

            {/* Collection Info - Bottom Left */}
            <div className="absolute bottom-0 left-0 right-0 lg:right-auto lg:w-auto p-4 sm:p-5 md:p-6 lg:p-8 text-white z-10">
              <div className="mb-2 sm:mb-3">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{currentCollection.name}</h2>
                <div className="flex items-center gap-2 mb-1">
                  {(() => {
                    const walletAddress = currentCollection.creatorWallet || currentCollection.owner || currentCollection.walletAddress;
                    const profile = walletAddress ? creatorProfiles.get(walletAddress) : null;
                    const username = profile?.username || currentCollection.creatorName || 'Creator';
                    const avatar = profile?.avatar || currentCollection.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress || 'creator'}`;
                    return (
                      <>
                        <img
                          src={avatar}
                          alt={username}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-gray-600"
                        />
                        <p className="text-gray-300 text-sm sm:text-base">By {username}</p>
                      </>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-0.5">Floor Price</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                      {currentCollection.floorPrice || '0.5'} ETH
                    </p>
                  </div>
                  {currentCollection.itemCount && (
                    <div className="hidden sm:block">
                      <p className="text-gray-400 text-xs sm:text-sm mb-0.5">Items</p>
                      <p className="text-lg sm:text-xl font-bold text-white">{currentCollection.itemCount}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => handleLike(currentCollection._id)}
                  className={`p-2 sm:p-2.5 rounded-lg border-2 transition flex-shrink-0 ${
                    liked.has(currentCollection._id)
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:border-red-500 hover:bg-red-600/20'
                  }`}
                >
                  <Heart size={18} className="sm:w-5 sm:h-5" fill={liked.has(currentCollection._id) ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleViewCollection(currentCollection)}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition text-sm sm:text-base"
                >
                  <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
                  <span>View Collection</span>
                </button>
              </div>
            </div>
          </div>

          {/* Featured NFTs - Inside slider on right (Desktop) / Below banner (Mobile) */}
          {/* Mobile: 3 column grid below, Desktop: Horizontal row on right inside slider */}
          <div className="lg:absolute lg:right-0 lg:top-0 lg:h-full lg:flex lg:items-center lg:pr-4 xl:pr-6 lg:py-4 xl:py-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:flex lg:flex-row lg:gap-3 lg:h-auto">
              {displayNFTs.map((nft, idx) => (
                <div
                  key={nft._id || idx}
                  className="relative rounded-lg overflow-hidden cursor-pointer group aspect-square w-full lg:w-[140px] xl:w-[160px] lg:h-[140px] xl:h-[160px]"
                  onClick={() => navigate(`/nft/${nft._id}`)}
                >
                  <img
                    src={nft.image || `https://via.placeholder.com/200x200?text=NFT%20${idx + 1}`}
                    alt={nft.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ChevronRight className="text-white" size={18} />
                  </div>
                  {/* NFT Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-2 sm:p-3">
                    <p className="text-white text-xs sm:text-sm font-semibold line-clamp-1 mb-0.5">{nft.name || `Item ${idx + 1}`}</p>
                    <p className="text-purple-300 text-xs sm:text-sm font-medium">{nft.price || nft.floorPrice || '0.55'} ETH</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slider Navigation Arrows - Positioned on main banner */}
          {collections.length > 1 && (
            <>
              <button
                onClick={prevCollection}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white transition shadow-lg"
                aria-label="Previous collection"
              >
                <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={nextCollection}
                className="absolute right-3 sm:right-4 lg:right-[460px] xl:right-[520px] top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white transition shadow-lg"
                aria-label="Next collection"
              >
                <ChevronRight size={20} className="sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Slider Dots Indicator */}
          {collections.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-[460px] xl:right-[520px] lg:bottom-4 flex gap-2 z-20">
              {collections.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition ${
                    idx === currentIndex ? 'w-8 bg-purple-600' : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to collection ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturedNFTShowcase;
