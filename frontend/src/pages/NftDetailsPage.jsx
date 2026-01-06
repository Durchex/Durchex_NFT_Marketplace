import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiShare2, FiHeart, FiEye, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import Header from '../components/Header';
import { nftAPI } from '../services/api';

const NftDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchNftDetails();
  }, [id]);

  const fetchNftDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // The id parameter could be: itemId, tokenId, or _id
      let nftData = null;
      
      // Try to fetch from all networks by itemId or tokenId
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum'];
      
      for (const network of networks) {
        try {
          console.log(`Trying to fetch NFT from ${network} with id: ${id}`);
          
          // Fetch all NFTs from this network
          const nfts = await nftAPI.getAllNftsByNetwork(network);
          
          // Search by itemId, tokenId, or _id
          const found = nfts?.find(n => 
            n.itemId === id || 
            n.tokenId === id || 
            n._id === id
          );
          
          if (found) {
            nftData = found;
            console.log(`NFT found on ${network}:`, nftData);
            break;
          }
        } catch (networkErr) {
          console.warn(`Failed to fetch from ${network}:`, networkErr);
          continue;
        }
      }

      if (!nftData) {
        console.error('NFT not found in any network with id:', id);
        setError('NFT not found. It may have been delisted or removed.');
        setLoading(false);
        return;
      }

      setNft(nftData);
    } catch (err) {
      console.error('Error fetching NFT details:', err);
      setError('Failed to load NFT details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6"
          >
            <FiArrowLeft /> Go Back
          </button>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">{error || 'NFT Not Found'}</h2>
            <p className="text-gray-400 mb-6">The NFT you're looking for doesn't exist or has been removed.</p>
            <Link to="/explore" className="text-purple-400 hover:text-purple-300">
              Browse Other NFTs →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6 transition-colors"
        >
          <FiArrowLeft /> Go Back
        </button>

        {/* NFT Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: NFT Image */}
          <div className="flex flex-col">
            <div className="bg-gray-900 rounded-xl overflow-hidden mb-4 border border-gray-800">
              <img
                src={nft.image || nft.imageURL}
                alt={nft.name}
                className="w-full h-96 object-cover"
              />
            </div>

            {/* NFT Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <FiEye className="w-4 h-4" />
                  Views
                </div>
                <div className="text-xl font-bold">{(nft.views || 0).toLocaleString()}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <FiHeart className="w-4 h-4" />
                  Likes
                </div>
                <div className="text-xl font-bold">{(nft.likes || 0).toLocaleString()}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <FiDollarSign className="w-4 h-4" />
                  Price
                </div>
                <div className="text-xl font-bold">{nft.price || '—'}</div>
              </div>
            </div>
          </div>

          {/* Right: NFT Info */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{nft.name}</h1>
                  {nft.collection && (
                    <Link
                      to={`/collection/${nft.collection}`}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {nft.collection} →
                    </Link>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors" title="Share">
                    <FiShare2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setLiked(!liked)}
                    className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Like"
                  >
                    <FiHeart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            {nft.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">DESCRIPTION</h3>
                <p className="text-gray-300">{nft.description}</p>
              </div>
            )}

            {/* Details */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">DETAILS</h3>
              <div className="space-y-3">
                {nft.itemId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Item ID</span>
                    <span className="font-mono text-gray-300">{nft.itemId}</span>
                  </div>
                )}
                {nft.network && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network</span>
                    <span className="font-semibold capitalize">{nft.network}</span>
                  </div>
                )}
                {nft.creator && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creator</span>
                    <span className="font-semibold">{nft.creator}</span>
                  </div>
                )}
                {nft.category && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category</span>
                    <span className="font-semibold capitalize">{nft.category}</span>
                  </div>
                )}
                {nft.price && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price</span>
                    <span className="font-bold text-lg">{nft.price} ETH</span>
                  </div>
                )}
              </div>
            </div>

            {/* Properties */}
            {nft.properties && Object.keys(nft.properties).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">PROPERTIES</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(nft.properties).map(([key, value]) => (
                    <div key={key} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 capitalize mb-1">{key}</div>
                      <div className="font-semibold text-gray-200">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                <FiDollarSign /> Buy Now
              </button>
              <button className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors">
                Make an Offer
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NftDetailsPage;
