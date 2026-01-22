import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { nftAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * TopCreators - Displays users with NFTs, arranged by most recent NFT
 */
const TopCreators = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

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
      
      // Calculate followers (mock for now, can be enhanced with actual data)
      creatorsList = creatorsList.map(creator => ({
        ...creator,
        followers: Math.floor(creator.nftCount * 50 + Math.random() * 1000)
      }));
      
      setCreators(creatorsList);
      console.log(`[TopCreators] Loaded ${creatorsList.length} creators`);
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
      _id: `creator-${idx}`,
      username: name,
      address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      totalVolume: Math.floor(Math.random() * 500) + 10,
      followers: Math.floor(Math.random() * 10000),
      isVerified: Math.random() > 0.5
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
          <Link
            key={creator._id}
            to={`/profile/${creator.address}`}
            className="group text-center w-full min-w-0"
          >
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="mb-2">
                <img
                  src={creator.avatar}
                  alt={creator.username}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full group-hover:shadow-lg group-hover:shadow-purple-500/50 transition"
                />
              </div>

              {/* Name */}
              <h3 className="font-bold text-white text-xs sm:text-sm group-hover:text-purple-400 transition mb-1.5 sm:mb-2 text-center line-clamp-2">
                {creator.username}
              </h3>

              {/* Stats - Simple format */}
              <div className="space-y-0.5 sm:space-y-1 text-center">
                <div>
                  <p className="text-gray-400 text-[10px] sm:text-xs">Followers</p>
                  <p className="font-bold text-white text-xs">{(creator.followers / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] sm:text-xs">Volume</p>
                  <p className="font-bold text-white text-xs">{creator.totalVolume} <span className="text-gray-400">ETH</span></p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TopCreators;
