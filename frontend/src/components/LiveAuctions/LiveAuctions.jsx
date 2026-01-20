import React, { useState, useEffect } from 'react';
import { Clock, User, Gavel } from 'lucide-react';
import { nftAPI } from '../../services/api';
import toast from 'react-hot-toast';

/**
 * LiveAuctions - Grid of active auctions with countdown timers
 */
const LiveAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({});

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      // Fetch active auctions
      const response = await nftAPI.get('/auctions?status=active&limit=6');
      setAuctions(response.data || generateMockAuctions());
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setAuctions(generateMockAuctions());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAuctions = () => {
    const colors = ['bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-purple-400', 'bg-blue-400', 'bg-pink-400'];
    return Array(6).fill(0).map((_, i) => ({
      _id: `auction-${i}`,
      name: 'Futuristic Artist Portrait',
      image: `https://via.placeholder.com/300x350?text=Auction%20${i + 1}`,
      currentBid: (Math.random() * 3 + 0.5).toFixed(2),
      bidCount: Math.floor(Math.random() * 50) + 5,
      creatorName: 'Alexander Bias',
      creatorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=auctioneer${i}`,
      endTime: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      backgroundColor: colors[i % colors.length]
    }));
  };

  // Countdown timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};
      auctions.forEach((auction) => {
        const endTime = new Date(auction.endTime).getTime();
        const now = Date.now();
        const diff = endTime - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          newTimers[auction._id] = `${hours}h ${minutes}m ${seconds}s`;
        } else {
          newTimers[auction._id] = 'Ended';
        }
      });
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [auctions]);

  if (loading) {
    return (
      <div className="mb-16 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-96 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Live Auction</h2>
        <p className="text-gray-400 text-xs">You are welcome to participate and bid for NFT from Durchex</p>
      </div>

      {/* Auctions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => (
          <div key={auction._id} className="group cursor-pointer">
            <div className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-600/50 transition h-full flex flex-col">
              {/* Image Container */}
              <div className="relative h-72 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                {auction.image ? (
                  <img
                    src={auction.image}
                    alt={auction.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className={`w-full h-full ${auction.backgroundColor} opacity-50`}></div>
                )}

                {/* Timer Badge */}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur px-3 py-1 rounded-lg flex items-center gap-2">
                  <Clock size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-white font-mono text-xs">{timers[auction._id] || '...'}</p>
                </div>

                {/* Bid Count Badge */}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur px-3 py-1 rounded-lg">
                  <p className="text-white font-semibold text-sm">{auction.bidCount} Bids</p>
                </div>

                {/* Place Bid Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition">
                    <Gavel size={20} />
                    Place Bid
                  </button>
                </div>
              </div>

              {/* Auction Info */}
              <div className="p-4 flex-grow flex flex-col justify-between">
                <h3 className="font-bold text-white text-sm group-hover:text-purple-400 transition line-clamp-2 mb-3">
                  {auction.name}
                </h3>

                {/* Current Bid */}
                <div className="mb-3 pb-3 border-b border-gray-700/50">
                  <p className="text-gray-400 text-xs mb-1">Current Bid</p>
                  <p className="text-xl font-bold text-purple-400">{auction.currentBid} ETH</p>
                </div>

                {/* Creator */}
                <div className="flex items-center gap-2">
                  <img
                    src={auction.creatorAvatar}
                    alt={auction.creatorName}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-gray-400 text-xs">{auction.creatorName}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveAuctions;
