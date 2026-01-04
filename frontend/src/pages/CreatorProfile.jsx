import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiCopy, FiCheck } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import { nftAPI, userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const CreatorProfile = () => {
  const { walletAddress } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [creatorNFTs, setCreatorNFTs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeTab, setActiveTab] = useState('nfts');

  useEffect(() => {
    fetchCreatorProfile();
  }, [walletAddress]);

  const fetchCreatorProfile = async () => {
    setIsLoading(true);
    try {
      // Fetch user profile
      const userProfile = await userAPI.getUserProfile(walletAddress);
      
      if (userProfile) {
        setCreator(userProfile);
      } else {
        // If no user profile, create minimal creator data from address
        setCreator({
          walletAddress,
          username: `Creator ${walletAddress.slice(0, 6)}`,
          image: `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`,
          bio: 'Creator on Durchex',
          email: null
        });
      }

      // Fetch all NFTs from all networks and filter by this creator
      let allNFTs = [];
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum'];
      
      for (const network of networks) {
        try {
          const networkNfts = await nftAPI.getAllNftsByNetwork(network);
          if (Array.isArray(networkNfts)) {
            // Filter for NFTs where owner/seller matches this creator
            const creatorNfts = networkNfts.filter(
              nft => (nft.owner?.toLowerCase() === walletAddress?.toLowerCase() || 
                      nft.seller?.toLowerCase() === walletAddress?.toLowerCase() ||
                      nft.creator?.toLowerCase() === walletAddress?.toLowerCase())
            );
            allNFTs = [...allNFTs, ...creatorNfts];
          }
        } catch (err) {
          console.warn(`Error fetching NFTs from ${network}:`, err.message);
        }
      }

      // Sort by creation date (newest first)
      allNFTs.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setCreatorNFTs(allNFTs);
      console.log(`[CreatorProfile] Found ${allNFTs.length} NFTs for creator ${walletAddress}`);
    } catch (error) {
      console.error('[CreatorProfile] Error fetching profile:', error);
      toast.error('Failed to load creator profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading creator profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Creator not found</p>
            <button
              onClick={() => navigate('/')}
              className="text-purple-500 hover:text-purple-400"
            >
              Return to home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      <main className="mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition"
        >
          <FiArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Creator Header */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-8 mb-12 border border-purple-800/50">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={creator.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`}
                alt={creator.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`;
                }}
              />
            </div>

            {/* Creator Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{creator.username}</h1>
              
              {creator.bio && (
                <p className="text-gray-300 mb-4">{creator.bio}</p>
              )}

              {/* Wallet Address */}
              <div className="flex items-center gap-2 mb-6 bg-gray-900/50 px-4 py-2 rounded-lg w-fit">
                <code className="text-sm text-gray-400">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </code>
                <button
                  onClick={handleCopyAddress}
                  className="text-gray-400 hover:text-white transition"
                  title="Copy full address"
                >
                  {copiedAddress ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </button>
              </div>

              {/* Email if available */}
              {creator.email && (
                <div className="flex items-center gap-2 text-gray-400">
                  <FiMail size={18} />
                  <a href={`mailto:${creator.email}`} className="hover:text-white transition">
                    {creator.email}
                  </a>
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-8 mt-6 pt-6 border-t border-gray-700">
                <div>
                  <div className="text-2xl font-bold text-purple-400">{creatorNFTs.length}</div>
                  <div className="text-gray-400 text-sm">NFTs Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {creatorNFTs.filter(nft => nft.currentlyListed).length}
                  </div>
                  <div className="text-gray-400 text-sm">Listed NFTs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">0</div>
                  <div className="text-gray-400 text-sm">Followers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('nfts')}
            className={`px-6 py-4 font-semibold transition ${
              activeTab === 'nfts'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All NFTs ({creatorNFTs.length})
          </button>
          <button
            onClick={() => setActiveTab('listed')}
            className={`px-6 py-4 font-semibold transition ${
              activeTab === 'listed'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Listed ({creatorNFTs.filter(nft => nft.currentlyListed).length})
          </button>
        </div>

        {/* NFTs Grid */}
        <div>
          {creatorNFTs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">
                {activeTab === 'nfts' 
                  ? 'No NFTs created yet' 
                  : 'No NFTs listed yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(activeTab === 'listed' 
                ? creatorNFTs.filter(nft => nft.currentlyListed)
                : creatorNFTs
              ).map((nft, index) => (
                <Link
                  key={nft._id || index}
                  to={`/nft/${nft.tokenId || nft.itemId}/${nft.itemId}/${nft.price}`}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-lg bg-gray-900 border border-gray-800 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                    {/* NFT Image */}
                    <div className="relative w-full aspect-square overflow-hidden">
                      <img
                        src={nft.image || `https://picsum.photos/400/400?random=${index}`}
                        alt={nft.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = `https://picsum.photos/400/400?random=${index}`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Listed Badge */}
                      {nft.currentlyListed && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Listed
                        </div>
                      )}
                    </div>

                    {/* NFT Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-1 truncate group-hover:text-purple-400 transition">
                        {nft.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3 truncate">
                        {nft.collection || 'Collection'}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {nft.price ? `${(parseFloat(nft.price) / 1e18).toFixed(4)} ETH` : 'N/A'}
                        </span>
                        <span className="text-purple-400">View →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreatorProfile;
