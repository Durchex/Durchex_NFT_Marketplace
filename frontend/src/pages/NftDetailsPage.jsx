import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiShare2, FiHeart, FiEye, FiDollarSign, FiCheckCircle, FiTrendingUp, FiTrendingDown, FiUser, FiBarChart2 } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../components/Header';
import OfferModal from '../components/OfferModal';
import { nftAPI } from '../services/api';

const NftDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [priceData, setPriceData] = useState([]);
  const [tradeData, setTradeData] = useState([]);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  useEffect(() => {
    fetchNftDetails();
  }, [id]);

  // Generate simulated price movement data
  const generatePriceData = (basePrice = 1.5) => {
    const data = [];
    let currentPrice = parseFloat(basePrice);
    for (let i = 0; i < 24; i++) {
      const change = (Math.random() - 0.48) * 0.15; // Slight upward bias
      currentPrice = Math.max(currentPrice + change, currentPrice * 0.85);
      data.push({
        time: `${i}:00`,
        price: parseFloat(currentPrice.toFixed(4)),
        volume: Math.floor(Math.random() * 50 + 10)
      });
    }
    return data;
  };

  // Generate simulated trading activity
  const generateTradeData = () => {
    const traders = ['0x742d...', '0x8a5f...', '0x3c2b...', '0x9e1f...', '0x4d8c...'];
    const trades = [];
    for (let i = 0; i < 8; i++) {
      const isBuy = Math.random() > 0.5;
      trades.push({
        id: i,
        trader: traders[Math.floor(Math.random() * traders.length)],
        type: isBuy ? 'Buy' : 'Sell',
        price: (Math.random() * 0.5 + 1.2).toFixed(4),
        quantity: Math.floor(Math.random() * 3 + 1),
        time: `${Math.floor(Math.random() * 60)}m ago`
      });
    }
    return trades;
  };

  const fetchNftDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // The id parameter could be: itemId, tokenId, or _id
      let nftData = null;
      
      // Try to fetch from all networks by itemId or tokenId
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
      
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
      // Generate simulated trading data
      setPriceData(generatePriceData(parseFloat(nftData.price) || 1.5));
      setTradeData(generateTradeData());
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
              <button onClick={() => setOfferModalOpen(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                <FiDollarSign /> Buy Now / Make Offer
              </button>
            </div>
          </div>
        </div>

        {/* Market Analytics & Price Chart Section */}
        <div className="mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Market Analytics */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <FiBarChart2 className="text-purple-400" />
                  Market Analytics
                </h2>

                {/* Floor Price */}
                <div className="mb-6 pb-6 border-b border-gray-700">
                  <div className="text-sm text-gray-400 mb-2">Floor Price</div>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl font-bold text-green-400">
                      {parseFloat(nft.price || 1.5).toFixed(4)} ETH
                    </div>
                    <div className="flex items-center gap-1 text-green-400 text-sm mb-1">
                      <FiTrendingUp className="w-4 h-4" />
                      +2.5%
                    </div>
                  </div>
                </div>

                {/* Collection Stats */}
                <div className="mb-6 pb-6 border-b border-gray-700">
                  <div className="text-sm text-gray-400 mb-3">Collection Stats</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">24h Volume</span>
                      <span className="font-semibold">{(Math.random() * 50 + 20).toFixed(2)} ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">24h Sales</span>
                      <span className="font-semibold">{Math.floor(Math.random() * 15 + 5)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Collection Size</span>
                      <span className="font-semibold">{Math.floor(Math.random() * 5000 + 1000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Owners</span>
                      <span className="font-semibold">{Math.floor(Math.random() * 800 + 200)}</span>
                    </div>
                  </div>
                </div>

                {/* Durchex Rank */}
                <div>
                  <div className="text-sm text-gray-400 mb-3">Durchex Rank</div>
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/30">
                    <div className="text-3xl font-bold text-purple-400 mb-1">
                      #{Math.floor(Math.random() * 500 + 1)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Ranking Score: {(Math.random() * 40 + 60).toFixed(1)}/100
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Price Chart & Trading Activity */}
            <div className="lg:col-span-2">
              {/* Price Movement Chart */}
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiTrendingUp className="text-blue-400" />
                  Price Movement (24h)
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={priceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #666' }}
                      formatter={(value) => `${value.toFixed(4)} ETH`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Trading Activity */}
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiUser className="text-green-400" />
                  Recent Trading Activity
                </h2>
                <div className="space-y-3">
                  {tradeData.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          trade.type === 'Buy' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.type}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-300">{trade.trader}</div>
                          <div className="text-xs text-gray-500">{trade.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">{trade.price} ETH</div>
                        <div className="text-xs text-gray-400">x{trade.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
                    View All Transactions →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Offer Modal */}
      <OfferModal isOpen={offerModalOpen} onClose={() => setOfferModalOpen(false)} nft={nft} />
    </div>
  );
};

export default NftDetailsPage;
