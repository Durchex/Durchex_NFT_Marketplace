import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { nftAPI } from '../../services/api';
import { SuccessToast } from '../../app/Toast/Success.jsx';
import { ErrorToast } from '../../app/Toast/Error.jsx';

/**
 * FeaturedNFTShowcase - Hero section displaying featured NFT
 */
const FeaturedNFTShowcase = () => {
  const [featuredNFT, setFeaturedNFT] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchFeaturedNFT();
  }, []);

  const fetchFeaturedNFT = async () => {
    try {
      setLoading(true);
      // Get featured NFTs
      const response = await nftAPI.get('/featured-nfts?limit=4');
      if (response.data && response.data.length > 0) {
        const featured = response.data[0];
        setFeaturedNFT(featured);
        setThumbnails(response.data.slice(1, 4));
      } else {
        throw new Error('No featured data');
      }
    } catch (error) {
      console.error('Error fetching featured NFT:', error);
      // Fallback to trending
      try {
        const response = await nftAPI.get('/trending?limit=4');
        if (response.data && response.data.length > 0) {
          setFeaturedNFT(response.data[0]);
          setThumbnails(response.data.slice(1, 4));
        } else {
          throw new Error('No trending data');
        }
      } catch (err) {
        console.error('Error fetching trending:', err);
        // Generate mock data as final fallback
        const mockData = generateMockFeaturedNFT();
        setFeaturedNFT(mockData.featured);
        setThumbnails(mockData.thumbnails);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockFeaturedNFT = () => {
    const featured = {
      _id: 'featured-1',
      name: 'Victory of Olympus',
      collectionName: 'Ai Story',
      price: '0.6',
      image: 'https://via.placeholder.com/600x400?text=Victory+of+Olympus'
    };

    const thumbnails = [
      { _id: 'thumb-1', name: 'Thumbnail 1', image: 'https://via.placeholder.com/200x200?text=Thumb+1' },
      { _id: 'thumb-2', name: 'Thumbnail 2', image: 'https://via.placeholder.com/200x200?text=Thumb+2' },
      { _id: 'thumb-3', name: 'Thumbnail 3', image: 'https://via.placeholder.com/200x200?text=Thumb+3' }
    ];

    return { featured, thumbnails };
  };

  const handleLike = () => {
    setLiked(!liked);
    SuccessToast(liked ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleAddToCart = () => {
    SuccessToast('Added to cart');
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl animate-pulse"></div>
    );
  }

  // Always show something - use mock data if needed
  const displayNFT = featuredNFT || generateMockFeaturedNFT().featured;
  const displayThumbnails = thumbnails && thumbnails.length > 0 ? thumbnails : generateMockFeaturedNFT().thumbnails;

  return (
    <div className="mb-8 md:mb-12 lg:mb-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-center">
        {/* Featured NFT Large Display */}
        <div className="lg:col-span-2">
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden group">
            <img
              src={displayNFT.image || 'https://via.placeholder.com/600x400'}
              alt={displayNFT.name}
              className="w-full h-64 sm:h-80 md:h-96 object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>

            {/* NFT Info - Bottom Left */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 text-white">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1">{displayNFT.name}</h2>
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                {displayNFT.collectionName && (
                  <span className="text-gray-300 text-xs md:text-sm">{displayNFT.collectionName}</span>
                )}
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-4 items-start sm:items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Current Price</p>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {displayNFT.price || '0.6'} ETH
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleLike}
                    className={`p-2 rounded-lg border-2 transition ${
                      liked
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-gray-600 text-gray-300 hover:border-red-500'
                    }`}
                  >
                    <Heart size={18} />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 sm:flex-none px-4 md:px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition text-xs md:text-sm"
                  >
                    <ShoppingCart size={16} />
                    <span className="hidden sm:inline">Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Previews */}
        <div className="flex flex-col gap-3 md:gap-4">
          <h3 className="text-white font-semibold text-sm md:text-lg">Featured Items</h3>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {displayThumbnails.map((nft, idx) => (
              <div
                key={idx}
                className="relative rounded-lg overflow-hidden cursor-pointer group h-20 md:h-24"
              >
                <img
                  src={nft.image || 'https://via.placeholder.com/200'}
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="text-white" size={18} />
                </div>
              </div>
            ))}
          </div>

          {/* View Details Button */}
          <button className="mt-2 w-full px-4 py-2 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-600/10 transition font-semibold text-xs md:text-sm">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedNFTShowcase;
