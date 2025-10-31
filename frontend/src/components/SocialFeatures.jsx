import React, { useState, useContext } from 'react';
import { ICOContent } from '../Context';
import socketService from '../services/socketService';
import { FiHeart, FiShare2, FiMessageCircle, FiEye, FiBookmark, FiFlag } from 'react-icons/fi';
import { FaHeart, FaBookmark } from 'react-icons/fa';
import toast from 'react-hot-toast';

const SocialFeatures = ({ nftId, nftData, onLike, onFavorite, onShare }) => {
  const { address } = useContext(ICOContent);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(nftData?.likeCount || 0);
  const [favoriteCount, setFavoriteCount] = useState(nftData?.favoriteCount || 0);
  const [viewCount, setViewCount] = useState(nftData?.viewCount || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Load user's interaction state from localStorage
  React.useEffect(() => {
    if (address && nftId) {
      const userInteractions = JSON.parse(localStorage.getItem('userInteractions') || '{}');
      const nftInteractions = userInteractions[nftId] || {};
      
      setIsLiked(nftInteractions.liked || false);
      setIsFavorited(nftInteractions.favorited || false);
    }
  }, [address, nftId]);

  // Track view count
  React.useEffect(() => {
    if (nftId) {
      const viewKey = `nft_view_${nftId}`;
      const hasViewed = localStorage.getItem(viewKey);
      
      if (!hasViewed) {
        setViewCount(prev => prev + 1);
        localStorage.setItem(viewKey, 'true');
        
        // Send view activity
        socketService.sendUserActivity({
          type: 'nft_viewed',
          user: address,
          nftId: nftId,
          nftName: nftData?.name
        });
      }
    }
  }, [nftId, address, nftData?.name]);

  const handleLike = async () => {
    if (!address) {
      toast.error('Please connect your wallet to like NFTs');
      return;
    }

    setIsLoading(true);
    
    try {
      const newLikeState = !isLiked;
      setIsLiked(newLikeState);
      setLikeCount(prev => newLikeState ? prev + 1 : prev - 1);

      // Update localStorage
      const userInteractions = JSON.parse(localStorage.getItem('userInteractions') || '{}');
      userInteractions[nftId] = {
        ...userInteractions[nftId],
        liked: newLikeState
      };
      localStorage.setItem('userInteractions', JSON.stringify(userInteractions));

      // Send real-time activity
      socketService.sendUserActivity({
        type: 'nft_liked',
        user: address,
        nftId: nftId,
        nftName: nftData?.name,
        action: newLikeState ? 'liked' : 'unliked'
      });

      // Call parent callback if provided
      if (onLike) {
        onLike(nftId, newLikeState);
      }

      toast.success(newLikeState ? 'NFT liked!' : 'NFT unliked!');
    } catch (error) {
      console.error('Error liking NFT:', error);
      toast.error('Failed to like NFT');
      // Revert state
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!address) {
      toast.error('Please connect your wallet to favorite NFTs');
      return;
    }

    setIsLoading(true);
    
    try {
      const newFavoriteState = !isFavorited;
      setIsFavorited(newFavoriteState);
      setFavoriteCount(prev => newFavoriteState ? prev + 1 : prev - 1);

      // Update localStorage
      const userInteractions = JSON.parse(localStorage.getItem('userInteractions') || '{}');
      userInteractions[nftId] = {
        ...userInteractions[nftId],
        favorited: newFavoriteState
      };
      localStorage.setItem('userInteractions', JSON.stringify(userInteractions));

      // Send real-time activity
      socketService.sendUserActivity({
        type: 'nft_favorited',
        user: address,
        nftId: nftId,
        nftName: nftData?.name,
        action: newFavoriteState ? 'favorited' : 'unfavorited'
      });

      // Call parent callback if provided
      if (onFavorite) {
        onFavorite(nftId, newFavoriteState);
      }

      toast.success(newFavoriteState ? 'Added to favorites!' : 'Removed from favorites!');
    } catch (error) {
      console.error('Error favoriting NFT:', error);
      toast.error('Failed to favorite NFT');
      // Revert state
      setIsFavorited(!isFavorited);
      setFavoriteCount(prev => isFavorited ? prev + 1 : prev - 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: nftData?.name || 'Check out this NFT',
        text: `Check out this amazing NFT: ${nftData?.name}`,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!');
      }

      // Send real-time activity
      socketService.sendUserActivity({
        type: 'nft_shared',
        user: address,
        nftId: nftId,
        nftName: nftData?.name,
        platform: navigator.share ? 'native' : 'clipboard'
      });

      // Call parent callback if provided
      if (onShare) {
        onShare(nftId, shareData);
      }
    } catch (error) {
      console.error('Error sharing NFT:', error);
      toast.error('Failed to share NFT');
    }
  };

  const handleReport = () => {
    // This would open a report modal or redirect to report page
    toast.info('Report functionality coming soon');
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      {/* Left side - Stats */}
      <div className="flex items-center space-x-6">
        {/* Views */}
        <div className="flex items-center space-x-2 text-gray-600">
          <FiEye className="w-4 h-4" />
          <span className="text-sm font-display">{viewCount}</span>
        </div>

        {/* Likes */}
        <button
          onClick={handleLike}
          disabled={isLoading}
          className={`flex items-center space-x-2 transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isLiked ? <FaHeart className="w-4 h-4" /> : <FiHeart className="w-4 h-4" />}
          <span className="text-sm font-display">{likeCount}</span>
        </button>

        {/* Favorites */}
        <button
          onClick={handleFavorite}
          disabled={isLoading}
          className={`flex items-center space-x-2 transition-colors ${
            isFavorited ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isFavorited ? <FaBookmark className="w-4 h-4" /> : <FiBookmark className="w-4 h-4" />}
          <span className="text-sm font-display">{favoriteCount}</span>
        </button>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-4">
        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors cursor-pointer"
        >
          <FiShare2 className="w-4 h-4" />
          <span className="text-sm font-display">Share</span>
        </button>

        {/* Comment (placeholder) */}
        <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors cursor-pointer">
          <FiMessageCircle className="w-4 h-4" />
          <span className="text-sm font-display">Comment</span>
        </button>

        {/* Report */}
        <button
          onClick={handleReport}
          className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors cursor-pointer"
        >
          <FiFlag className="w-4 h-4" />
          <span className="text-sm font-display">Report</span>
        </button>
      </div>
    </div>
  );
};

export default SocialFeatures;

