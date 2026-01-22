import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { nftAPI, userAPI } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * TopCreators - Displays users with NFTs, arranged by most recent NFT
 * Shows username and avatar, clickable to profile
 */
const TopCreators = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopCreators();
  }, []);

  const fetchTopCreators = async () => {
    try {
      setLoading(true);
      console.log('[TopCreators] Fetching users with NFTs...');
      
      // ✅ Fetch all NFTs from all networks
      let allNFTs = [];
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
      
      for (const network of networks) {
        try {
          console.log(`[TopCreators] Fetching NFTs from ${network}...`);
          const networkNfts = await nftAPI.getAllNftsByNetwork(network);
          if (Array.isArray(networkNfts)) {
            allNFTs = [...allNFTs, ...networkNfts];
          }
        } catch (err) {
          console.warn(`[TopCreators] Error fetching from ${network}:`, err.message);
        }
      }
      
      if (allNFTs.length === 0) {
        throw new Error('No NFTs found');
      }
      
      console.log(`[TopCreators] Total NFTs fetched: ${allNFTs.length}`);
      
      // Group NFTs by creator wallet address
      const creatorsMap = new Map();
      
      allNFTs.forEach(nft => {
        const walletAddress = nft.creatorWallet || nft.owner || nft.walletAddress;
        if (!walletAddress) return;
        
        const nftDate = nft.createdAt ? new Date(nft.createdAt) : (nft._id ? new Date(nft._id.toString().substring(0, 8)) : new Date(0));
        
        if (!creatorsMap.has(walletAddress)) {
          creatorsMap.set(walletAddress, {
            address: walletAddress,
            username: nft.creatorName || nft.creator || `User ${walletAddress.substring(0, 6)}`,
            avatar: nft.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`,
            nftCount: 0,
            mostRecentNFTDate: nftDate,
            totalVolume: 0
          });
        }
        
        const creator = creatorsMap.get(walletAddress);
        creator.nftCount++;
        
        // Update most recent NFT date
        if (nftDate > creator.mostRecentNFTDate) {
          creator.mostRecentNFTDate = nftDate;
        }
        
        // Add to volume
        const price = parseFloat(nft.price || nft.floorPrice || 0);
        creator.totalVolume += price;
      });
      
      // Convert to array and sort by most recent NFT date
      let creatorsList = Array.from(creatorsMap.values());
      creatorsList.sort((a, b) => b.mostRecentNFTDate - a.mostRecentNFTDate);
      
      // Take top 10
      creatorsList = creatorsList.slice(0, 10);
      
      // Fetch user profiles to get usernames and avatars
      const creatorsWithProfiles = await Promise.all(
        creatorsList.map(async (creator) => {
          try {
            const profile = await userAPI.getUserProfile(creator.address);
            if (profile) {
              return {
                ...creator,
                username: profile.username || creator.username,
                avatar: profile.image || profile.avatar || creator.avatar
              };
            }
            return creator;
          } catch (error) {
            console.warn(`[TopCreators] Error fetching profile for ${creator.address}:`, error);
            return creator;
          }
        })
      );
      
      setCreators(creatorsWithProfiles);
      console.log(`[TopCreators] Loaded ${creatorsWithProfiles.length} creators`);
    } catch (error) {
      console.error('[TopCreators] Error fetching creators:', error);
      // Generate mock data if API fails
      setCreators(generateMockCreators());
    } finally {
      setLoading(false);
    }
  };

  const generateMockCreators = () => {
    const names = [
      'Kexyread', 'Daysi.ch', 'GreatDying', 'Jianelia', 'Joaniela',
      'Roarnwhale', 'Mr Fox', 'Strenaldo', 'Robotica', 'Robotica'
    ];
    
    return names.map((name, idx) => ({
      address: `0x${Math.random().toString(16).slice(2, 42)}`,
      username: name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      mostRecentNFTDate: new Date(Date.now() - idx * 86400000) // Stagger dates
    }));
  };

  if (loading) {
    return (
      <div className="mb-8 md:mb-12 lg:mb-16 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="h-32 md:h-40 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-8 md:mb-12 lg:mb-16 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">Top Creators</h2>
          <p className="text-gray-400 text-xs sm:text-sm">Verified creators on Durchex</p>
        </div>
        <Link
          to="/rankings"
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-purple-600 text-purple-400 rounded-full hover:bg-purple-600/10 transition font-semibold text-xs sm:text-sm whitespace-nowrap"
        >
          <TrendingUp size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">View Rankings</span>
          <span className="sm:hidden">Rankings</span>
        </Link>
      </div>

      {/* Creators Grid - Mobile: 2 cols, Tablet: 3-4 cols, Desktop: 5 cols */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
        {creators.map((creator) => (
          <div
            key={creator.address}
            className="group text-center w-full min-w-0 cursor-pointer"
            onClick={() => navigate(`/profile/${creator.address}`)}
          >
            <div className="flex flex-col items-center">
              {/* Avatar - Clickable */}
              <div 
                className="mb-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${creator.address}`);
                }}
              >
                <img
                  src={creator.avatar}
                  alt={creator.username}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full group-hover:shadow-lg group-hover:shadow-purple-500/50 transition"
                />
              </div>

              {/* Username */}
              <h3 
                className="font-bold text-white text-xs sm:text-sm group-hover:text-purple-400 transition text-center line-clamp-2"
                onClick={() => navigate(`/profile/${creator.address}`)}
              >
                {creator.username || `User ${creator.address.substring(0, 6)}`}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopCreators;
