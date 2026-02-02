import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiShare2, FiHeart, FiEye, FiDollarSign, FiCheckCircle, FiTrendingUp, FiTrendingDown, FiUser, FiBarChart2, FiShoppingCart } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../components/Header';
import OfferModal from '../components/OfferModal';
import SellModal from '../components/SellModal';
import { nftAPI, engagementAPI } from '../services/api';
import { getCurrencySymbol, getUsdValueFromCrypto } from '../Context/constants';
import { ICOContent } from '../Context';
import { useCart } from '../Context/CartContext';
import toast from 'react-hot-toast';

const NftDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address } = useContext(ICOContent);
  const { addToCart, isInCart, getCartNftId } = useCart();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [priceData, setPriceData] = useState([]);
  const [tradeData, setTradeData] = useState([]);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchNftDetails();
  }, [id]);

  // Fallback price chart data when no trades yet
  const generateFallbackPriceData = (basePrice = 1.5) => {
    const data = [];
    let currentPrice = parseFloat(basePrice);
    for (let i = 0; i < 24; i++) {
      const change = (Math.random() - 0.48) * 0.15;
      currentPrice = Math.max(currentPrice + change, currentPrice * 0.85);
      data.push({
        time: `${i}:00`,
        price: parseFloat(currentPrice.toFixed(4)),
        volume: Math.floor(Math.random() * 50 + 10)
      });
    }
    return data;
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
      setViews(nftData.views || 0);
      setLikes(nftData.likes || 0);

      const net = (nftData.network || 'ethereum').toLowerCase();
      const itemIdStr = String(nftData.itemId || nftData.tokenId || id);
      try {
        const [trades, analyticsRes] = await Promise.all([
          nftAPI.getNftTrades(net, itemIdStr),
          nftAPI.getNftAnalyticsByTrades(net, itemIdStr, '7d').catch(() => null),
        ]);
        setTradeData(Array.isArray(trades) ? trades : []);
        setAnalytics(analyticsRes || null);
        if (analyticsRes?.priceHistory?.length) {
          setPriceData(analyticsRes.priceHistory.map((p, i) => ({
            time: p.date ? new Date(p.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : `${i}`,
            price: Number(p.price),
            volume: Number(p.volume) || 0,
          })));
        } else {
          setPriceData(generateFallbackPriceData(parseFloat(nftData.lastPrice || nftData.price) || 1.5));
        }
      } catch (_) {
        setPriceData(generateFallbackPriceData(parseFloat(nftData.price) || 1.5));
        setTradeData([]);
      }

      // Track NFT view (best-effort)
      try {
        const userWallet =
          localStorage.getItem('walletAddress') ||
          (typeof window !== 'undefined' && window.ethereum?.selectedAddress) ||
          null;
        await engagementAPI.trackNFTView(
          nftData._id || nftData.id || id,
          nftData.itemId,
          nftData.contractAddress || nftData.nftContract || null,
          nftData.network || 'ethereum',
          userWallet
        );
        setViews((prev) => prev + 1);
      } catch (viewErr) {
        console.warn('Failed to track NFT view:', viewErr?.message || viewErr);
      }
    } catch (err) {
      console.error('Error fetching NFT details:', err);
      setError('Failed to load NFT details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!nft) return;

    const userWallet =
      localStorage.getItem('walletAddress') ||
      (typeof window !== 'undefined' && window.ethereum?.selectedAddress) ||
      null;

    if (!userWallet) {
      // Fallback: local toggle only
      setLiked((prev) => !prev);
      return;
    }

    try {
      if (liked) {
        await engagementAPI.unlikeNFT(
          nft._id || nft.id || id,
          nft.network || 'ethereum',
          userWallet
        );
        setLikes((prev) => Math.max(0, prev - 1));
      } else {
        await engagementAPI.likeNFT(
          nft._id || nft.id || id,
          nft.itemId,
          nft.contractAddress || nft.nftContract || null,
          nft.network || 'ethereum',
          userWallet
        );
        setLikes((prev) => prev + 1);
      }
      setLiked((prev) => !prev);
    } catch (err) {
      console.error('Failed to toggle like:', err);
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

      <main className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 py-4 xs:py-6 sm:py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-4 xs:mb-5 sm:mb-6 transition-colors text-sm xs:text-base"
        >
          <FiArrowLeft /> Go Back
        </button>

        {/* NFT Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-5 sm:gap-6 md:gap-8">
          {/* Left: NFT Image */}
          <div className="flex flex-col">
            <div className="bg-gray-900 rounded-xl overflow-hidden mb-3 xs:mb-4 border border-gray-800">
              <img
                src={nft.image || nft.imageURL}
                alt={nft.name}
                className="w-full h-48 xs:h-64 sm:h-80 md:h-96 object-cover"
              />
            </div>

            {/* NFT Stats */}
            <div className="grid grid-cols-3 gap-2 xs:gap-3">
              <div className="bg-gray-800/50 rounded-lg p-2 xs:p-3 sm:p-4">
                <div className="flex items-center gap-1 xs:gap-2 text-gray-400 text-xs xs:text-sm mb-1 xs:mb-2">
                  <FiEye className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span className="hidden xs:inline">Views</span>
                </div>
                <div className="text-base xs:text-lg sm:text-xl font-bold">{(views || 0).toLocaleString()}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 xs:p-3 sm:p-4">
                <div className="flex items-center gap-1 xs:gap-2 text-gray-400 text-xs xs:text-sm mb-1 xs:mb-2">
                  <FiHeart className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span className="hidden xs:inline">Likes</span>
                </div>
                <div className="text-base xs:text-lg sm:text-xl font-bold">{(likes || 0).toLocaleString()}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 xs:p-3 sm:p-4">
                <div className="flex items-center gap-1 xs:gap-2 text-gray-400 text-xs xs:text-sm mb-1 xs:mb-2">
                  <FiDollarSign className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span className="hidden xs:inline">Price</span>
                </div>
                <div className="text-base xs:text-lg sm:text-xl font-bold">
                  {nft.price ? (
                    <>
                      {parseFloat(nft.price).toFixed(4)}{' '}
                      {getCurrencySymbol(nft.network || 'ethereum')}
                    </>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: NFT Info */}
          <div>
            {/* Header */}
            <div className="mb-4 xs:mb-5 sm:mb-6">
              <div className="flex items-start justify-between mb-3 xs:mb-4 gap-2 xs:gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-1 xs:mb-2 break-words">{nft.name}</h1>
                  {nft.collection && (
                    <Link
                      to={`/collection/${nft.collection}`}
                      className="text-purple-400 hover:text-purple-300 transition-colors text-sm xs:text-base"
                    >
                      {nft.collection} →
                    </Link>
                  )}
                </div>
                <div className="flex gap-1.5 xs:gap-2 flex-shrink-0">
                  <button className="p-2 xs:p-2.5 sm:p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors" title="Share">
                    <FiShare2 className="w-4 h-4 xs:w-5 xs:h-5" />
                  </button>
                  <button
                    onClick={handleToggleLike}
                    className="p-2 xs:p-2.5 sm:p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Like"
                  >
                    <FiHeart className={`w-4 h-4 xs:w-5 xs:h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
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
                {nft.metadataURI && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-400 shrink-0">Metadata (EIP-721)</span>
                    <a
                      href={nft.metadataURI.startsWith("http") ? nft.metadataURI : `https://ipfs.io/ipfs/${nft.metadataURI.replace(/^ipfs:\/\//, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-blue-400 hover:underline truncate max-w-[180px]"
                      title={nft.metadataURI}
                    >
                      {nft.metadataURI.slice(0, 24)}…
                    </a>
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
                    <span className="font-bold text-lg">
                      {parseFloat(nft.price).toFixed(4)}{' '}
                      {getCurrencySymbol(nft.network || 'ethereum')}
                    </span>
                  </div>
                )}
                {((nft.pieces != null && nft.pieces > 1) || (nft.remainingPieces != null)) && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stock</span>
                    <span className="font-semibold">
                      {Number(nft.remainingPieces ?? nft.pieces ?? 0)} / {Number(nft.pieces ?? 1)} pieces
                      {(nft.remainingPieces === 0 || (nft.remainingPieces != null && nft.remainingPieces <= 0)) && (
                        <span className="ml-2 text-red-400 text-sm">Sold Out</span>
                      )}
                    </span>
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

            {/* Action Buttons: Sold Out when no pieces; Sell when owner; Buy/Mint when non-owner and pieces left */}
            <div className="space-y-3">
              {(() => {
                const remainingPieces = nft.remainingPieces ?? nft.pieces ?? 0;
                const hasPieces = Number(remainingPieces) > 0;
                const isOwner = address && nft.owner && (address.toLowerCase() === nft.owner.toLowerCase());
                const mintId = nft.itemId ?? nft._id ?? id;
                if (!hasPieces) {
                  return (
                    <>
                      <button disabled className="w-full bg-gray-600 text-gray-400 font-semibold py-3 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                        Sold Out
                      </button>
                      <button onClick={() => setOfferModalOpen(true)} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <FiDollarSign /> Make Offer
                      </button>
                    </>
                  );
                }
                if (isOwner) {
                  return (
                    <button onClick={() => setSellModalOpen(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <FiDollarSign /> Sell
                    </button>
                  );
                }
                return (
                  <button onClick={() => navigate(`/mint/${mintId}`)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <FiDollarSign /> Mint
                  </button>
                );
              })()}
              {!address ? null : (() => {
                const cartNftId = getCartNftId ? getCartNftId(nft) : (nft.itemId ?? nft.tokenId);
                const inCart = isInCart(cartNftId, nft.contractAddress ?? nft.nftContract);
                return (
                  <button
                    onClick={inCart ? undefined : async () => {
                      try {
                        await addToCart(nft, address);
                      } catch (e) {
                        toast.error(e.message || 'Could not add to cart');
                      }
                    }}
                    disabled={inCart}
                    className={`w-full font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${inCart ? 'bg-gray-600 text-gray-400 cursor-default' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                  >
                    <FiShoppingCart /> {inCart ? 'In cart' : 'Add to cart'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Market Analytics & Price Chart Section */}
        <div className="mt-6 xs:mt-8 sm:mt-10 md:mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-8">
            {/* Left: Market Analytics */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 xs:p-5 sm:p-6">
                <h2 className="text-lg xs:text-xl font-bold mb-4 xs:mb-5 sm:mb-6 flex items-center gap-2">
                  <FiBarChart2 className="text-purple-400 w-4 h-4 xs:w-5 xs:h-5" />
                  Market Analytics
                </h2>

                {/* Last Price & Price Movement */}
                <div className="mb-4 xs:mb-5 sm:mb-6 pb-4 xs:pb-5 sm:pb-6 border-b border-gray-700">
                  <div className="text-xs xs:text-sm text-gray-400 mb-1 xs:mb-2">Last Price</div>
                  <div className="flex items-end gap-2">
                    <div className="text-xl xs:text-2xl font-bold text-green-400">
                      {parseFloat(nft.lastPrice || nft.floorPrice || nft.price || 0).toFixed(4)}{' '}
                      {getCurrencySymbol(nft.network || 'ethereum')}
                    </div>
                    {analytics?.priceChangePercent != null && (
                      <div className={`flex items-center gap-1 text-xs xs:text-sm mb-1 ${parseFloat(analytics.priceChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(analytics.priceChangePercent) >= 0 ? <FiTrendingUp className="w-3 h-3 xs:w-4 xs:h-4" /> : <FiTrendingDown className="w-3 h-3 xs:w-4 xs:h-4" />}
                        {parseFloat(analytics.priceChangePercent) >= 0 ? '+' : ''}{analytics.priceChangePercent}%
                      </div>
                    )}
                  </div>
                  {(nft.lastPrice || nft.price) && (
                    <div className="mt-1 text-xs text-gray-400">
                      ≈ $
                      {getUsdValueFromCrypto(
                        nft.lastPrice || nft.price,
                        nft.network || 'ethereum'
                      ).toFixed(2)}{' '}
                      USD
                    </div>
                  )}
                </div>

                {/* Market Cap & Volume (from trades — liquidity in/out) */}
                <div className="mb-4 xs:mb-5 sm:mb-6 pb-4 xs:pb-5 sm:pb-6 border-b border-gray-700">
                  <div className="text-xs xs:text-sm text-gray-400 mb-2 xs:mb-3">Market Data</div>
                  <div className="space-y-2 xs:space-y-3">
                    <div className="flex justify-between items-center text-xs xs:text-sm">
                      <span className="text-gray-400">Market Cap</span>
                      <span className="font-semibold">
                        {nft.marketCap ? parseFloat(nft.marketCap).toFixed(4) : '—'}{' '}
                        {getCurrencySymbol(nft.network || 'ethereum')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs xs:text-sm">
                      <span className="text-gray-400">24h Volume</span>
                      <span className="font-semibold">
                        {analytics?.volume24h != null ? parseFloat(analytics.volume24h).toFixed(4) : (nft.volume24h ? parseFloat(nft.volume24h).toFixed(4) : '0')}{' '}
                        {getCurrencySymbol(nft.network || 'ethereum')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs xs:text-sm">
                      <span className="text-gray-400">Trades</span>
                      <span className="font-semibold">{analytics?.tradesCount ?? tradeData.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs xs:text-sm">
                      <span className="text-gray-400">Pieces</span>
                      <span className="font-semibold">{Number(nft.remainingPieces ?? nft.pieces ?? 0)} / {Number(nft.pieces ?? 1)}</span>
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
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 xs:p-5 sm:p-6 mb-4 xs:mb-5 sm:mb-6">
                <h2 className="text-lg xs:text-xl font-bold mb-3 xs:mb-4 flex items-center gap-2">
                  <FiTrendingUp className="text-blue-400 w-4 h-4 xs:w-5 xs:h-5" />
                  Price Movement (24h)
                </h2>
                <ResponsiveContainer width="100%" height={200} className="!h-48 xs:!h-56 sm:!h-64 md:!h-72 lg:!h-80">
                  <LineChart data={priceData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#666" style={{ fontSize: '10px' }} />
                    <YAxis stroke="#666" style={{ fontSize: '10px' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #666', fontSize: '12px' }}
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

              {/* Transaction History (from blockchain-style trades — liquidity in/out) */}
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 xs:p-5 sm:p-6">
                <h2 className="text-lg xs:text-xl font-bold mb-3 xs:mb-4 flex items-center gap-2">
                  <FiUser className="text-green-400 w-4 h-4 xs:w-5 xs:h-5" />
                  Transaction History
                </h2>
                <div className="space-y-2 xs:space-y-3">
                  {tradeData.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4 text-center">No trades yet. Buy/sell activity will appear here.</p>
                  ) : (
                    tradeData.map((trade, i) => (
                      <div key={trade._id || trade.transactionHash || i} className="flex items-center justify-between p-2 xs:p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors gap-2">
                        <div className="flex items-center gap-2 xs:gap-3 flex-1 min-w-0">
                          <div className="px-2 xs:px-3 py-0.5 xs:py-1 rounded-lg text-[10px] xs:text-xs font-semibold flex-shrink-0 bg-green-500/20 text-green-400">
                            Buy
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs xs:text-sm font-medium text-gray-300 truncate" title={trade.buyer}>
                              {trade.buyer?.slice(0, 6)}...{trade.buyer?.slice(-4)}
                            </div>
                            <div className="text-[10px] xs:text-xs text-gray-500">
                              {trade.createdAt ? new Date(trade.createdAt).toLocaleString() : ''}
                              {trade.transactionHash && (
                                <a
                                  href={`https://${nft?.network === 'polygon' ? 'polygonscan' : 'etherscan'}.com/tx/${trade.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 text-purple-400 hover:underline"
                                >
                                  Tx
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs xs:text-sm font-semibold text-white">
                            {parseFloat(trade.pricePerPiece || 0).toFixed(4)} {getCurrencySymbol(nft?.network || 'ethereum')}
                          </div>
                          <div className="text-[10px] xs:text-xs text-gray-400">x{trade.quantity}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Buy / Make Offer Modal */}
      <OfferModal isOpen={offerModalOpen} onClose={() => setOfferModalOpen(false)} nft={nft} />
      {/* Sell Modal – list for sale (owner only) */}
      <SellModal isOpen={sellModalOpen} onClose={() => setSellModalOpen(false)} nft={nft} />
    </div>
  );
};

export default NftDetailsPage;
