import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { userAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * TopCreators - Displays top 10 creators by volume
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
      // Try to get top creators - adjust endpoint based on your API
      const response = await userAPI.get('/top-creators?limit=10');
      setCreators(response.data || []);
    } catch (error) {
      console.error('Error fetching top creators:', error);
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
    <div className="mb-8 md:mb-12 lg:mb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Top Creators</h2>
          <p className="text-gray-400 text-xs md:text-sm">Verified creators on Durchex</p>
        </div>
        <Link
          to="/rankings"
          className="flex items-center gap-2 px-4 md:px-5 py-2 border border-purple-600 text-purple-400 rounded-full hover:bg-purple-600/10 transition font-semibold text-xs md:text-sm whitespace-nowrap"
        >
          <TrendingUp size={14} />
          View Rankings
        </Link>
      </div>

      {/* Creators Grid - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {creators.map((creator) => (
          <Link
            key={creator._id}
            to={`/profile/${creator.address}`}
            className="group text-center"
          >
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="mb-2">
                <img
                  src={creator.avatar}
                  alt={creator.username}
                  className="w-14 md:w-20 h-14 md:h-20 rounded-full group-hover:shadow-lg group-hover:shadow-purple-500/50 transition"
                />
              </div>

              {/* Name */}
              <h3 className="font-bold text-white text-xs md:text-sm group-hover:text-purple-400 transition mb-2 text-center line-clamp-2">
                {creator.username}
              </h3>

              {/* Stats - Simple format */}
              <div className="space-y-1 text-xs text-center">
                <div>
                  <p className="text-gray-400 text-xs">Followers</p>
                  <p className="font-bold text-white text-xs">{(creator.followers / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Volume</p>
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
