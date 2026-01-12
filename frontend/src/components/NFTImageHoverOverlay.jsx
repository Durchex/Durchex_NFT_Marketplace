import React, { useState } from 'react';
import { FiShoppingCart, FiShare2, FiHeart, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const NFTImageHoverOverlay = ({ 
  nft, 
  onAddToCart, 
  onShare, 
  onLike, 
  isInCart = false,
  isLiked = false,
  loading = false 
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        // Use native share if available
        await navigator.share({
          title: `Check out ${nft.name}`,
          text: `Explore this amazing NFT: ${nft.name} from ${nft.collection}`,
          url: window.location.href
        });
      } else {
        // Fallback: copy link to clipboard
        const shareLink = `${window.location.origin}/nft/${nft.itemId}`;
        navigator.clipboard.writeText(shareLink);
        toast.success('Link copied to clipboard!');
      }
      
      if (onShare) {
        await onShare();
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleLike = async () => {
    setIsLiking(true);
    try {
      if (onLike) {
        await onLike();
      }
      toast.success(isLiked ? 'Removed from liked' : 'Added to liked!');
    } catch (error) {
      console.error('Error liking:', error);
      toast.error('Failed to like NFT');
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToCart) {
      try {
        await onAddToCart();
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 rounded-lg">
      {/* Action Buttons Row */}
      <div className="flex items-center gap-3 justify-between">
        {/* Left side: Add to Cart / Share */}
        <div className="flex items-center gap-2">
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
              isInCart
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm'
            }`}
            title={isInCart ? 'Remove from cart' : 'Add to cart'}
          >
            {isInCart ? (
              <FiCheck className="w-5 h-5" />
            ) : (
              <FiShoppingCart className="w-5 h-5" />
            )}
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white transition-all duration-300 backdrop-blur-sm"
            title="Share this NFT"
          >
            <FiShare2 className="w-5 h-5" />
          </button>
        </div>

        {/* Right side: Like Button */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
            isLiked
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm'
          }`}
          title={isLiked ? 'Unlike this NFT' : 'Like this NFT'}
        >
          <FiHeart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* NFT Info at bottom */}
      <div className="mt-3 text-white">
        <p className="text-sm font-semibold truncate">{nft.name}</p>
        <p className="text-xs text-gray-300 truncate">{nft.collection || 'Collection'}</p>
        {nft.price && (
          <p className="text-xs text-purple-400 font-semibold mt-1">
            {nft.price} {nft.currency || 'ETH'}
          </p>
        )}
      </div>
    </div>
  );
};

export default NFTImageHoverOverlay;
