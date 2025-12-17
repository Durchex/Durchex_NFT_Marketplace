import React, { useState, useEffect, useContext } from 'react';
import { FiClock, FiCheck, FiGift, FiLock } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ICOContent } from '../../Context/index.jsx';

const MyGiveawayNFTs = () => {
  const [giveawayNFTs, setGiveawayNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countdowns, setCountdowns] = useState({});
  const contexts = useContext(ICOContent);
  const { address } = contexts || {};

  // Fetch user's giveaway NFTs
  const fetchMyGiveawayNFTs = async () => {
    if (!address) {
      console.log('No wallet address available');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/admin/nfts/giveaways/my-nfts', {
        headers: { 'x-user-wallet': address }
      });
      setGiveawayNFTs(response.data.nfts || []);
    } catch (error) {
      console.error('Failed to fetch giveaway NFTs:', error);
      // Silently fail - user may not have any giveaway NFTs
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGiveawayNFTs();
  }, [address]);

  // Update countdowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns = {};
      giveawayNFTs.forEach(nft => {
        if (nft.eventStartTime) {
          const startTime = new Date(nft.eventStartTime).getTime();
          const now = new Date().getTime();
          const timeLeft = startTime - now;

          if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            newCountdowns[nft._id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
          } else {
            newCountdowns[nft._id] = 'Live Now!';
          }
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [giveawayNFTs]);

  // Claim/Mint giveaway NFT
  const handleClaimNFT = async (nftId) => {
    try {
      const response = await api.post('/admin/nfts/giveaways/claim', 
        { nftId },
        { headers: { 'x-user-wallet': address } }
      );
      if (response.data.success) {
        toast.success('NFT claimed successfully! Check your wallet.');
        fetchMyGiveawayNFTs();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to claim NFT');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading your giveaway NFTs...</div>
      </div>
    );
  }

  if (giveawayNFTs.length === 0) {
    return (
      <div className="text-center py-12">
        <FiGift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">No giveaway NFTs yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <FiGift className="w-6 h-6 text-green-400" />
        Your Giveaway NFTs
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {giveawayNFTs.map((nft) => {
          const isLive = nft.eventStatus === 'live';
          const isClaimed = nft.giveawayStatus === 'claimed' || nft.giveawayStatus === 'minted';
          const countdownTime = countdowns[nft._id] || 'Loading...';

          return (
            <div
              key={nft._id}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden border border-slate-700 hover:border-purple-500 transition-all"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-slate-700">
                {nft.image ? (
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <FiGift className="w-12 h-12" />
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  {isClaimed ? (
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <FiCheck className="w-3 h-3" /> Claimed
                    </div>
                  ) : (
                    <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {isLive ? 'Active' : 'Coming'}
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Title */}
                <h4 className="text-lg font-semibold text-white mb-1">{nft.name}</h4>
                <p className="text-sm text-gray-400 mb-3">{nft.collection}</p>

                {/* Network & Price */}
                <div className="flex justify-between items-center mb-4 text-sm">
                  <span className="text-gray-400">{nft.network}</span>
                  {nft.price && <span className="text-purple-400 font-semibold">{nft.price}</span>}
                </div>

                {/* Countdown or Status */}
                {isClaimed ? (
                  <div className="bg-green-900/30 border border-green-700 rounded px-3 py-2 mb-3 text-sm text-green-300 flex items-center gap-2">
                    <FiCheck className="w-4 h-4" />
                    Successfully claimed!
                  </div>
                ) : isLive ? (
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded px-3 py-2 mb-3 text-sm text-white font-semibold flex items-center gap-2">
                    <FiClock className="w-4 h-4" />
                    Minting Live Now!
                  </div>
                ) : (
                  <div className="bg-slate-700 border border-slate-600 rounded px-3 py-2 mb-3 text-sm text-gray-300 flex items-center gap-2">
                    <FiLock className="w-4 h-4" />
                    Unlocks in: <span className="font-mono text-purple-400 ml-1">{countdownTime}</span>
                  </div>
                )}

                {/* Mint Button */}
                {isLive && !isClaimed ? (
                  <button
                    onClick={() => handleClaimNFT(nft._id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 rounded-lg transition-all"
                  >
                    Claim & Mint Now
                  </button>
                ) : isClaimed ? (
                  <button
                    disabled
                    className="w-full bg-green-600/50 text-green-300 font-semibold py-2 rounded-lg cursor-not-allowed"
                  >
                    Claimed
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-slate-600/50 text-gray-400 font-semibold py-2 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FiLock className="w-4 h-4" />
                    Locked Until Launch
                  </button>
                )}

                {/* Fee Subsidy Info */}
                {nft.feeSubsidyPercentage > 0 && (
                  <div className="mt-3 bg-green-900/20 border border-green-700/50 rounded px-3 py-2 text-xs text-green-300">
                    <span className="font-semibold">{nft.feeSubsidyPercentage}% Network Fee Covered</span>
                    <p>Admin is covering {nft.feeSubsidyPercentage}% of your minting fee!</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyGiveawayNFTs;
