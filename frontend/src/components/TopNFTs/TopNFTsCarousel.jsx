import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { nftAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * TopCollectionsCarousel - Horizontal scrollable carousel of top collections (newest to oldest)
 */
const TopNFTsCarousel = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = React.useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopCollections();
  }, []);

  const fetchTopCollections = async () => {
    try {
      setLoading(true);
      console.log('[TopCollections] Fetching collections...');
      
      // ✅ Fetch all collections from database
      const allCollectionsData = await nftAPI.getCollections();
      console.log('[TopCollections] Collections:', allCollectionsData);
      
      let collectionsList = [];
      if (Array.isArray(allCollectionsData) && allCollectionsData.length > 0) {
        // Sort by creation date (newest to oldest)
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
      console.log(`[TopCollections] Loaded ${collectionsList.length} collections`);
    } catch (error) {
      console.error('[TopCollections] Error fetching collections:', error);
      setCollections(generateMockCollections());
    } finally {
      setLoading(false);
    }
  };

  const generateMockCollections = () => {
    return Array(12).fill(0).map((_, i) => ({
      _id: `collection-${i}`,
      name: `Collection ${i + 1}`,
      floorPrice: (0.55 + Math.random() * 0.5).toFixed(2),
      image: `https://via.placeholder.com/280x320?text=Collection%20${i + 1}`,
      itemCount: Math.floor(Math.random() * 500) + 50,
      creatorName: `Creator ${i + 1}`,
      creatorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=creator${i}`,
      network: 'polygon'
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
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Top Collections</h2>
          <p className="text-gray-400 text-sm">Latest collections on Durchex</p>
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
        {collections.map((collection) => (
          <div
            key={collection._id}
            className="flex-shrink-0 w-[75%] sm:w-56 md:w-64 lg:w-72 snap-start group cursor-pointer"
            onClick={() => {
              // Use collectionId if available, otherwise use network/name format
              if (collection._id || collection.collectionId) {
                navigate(`/collection/${collection._id || collection.collectionId}`);
              } else {
                const network = collection.network || 'polygon';
                const collectionName = collection.name || collection.collectionName;
                navigate(`/collection/${network}/${encodeURIComponent(collectionName)}`);
              }
            }}
          >
            <div className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-600/50 transition h-full flex flex-col">
              {/* Image */}
              <div className="relative h-64 sm:h-72 md:h-80 lg:h-96 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                <img
                  src={collection.image || 'https://via.placeholder.com/280x320'}
                  alt={collection.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {/* Floor Price Badge */}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg">
                  <p className="text-white font-semibold text-sm">{collection.floorPrice || '0.5'} ETH</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-bold text-white text-sm sm:text-base mb-3 group-hover:text-purple-400 transition line-clamp-2">
                  {collection.name}
                </h3>

                {/* Creator */}
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src={collection.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${collection.creatorWallet || collection.name}`}
                    alt={collection.creatorName || 'Creator'}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                  />
                  <span className="text-gray-400 text-sm line-clamp-1">{collection.creatorName || 'Creator'}</span>
                </div>

                {/* Item Count */}
                {collection.itemCount && (
                  <p className="text-gray-500 text-xs mb-3">{collection.itemCount} items</p>
                )}

                {/* Action Button */}
                <button className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-sm mt-auto">
                  View Collection
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
