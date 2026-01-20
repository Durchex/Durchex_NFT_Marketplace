import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { nftAPI } from '../../services/api';

/**
 * TopNFTsCarousel - Horizontal scrollable carousel of top NFTs
 */
const TopNFTsCarousel = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const containerRef = React.useRef(null);

  useEffect(() => {
    fetchTopNFTs();
  }, []);

  const fetchTopNFTs = async () => {
    try {
      setLoading(true);
      const response = await nftAPI.get('/trending?limit=12');
      setNfts(response.data || generateMockNFTs());
    } catch (error) {
      console.error('Error fetching top NFTs:', error);
      setNfts(generateMockNFTs());
    } finally {
      setLoading(false);
    }
  };

  const generateMockNFTs = () => {
    return Array(12).fill(0).map((_, i) => ({
      _id: `nft-${i}`,
      name: "Alexander's Collections",
      price: (0.55 + Math.random() * 0.5).toFixed(2),
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
      <div className="mb-16 animate-pulse">
        <div className="h-80 bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Top NFTs</h2>
          <p className="text-gray-400 text-xs">Trending NFTs on Durchex</p>
        </div>

        {/* Navigation Arrows */}
        <div className="flex gap-2">
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

      {/* Carousel */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 -mr-4 pr-4"
        style={{ scrollBehavior: 'smooth', scrollbarWidth: 'thin' }}
      >
        {nfts.map((nft) => (
          <div
            key={nft._id}
            className="flex-shrink-0 w-72 group cursor-pointer"
          >
            <div className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-600/50 transition h-full">
              {/* Image */}
              <div className="relative h-80 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {/* Price Badge */}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur px-3 py-1 rounded-lg">
                  <p className="text-white font-semibold text-sm">{nft.price} ETH</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-white text-sm mb-2 group-hover:text-purple-400 transition">
                  {nft.name}
                </h3>

                {/* Creator */}
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src={nft.creatorAvatar}
                    alt={nft.creatorName}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-gray-400 text-xs">{nft.creatorName}</span>
                </div>

                {/* Action Button */}
                <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-xs">
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
