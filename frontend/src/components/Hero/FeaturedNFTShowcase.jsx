import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { nftAPI } from '../../services/api';
import { SuccessToast } from '../../app/Toast/Success.jsx';
import { ErrorToast } from '../../app/Toast/Error.jsx';

/**
 * FeaturedNFTShowcase - Hero section with featured collection and its NFTs
 */
const FeaturedNFTShowcase = () => {
  const [featuredCollection, setFeaturedCollection] = useState(null);
  const [featuredNFTs, setFeaturedNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchFeaturedCollection();
  }, []);

  const fetchFeaturedCollection = async () => {
    try {
      setLoading(true);
      console.log('[FeaturedNFTShowcase] Fetching collections and NFTs from all networks...');
      
      // ✅ Fetch all collections
      const allCollectionsData = await nftAPI.getCollections();
      console.log('[FeaturedNFTShowcase] Collections:', allCollectionsData);
      
      // Use first collection as featured
      let collection = null;
      if (Array.isArray(allCollectionsData) && allCollectionsData.length > 0) {
        collection = allCollectionsData[0];
      }
      
      if (!collection) {
        throw new Error('No collections found');
      }
      
      setFeaturedCollection(collection);
      
      // ✅ Fetch NFTs from all networks
      let nftsData = [];
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
      
      for (const network of networks) {
        try {
          console.log(`[FeaturedNFTShowcase] Fetching NFTs from ${network}...`);
          const networkNfts = await nftAPI.getAllNftsByNetwork(network);
          if (Array.isArray(networkNfts)) {
            nftsData = [...nftsData, ...networkNfts];
          }
        } catch (err) {
          console.warn(`[FeaturedNFTShowcase] Error fetching from ${network}:`, err.message);
        }
      }
      
      // Get first 3 NFTs as featured showcase
      const showcaseNFTs = nftsData.slice(0, 3);
      setFeaturedNFTs(showcaseNFTs);
      
      if (showcaseNFTs.length === 0) {
        throw new Error('No NFTs found');
      }
      
      console.log(`[FeaturedNFTShowcase] Fetched ${showcaseNFTs.length} NFTs`);
    } catch (error) {
      console.error('[FeaturedNFTShowcase] Error fetching data:', error);
      // Generate mock data as final fallback
      const mockData = generateMockFeaturedCollection();
      setFeaturedCollection(mockData.collection);
      setFeaturedNFTs(mockData.nfts);
    } finally {
      setLoading(false);
    }
  };

  const generateMockFeaturedCollection = () => {
    const collection = {
      _id: 'featured-1',
      name: 'Victory of Olympus',
      image: 'https://via.placeholder.com/600x400?text=Victory+of+Olympus',
      description: 'A collection inspired by ancient Greek mythology',
      itemCount: 250,
      floorPrice: '0.6'
    };

    const nfts = [
      { _id: 'nft-1', name: 'Athena\'s Wisdom', image: 'https://via.placeholder.com/200x200?text=NFT+1', price: '0.8' },
      { _id: 'nft-2', name: 'Zeus\'s Power', image: 'https://via.placeholder.com/200x200?text=NFT+2', price: '1.2' },
      { _id: 'nft-3', name: 'Aphrodite\'s Grace', image: 'https://via.placeholder.com/200x200?text=NFT+3', price: '0.95' }
    ];

    return { collection, nfts };
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
  const displayCollection = featuredCollection || generateMockFeaturedCollection().collection;
  const displayNFTs = featuredNFTs && featuredNFTs.length > 0 ? featuredNFTs : generateMockFeaturedCollection().nfts;

  return (
    <div className="mb-4 xs:mb-5 sm:mb-8 md:mb-12 lg:mb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 md:gap-4 lg:gap-6 items-start md:items-center">
        {/* Featured Collection Large Display */}
        <div className="md:col-span-1 lg:col-span-2">
          <div className="relative rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden group">
            <img
              src={displayCollection.image || 'https://via.placeholder.com/600x400'}
              alt={displayCollection.name}
              className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>

            {/* Collection Info - Bottom Left */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8 text-white">
              <h2 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1">{displayCollection.name}</h2>
              <div className="flex items-center gap-2 mb-2 sm:mb-4 md:mb-6">
                {displayCollection.itemCount && (
                  <span className="text-gray-300 text-xs md:text-sm">{displayCollection.itemCount} items</span>
                )}
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col xs:flex-row gap-2 md:gap-3 lg:gap-4 items-stretch xs:items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Floor Price</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    {displayCollection.floorPrice || '0.6'} ETH
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full xs:w-auto">
                  <button
                    onClick={handleLike}
                    className={`p-2 rounded-lg border-2 transition flex-shrink-0 ${
                      liked
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-gray-600 text-gray-300 hover:border-red-500'
                    }`}
                  >
                    <Heart size={18} />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 px-3 sm:px-4 md:px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1 xs:gap-2 transition text-xs sm:text-sm"
                  >
                    <ShoppingCart size={16} />
                    <span className="hidden xs:inline">View</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured NFTs from Collection */}
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
          <h3 className="text-white font-semibold text-xs sm:text-sm md:text-base lg:text-lg">Featured Items</h3>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {displayNFTs.map((nft, idx) => (
              <div
                key={idx}
                className="relative rounded-lg overflow-hidden cursor-pointer group h-20 md:h-24"
              >
                <img
                  src={nft.image || `https://via.placeholder.com/200x200?text=NFT%20${idx + 1}`}
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ChevronRight className="text-white" size={18} />
                </div>
                {/* NFT Price Tooltip */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
                  <p className="text-white text-xs font-semibold line-clamp-1">{nft.name || `Item ${idx + 1}`}</p>
                  <p className="text-purple-300 text-xs">{nft.price || '0.5'} ETH</p>
                </div>
              </div>
            ))}
          </div>

          {/* View Details Button */}
          <button className="mt-2 w-full px-4 py-2 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-600/10 transition font-semibold text-xs md:text-sm">
            View Collection
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedNFTShowcase;
