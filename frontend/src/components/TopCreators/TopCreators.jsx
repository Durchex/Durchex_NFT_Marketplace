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
      <div className="mb-16 animate-pulse">
        <div className="h-screen grid grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="h-40 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Top Creators</h2>
          <p className="text-gray-400 text-sm">Verified creators on Durchex</p>
        </div>
        <Link
          to="/rankings"
          className="flex items-center gap-2 px-5 py-2 border border-purple-600 text-purple-400 rounded-full hover:bg-purple-600/10 transition font-semibold text-sm"
        >
          <TrendingUp size={16} />
          View Rankings
        </Link>
      </div>

      {/* Creators Grid - 5 columns exactly */}
      <div className="grid grid-cols-5 gap-4">
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
                  className="w-20 h-20 rounded-full group-hover:shadow-lg group-hover:shadow-purple-500/50 transition"
                />
              </div>

              {/* Name */}
              <h3 className="font-bold text-white text-sm group-hover:text-purple-400 transition mb-2">
                {creator.username}
              </h3>

              {/* Stats - Simple format */}
              <div className="space-y-1 text-xs">
                <div>
                  <p className="text-gray-400">Followers</p>
                  <p className="font-bold text-white">{(creator.followers / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-gray-400">Volume</p>
                  <p className="font-bold text-white">{creator.totalVolume} <span className="text-gray-400">ETH</span></p>
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
