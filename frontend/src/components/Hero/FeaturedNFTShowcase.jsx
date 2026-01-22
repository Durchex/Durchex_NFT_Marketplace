import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ChevronRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { nftAPI } from '../../services/api';
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
      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        {/* Featured Collection Large Display with Slider Controls */}
        <div className="w-full min-w-0 md:col-span-1 lg:col-span-2 relative">
          <div className="relative rounded-lg overflow-hidden group w-full">
            <img
              src={currentCollection.image || 'https://via.placeholder.com/600x400'}
              alt={currentCollection.name}
              className="w-full h-auto min-h-[200px] sm:min-h-[250px] md:min-h-[320px] lg:min-h-[400px] object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

            {/* Slider Navigation Arrows */}
            {collections.length > 1 && (
              <>
                <button
                  onClick={prevCollection}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition opacity-0 group-hover:opacity-100"
                  aria-label="Previous collection"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextCollection}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition opacity-0 group-hover:opacity-100"
                  aria-label="Next collection"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Collection Info - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8 text-white">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">{currentCollection.name}</h2>
              <div className="flex items-center gap-2 mb-2 sm:mb-3 md:mb-4">
                {currentCollection.itemCount && (
                  <span className="text-gray-300 text-xs sm:text-sm">{currentCollection.itemCount} items</span>
                )}
                {collections.length > 1 && (
                  <span className="text-gray-400 text-xs sm:text-sm">
                    {currentIndex + 1} / {collections.length}
                  </span>
                )}
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 items-start sm:items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5 sm:mb-1">Floor Price</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    {currentCollection.floorPrice || '0.6'} ETH
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleLike(currentCollection._id)}
                    className={`p-2 rounded-lg border-2 transition flex-shrink-0 ${
                      liked.has(currentCollection._id)
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-gray-600 text-gray-300 hover:border-red-500'
                    }`}
                  >
                    <Heart size={18} />
                  </button>
                  <button
                    onClick={() => handleViewCollection(currentCollection)}
                    className="flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition text-xs sm:text-sm"
                  >
                    <ShoppingCart size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">View Collection</span>
                    <span className="sm:hidden">View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Slider Dots Indicator */}
            {collections.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
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

        {/* Featured NFTs from Current Collection - Mobile: Show below, Desktop: Show on side */}
        <div className="flex flex-col gap-3 sm:gap-4 w-full min-w-0">
          <h3 className="text-white font-semibold text-sm sm:text-base md:text-lg">Featured Items</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
            {displayNFTs.map((nft, idx) => (
              <div
                key={nft._id || idx}
                className="relative rounded-lg overflow-hidden cursor-pointer group w-full aspect-square min-w-0"
                onClick={() => navigate(`/nft/${nft._id}`)}
              >
                <img
                  src={nft.image || `https://via.placeholder.com/200x200?text=NFT%20${idx + 1}`}
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ChevronRight className="text-white" size={16} />
                </div>
                {/* NFT Price Tooltip */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 sm:px-2 py-1 sm:py-1.5">
                  <p className="text-white text-[10px] sm:text-xs font-semibold line-clamp-1">{nft.name || `Item ${idx + 1}`}</p>
                  <p className="text-purple-300 text-[10px] sm:text-xs font-medium">{nft.price || nft.floorPrice || '0.5'} ETH</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedNFTShowcase;
