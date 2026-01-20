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
      }
    } catch (error) {
      console.error('Error fetching featured NFT:', error);
      // Fallback to trending
      try {
        const response = await nftAPI.get('/trending?limit=4');
        if (response.data && response.data.length > 0) {
          setFeaturedNFT(response.data[0]);
          setThumbnails(response.data.slice(1, 4));
        }
      } catch (err) {
        ErrorToast('Failed to load featured NFTs');
      }
    } finally {
      setLoading(false);
    }
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

  if (!featuredNFT) {
    return null;
  }

  return (
    <div className="mb-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Featured NFT Large Display */}
        <div className="lg:col-span-2">
          <div className="relative rounded-2xl overflow-hidden group">
            <img
              src={featuredNFT.image || 'https://via.placeholder.com/600x400'}
              alt={featuredNFT.name}
              className="w-full h-96 object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>

            {/* NFT Info - Bottom Left */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h2 className="text-4xl font-bold mb-1">{featuredNFT.name}</h2>
              <div className="flex items-center gap-2 mb-6">
                {featuredNFT.collectionName && (
                  <span className="text-gray-300 text-sm">{featuredNFT.collectionName}</span>
                )}
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Current Price</p>
                  <p className="text-2xl font-bold text-white">
                    {featuredNFT.price || '0.6'} ETH
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
                    <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 sm:flex-none px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition text-sm"
                  >
                    <ShoppingCart size={18} />
                    <span className="hidden sm:inline">Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Previews */}
        <div className="flex flex-col gap-4">
          <h3 className="text-white font-semibold text-lg">Featured Items</h3>
          <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
            {thumbnails.map((nft, idx) => (
              <div
                key={idx}
                className="relative rounded-lg overflow-hidden cursor-pointer group h-24"
              >
                <img
                  src={nft.image || 'https://via.placeholder.com/200'}
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="text-white" size={20} />
                </div>
              </div>
            ))}
          </div>

          {/* View Details Button */}
          <button className="mt-2 w-full px-4 py-2 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-600/10 transition font-semibold text-sm">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedNFTShowcase;
