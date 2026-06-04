﻿import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiShare2, FiHeart, FiEye, FiDollarSign, FiCheckCircle, FiTrendingUp, FiTrendingDown, FiUser, FiBarChart2, FiShoppingCart } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../components/Header';
import OfferModal from '../components/OfferModal';
import SellModal from '../components/SellModal';
import BuyModal from '../components/BuyModal';
import { ethers } from 'ethers';
import { nftAPI, engagementAPI, userAPI, marketplaceAPI, aggregationAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { getCurrencySymbol, getUsdValueFromCrypto, shortenAddress, changeNetwork } from '../Context/constants';
import { ICOContent } from '../Context';
import { useCart } from '../Context/CartContext';
import { useMarketplace } from '../hooks/useMarketplace';
import toast from 'react-hot-toast';
import { resolveIpfsUrl } from '../utils/ipfsUrl';

const NftDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address } = useContext(ICOContent);
  const { addToCart, isInCart, getCartNftId } = useCart();
  const { executeSale } = useMarketplace();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [priceData, setPriceData] = useState([]);
  const [tradeData, setTradeData] = useState([]);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedMarketplaceListing, setSelectedMarketplaceListing] = useState(null);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [rarity, setRarity] = useState(null);
  const [creatorDisplayName, setCreatorDisplayName] = useState(null);
  const [externalListings, setExternalListings] = useState([]);
  const [marketplaceListings, setMarketplaceListings] = useState([]);

  useEffect(() => {
    fetchNftDetails();
  }, [id]);

  useEffect(() => {
    if (nft) {
      fetchMarketplaceListings();
    }
  }, [nft]);

  // Socket-driven refresh: refresh details when relevant activity occurs
  useEffect(() => {
    const socket = getSocket();
    const handler = (payload) => {
      if (!payload) return;
      const itemIdStr = String(nft?.itemId || nft?.tokenId || id);
      const payloadItem = payload.itemId ? String(payload.itemId) : null;
      const wallets = [payload.wallet, payload.buyer, payload.seller, payload.to, payload.from].filter(Boolean).map(w=>String(w).toLowerCase());
      if (payloadItem === itemIdStr || (address && wallets.includes(address.toLowerCase()))) {
        fetchNftDetails();
      }
    };
    socket.on('user_activity_update', handler);
    return () => socket.off('user_activity_update', handler);
  }, [nft, id, address]);

  // Resolve creator wallet to display name (no address shown)
  useEffect(() => {
    const wallet = nft?.creator || nft?.creatorWallet;
    if (!wallet) {
      setCreatorDisplayName(null);
      return;
    }
    userAPI.getUserProfile(wallet)
      .then((p) => setCreatorDisplayName(p?.userName || p?.creatorName || p?.username || 'Creator'))
      .catch(() => setCreatorDisplayName('Creator'));
  }, [nft?.creator, nft?.creatorWallet]);

  // Live refresh: trades, analytics, rarity (for charts, market cap, trade count, rarity rank)
  const REFRESH_MS = 25000;
  useEffect(() => {
    if (!nft) return;
    const net = (nft.network || 'ethereum').toLowerCase();
    const itemIdStr = String(nft.itemId || nft.tokenId || id);
    const refresh = async () => {
      try {
        const [trades, analyticsRes, rarityRes] = await Promise.all([
          nftAPI.getNftTrades(net, itemIdStr),
          nftAPI.getNftAnalyticsByTrades(net, itemIdStr, '7d').catch(() => null),
          nftAPI.getNftRarityRank(net, itemIdStr).catch(() => null),
        ]);
        setTradeData(Array.isArray(trades) ? trades : []);
        setAnalytics(analyticsRes || null);
        setRarity(rarityRes || null);
        if (analyticsRes?.priceHistory?.length) {
          setPriceData(analyticsRes.priceHistory.map((p, i) => ({
            time: p.date ? new Date(p.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : `${i}`,
            price: Number(p.price),
            volume: Number(p.volume) || 0,
          })));
        }
      } catch (_) {}
    };
    const interval = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(interval);
  }, [nft, id]);

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

      // The id parameter could be: itemId, tokenId, or _id (including lazy-mint MongoDB _id)
      let nftData = null;

      // 1. Try by-id endpoint first (finds lazy-mint by _id even when sold out / redeemed)
      if (id && String(id).trim()) {
        try {
          const byId = await nftAPI.getNftByAnyId(id);
          if (byId) {
            nftData = byId;
          }
        } catch (byIdErr) {
          // 404 or other; fall through to network loop
        }
      }

      // 2. Fallback: single all-networks query, then find by itemId/tokenId/_id
      if (!nftData) {
        const allNfts = await nftAPI.getAllNftsAllNetworksForExplore(500);
        const found = allNfts?.find((n) =>
          n.itemId === id || n.tokenId === id || (n._id && String(n._id) === String(id))
        );
        nftData = found || null;
      }

      if (!nftData) {
        setError('NFT not found. It may have been delisted or removed.');
        setLoading(false);
        return;
      }

      setNft(nftData);
      setViews(nftData.views || 0);
      setLikes(nftData.likes || 0);

      const net = (nftData.network || 'ethereum').toLowerCase();
      const itemIdStr = String(nftData.itemId || nftData.tokenId || id);

      // Fire-and-forget aggregator lookup â€" never blocks page render.
      // Only meaningful for NFTs with both a contract address and tokenId.
      const aggContract = nftData.contractAddress || nftData.nftContract;
      if (aggContract && nftData.tokenId) {
        aggregationAPI.getExternalListings({
          chain: net,
          contract: aggContract,
          tokenId: nftData.tokenId,
        }).then((listings) => setExternalListings(listings || []))
          .catch(() => setExternalListings([]));
      }
      try {
        const [trades, analyticsRes, rarityRes] = await Promise.all([
          nftAPI.getNftTrades(net, itemIdStr),
          nftAPI.getNftAnalyticsByTrades(net, itemIdStr, '7d').catch(() => null),
          nftAPI.getNftRarityRank(net, itemIdStr).catch(() => null),
        ]);
        setTradeData(Array.isArray(trades) ? trades : []);
        setAnalytics(analyticsRes || null);
        setRarity(rarityRes || null);
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

  const fetchMarketplaceListings = async () => {
    if (!nft) return;

    try {
      // Fetch marketplace listings for this NFT
      const listings = await marketplaceAPI.getListings({
        nftContract: nft.contractAddress || nft.nftContract,
        tokenId: nft.tokenId || id,
        limit: 10
      });
      setMarketplaceListings(listings.listings || []);
    } catch (error) {
      console.error('Failed to fetch marketplace listings:', error);
      setMarketplaceListings([]);
    }
  };

  const handleMarketplaceBuy = (listing) => {
    setSelectedMarketplaceListing(listing);
    setBuyModalOpen(true);
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
      <div className="min-h-screen" style={{ background: 'var(--c-void)' }}>
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="text-ink-400 text-sm animate-pulse">Loading NFT...</p>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--c-void)' }}>
        <Header />
        <main className="page-container py-12">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 text-sm font-medium transition-colors">
            <FiArrowLeft size={16} /> Go Back
          </button>
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-raised border border-border flex items-center justify-center mx-auto mb-6">
              <FiArrowLeft size={28} className="text-ink-600 rotate-[135deg]" />
            </div>
            <h2 className="text-2xl font-bold text-ink-100 mb-3">{error || 'NFT Not Found'}</h2>
            <p className="text-ink-400 mb-8">The NFT you're looking for doesn't exist or has been removed.</p>
            <Link to="/explore" className="btn-primary gap-2 inline-flex">
              Browse Marketplace →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-void)' }}>
      <Header />

      <main className="page-container py-6 md:py-10">
        {/* Back Button */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-ink-400 hover:text-ink-100 mb-6 text-sm font-medium
                     transition-colors">
          <FiArrowLeft size={16} /> Back
        </button>

        {/* NFT Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-10">
          {/* Left: Image + mini stats */}
          <div className="flex flex-col gap-4">
            <div className="card overflow-hidden">
              <div className="relative aspect-square bg-raised">
                <img
                  src={resolveIpfsUrl(nft.image || nft.imageURL)}
                  alt={nft.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Mini stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: FiEye,       label: 'Views',  value: (views||0).toLocaleString() },
                { icon: FiHeart,     label: 'Likes',  value: (likes||0).toLocaleString() },
                { icon: FiBarChart2, label: 'Volume', value: analytics?.volume24h ? `${Number(analytics.volume24h).toFixed(2)}Ξ` : '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="stat-card text-center">
                  <Icon className="w-4 h-4 text-cyan-400 mx-auto mb-2" />
                  <p className="stat-value text-lg">{value}</p>
                  <p className="stat-label">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* â"€â"€ Right: Info + actions â"€â"€ */}
          <div>
            {/* Header row */}
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex-1 min-w-0">
                {nft.collection && (
                  <Link to={`/collection/${nft.collection}`}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium mb-2 flex items-center gap-1 transition-colors">
                    {nft.collection} <FiArrowLeft className="rotate-180" size={11} />
                  </Link>
                )}
                <h1 className="text-2xl md:text-3xl font-extrabold text-ink-100 break-words mb-1">
                  {nft.name}
                </h1>
                {nft.network && (
                  <span className="badge-cyan text-xs capitalize mt-2 inline-flex">{nft.network}</span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleToggleLike}
                  className={`btn-icon transition-all duration-200
                    ${liked ? 'bg-red-500/15 text-red-400' : 'text-ink-400 hover:text-red-400'}`}
                  title="Like">
                  <FiHeart className={liked ? 'fill-current' : ''} size={18} />
                </button>
                <button className="btn-icon text-ink-400 hover:text-ink-100" title="Share">
                  <FiShare2 size={18} />
                </button>
              </div>
            </div>

            {/* Description */}
            {nft.description && (
              <div className="mb-5">
                <p className="section-label mb-2">Description</p>
                <p className="text-ink-300 text-sm leading-relaxed">{nft.description}</p>
              </div>
            )}

            {/* Also available on (external marketplaces) */}
            {externalListings.length > 0 && (
              <div className="card p-4 mb-5">
                <p className="section-label mb-3">Also Listed On</p>
                <div className="space-y-2">
                  {externalListings.slice(0, 5).map((l, i) => {
                    const priceEth = (() => {
                      try { return ethers.utils.formatEther(String(l.priceWei || '0')); }
                      catch { return l.priceWei; }
                    })();
                    const sourceLabel = {
                      opensea: 'OpenSea', blur: 'Blur', magiceden: 'Magic Eden',
                    }[l.source] || l.source;
                    return (
                      <a key={i} href={l.externalUrl || '#'} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-2xl bg-raised hover:bg-border
                                   transition-colors group">
                        <div className="flex items-center gap-3">
                          <span className="badge-violet text-[10px] uppercase">{sourceLabel}</span>
                          <span className="text-xs text-ink-500 font-mono">{shortenAddress(l.seller)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-ink-100">{Number(priceEth).toFixed(4)} Ξ</span>
                          <FiArrowLeft className="text-ink-600 group-hover:text-ink-200 rotate-180" size={14} />
                        </div>
                      </a>
                    );
                  })}
                </div>
                {externalListings.length > 5 && (
                  <div className="text-xs text-ink-500 mt-2">+ {externalListings.length - 5} more</div>
                )}
              </div>
            )}

            {/* Details */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-ink-400 mb-4">DETAILS</h3>
              <div className="space-y-3">
                {nft.itemId && (
                  <div className="flex justify-between">
                    <span className="text-ink-400">Item ID</span>
                    <span className="font-mono text-ink-200">{nft.itemId}</span>
                  </div>
                )}
                {nft.network && (
                  <div className="flex justify-between">
                    <span className="text-ink-400">Network</span>
                    <span className="font-semibold capitalize">{nft.network}</span>
                  </div>
                )}
                {nft.metadataURI && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-ink-400 shrink-0">Metadata (EIP-721)</span>
                    <a
                      href={nft.metadataURI.startsWith("http") ? nft.metadataURI : `https://ipfs.io/ipfs/${nft.metadataURI.replace(/^ipfs:\/\//, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-blue-400 hover:underline truncate max-w-[180px]"
                      title={nft.metadataURI}
                    >
                      {nft.metadataURI.slice(0, 24)}...
                    </a>
                  </div>
                )}
                {(nft.creator || nft.creatorWallet) && (
                  <div className="flex justify-between items-center">
                    <span className="text-ink-400">Creator</span>
                    <Link
                      to={`/creator/${nft.creator || nft.creatorWallet}`}
                      className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer">
                      {creatorDisplayName ?? '...'}
                    </Link>
                  </div>
                )}
                {nft.category && (
                  <div className="flex justify-between">
                    <span className="text-ink-400">Category</span>
                    <span className="font-semibold capitalize">{nft.category}</span>
                  </div>
                )}
                {nft.price && (
                  <div className="flex justify-between items-center">
                    <span className="text-ink-400 text-sm">Price</span>
                    <span className="font-bold text-lg text-ink-100">
                      {parseFloat(nft.price) > 1e9
                        ? (parseFloat(nft.price)/1e18).toFixed(4)
                        : parseFloat(nft.price).toFixed(4)
                      } {getCurrencySymbol(nft.network || 'ethereum')}
                    </span>
                  </div>
                )}
                {((nft.pieces != null && nft.pieces > 1) || (nft.remainingPieces != null)) && (
                  <div className="flex justify-between items-center">
                    <span className="text-ink-400 text-sm">Editions</span>
                    <span className="font-semibold text-ink-100 text-sm">
                      {Number(nft.remainingPieces ?? nft.pieces ?? 0)} / {Number(nft.pieces ?? 1)} remaining
                      {(nft.remainingPieces === 0 || (nft.remainingPieces != null && nft.remainingPieces <= 0)) && (
                        <span className="ml-2 badge-red">Minted Out</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Properties / Traits */}
            {nft.properties && Object.keys(nft.properties).length > 0 && (
              <div className="mb-5">
                <p className="section-label mb-3">Traits</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(nft.properties).map(([key, value]) => (
                    <div key={key} className="bg-raised rounded-2xl p-3 border border-border">
                      <p className="text-[10px] text-cyan-400 uppercase font-semibold mb-1 tracking-wide">{key}</p>
                      <p className="text-sm font-semibold text-ink-100">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {(() => {
                const remainingPieces = nft.remainingPieces ?? nft.pieces ?? 0;
                const hasPieces = Number(remainingPieces) > 0;
                const isOwner = address && nft.owner && (address.toLowerCase() === nft.owner.toLowerCase());
                const mintId = nft.itemId ?? nft._id ?? id;
                if (!hasPieces) {
                  return (
                    <>
                      <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed justify-center py-3">
                        Minted Out
                      </button>
                      <button onClick={() => setOfferModalOpen(true)}
                        className="btn-secondary w-full justify-center py-3 gap-2">
                        <FiDollarSign /> Make Offer
                      </button>
                      {marketplaceListings.length > 0 && (
                        <button onClick={() => setBuyModalOpen(true)}
                          className="btn-primary w-full justify-center py-3 gap-2">
                          <FiDollarSign /> Buy from Owner
                        </button>
                      )}
                    </>
                  );
                }
                if (isOwner) {
                  const totalPieces = Number(nft?.pieces ?? nft?.supply ?? 1) || 1;
                  const remPieces = Number(nft?.remainingPieces ?? 0);
                  const primarySaleComplete = totalPieces <= 1 || remPieces <= 0;
                  if (!primarySaleComplete) {
                    return (
                      <div className="card p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-ink-400 text-sm mb-1">
                          <FiDollarSign /> Resale locked
                        </div>
                        <p className="text-xs text-ink-600">{remPieces} of {totalPieces} editions still unminted</p>
                      </div>
                    );
                  }
                  return (
                    <button onClick={() => setSellModalOpen(true)}
                      className="btn-primary w-full justify-center py-3.5 gap-2">
                      <FiDollarSign /> List for Sale
                    </button>
                  );
                }
                return (
                  <button onClick={() => navigate(`/mint/${mintId}`)}
                    className="btn-primary w-full justify-center py-3.5 gap-2">
                    <FiDollarSign /> Mint Now
                  </button>
                );
              })()}
              {!address ? null : (() => {
                const cartNftId = getCartNftId ? getCartNftId(nft) : (nft.itemId ?? nft.tokenId);
                const inCart = isInCart(cartNftId, nft.contractAddress ?? nft.nftContract);
                return (
                  <button
                    onClick={inCart ? undefined : async () => {
                      try { await addToCart(nft, address); }
                      catch (e) { toast.error(e.message || 'Could not add to cart'); }
                    }}
                    disabled={inCart}
                    className={`btn-secondary w-full justify-center py-3 gap-2
                      ${inCart ? 'opacity-50 cursor-default border-cyan-400/30 text-cyan-400' : ''}`}>
                    <FiShoppingCart /> {inCart ? 'In Cart' : 'Add to Cart'}
                  </button>
                );
              })()}

              {/* Marketplace Listings */}
              {marketplaceListings.length > 0 && (
                <div className="divider">
                  <p className="section-label mb-3">Listings</p>
                  <div className="space-y-2">
                    {marketplaceListings.slice(0, 3).map((listing) => (
                      <div key={listing._id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-raised border border-border">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            listing.listingType === 'auction' ? 'bg-cyan-400' : 'bg-emerald-400'
                          }`} />
                          <div>
                            <p className="text-sm font-bold text-ink-100">
                              {listing.price} {getCurrencySymbol(listing.network)}
                            </p>
                            <p className="text-xs text-ink-400 capitalize">
                              {listing.listingType}
                              {listing.listingType === 'auction' && listing.endTime && (
                                <span className="ml-1">
                                  Â· Ends {new Date(listing.endTime * 1000).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => handleMarketplaceBuy(listing)}
                          className="btn-primary btn-sm">
                          Buy
                        </button>
                      </div>
                    ))}
                    {marketplaceListings.length > 3 && (
                      <button onClick={() => navigate('/marketplace')}
                        className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 py-2">
                        View all {marketplaceListings.length} listings â†’
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Marketplace Actions */}
              <div className="border-t border-border pt-4 mt-4 space-y-2">
                <button
                  onClick={() => navigate('/marketplace')}
                  className="w-full bg-raised hover:bg-gray-600 text-ink-200 hover:text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FiShoppingCart className="text-sm" /> Browse Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Market Analytics & Price Chart Section */}
        <div className="mt-6 xs:mt-8 sm:mt-10 md:mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-8">
            {/* Left: Market Analytics */}
            <div className="lg:col-span-1">
              <div className="card p-5">
                <h2 className="text-base font-bold text-ink-100 mb-5 flex items-center gap-2">
                  <FiBarChart2 className="text-cyan-400" />
                  Market Analytics
                </h2>

                {/* Last Price */}
                <div className="mb-5 pb-5 divider">
                  <p className="text-xs text-ink-400 mb-1">Last Price</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-extrabold text-ink-100">
                      {parseFloat(nft.lastPrice || nft.floorPrice || nft.price || 0).toFixed(4)}
                      <span className="text-base text-ink-400 font-normal ml-1">
                        {getCurrencySymbol(nft.network || 'ethereum')}
                      </span>
                    </p>
                    {analytics?.priceChangePercent != null && (
                      <div className={`flex items-center gap-1 text-sm mb-0.5 font-semibold
                        ${parseFloat(analytics.priceChangePercent) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {parseFloat(analytics.priceChangePercent) >= 0 ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                        {parseFloat(analytics.priceChangePercent) >= 0 ? '+' : ''}{analytics.priceChangePercent}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Market data */}
                <div className="mb-5 pb-5 divider space-y-3">
                  {[
                    ['Market Cap',  (() => { const c = nft.marketCap ? parseFloat(nft.marketCap) : analytics?.marketCap; return c ? c.toFixed(4) + ' ' + getCurrencySymbol(nft.network) : '—'; })()],
                    ['24h Volume',  (analytics?.volume24h != null ? parseFloat(analytics.volume24h).toFixed(4) : '0') + ' ' + getCurrencySymbol(nft.network)],
                    ['Trades',      String(analytics?.tradesCount ?? tradeData.length)],
                    ['Editions',    `${Number(nft.remainingPieces ?? nft.pieces ?? 0)} / ${Number(nft.pieces ?? 1)}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="text-ink-400">{label}</span>
                      <span className="font-semibold text-ink-100">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Rarity */}
                <div>
                  <p className="text-xs text-ink-400 mb-3">Rarity Rank</p>
                  <div className="gradient-border rounded-2xl p-4 text-center"
                    style={{ background: 'linear-gradient(135deg,rgba(0,200,255,0.06),rgba(124,58,237,0.06))' }}>
                    <p className="text-3xl font-extrabold text-gradient mb-1">
                      #{rarity?.rarityRank ?? '—'}
                      {rarity?.totalInCollection > 0 && (
                        <span className="text-base font-normal text-ink-400 ml-1">/ {rarity.totalInCollection}</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-400">Score: {(rarity?.rarityScore ?? rarity?.rankingScore ?? '—')}/100</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Price Chart & Trading Activity */}
            <div className="lg:col-span-2">
              {/* Price Movement Chart (live from trades) */}
              <div className="bg-gray-900/50 rounded-2xl border border-border p-4 xs:p-5 sm:p-6 mb-4 xs:mb-5 sm:mb-6">
                <h2 className="text-lg xs:text-xl font-bold mb-3 xs:mb-4 flex items-center gap-2">
                  <FiTrendingUp className="text-blue-400 w-4 h-4 xs:w-5 xs:h-5" />
                  Price Movement
                  <span className="text-xs font-normal text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                  </span>
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

              {/* Transaction History (from blockchain-style trades â€" liquidity in/out) */}
              <div className="bg-gray-900/50 rounded-2xl border border-border p-4 xs:p-5 sm:p-6">
                <h2 className="text-lg xs:text-xl font-bold mb-3 xs:mb-4 flex items-center gap-2">
                  <FiUser className="text-green-400 w-4 h-4 xs:w-5 xs:h-5" />
                  Transaction History
                </h2>
                <div className="space-y-2 xs:space-y-3">
                  {tradeData.length === 0 ? (
                    <p className="text-ink-500 text-sm py-8 text-center">No trades yet</p>
                  ) : (
                    tradeData.map((trade, i) => {
                      const isSell = trade.transactionType === 'secondary_sell_to_liquidity';
                      const actor = isSell ? trade.seller : trade.buyer;
                      return (
                      <div key={trade._id || trade.transactionHash || i}
                        className="flex items-center justify-between px-4 py-3 rounded-2xl
                                   hover:bg-raised transition-colors gap-3 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex-shrink-0 ${isSell ? 'badge-gold' : 'badge-green'}`}>
                            {isSell ? 'Sell' : 'Buy'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs xs:text-sm font-medium text-ink-200 truncate" title={actor}>
                              {actor ? `${actor.slice(0, 6)}...${actor.slice(-4)}` : (isSell ? 'Liquidity' : 'â€"')}
                            </div>
                            <div className="text-[10px] xs:text-xs text-ink-500">
                              {trade.createdAt ? new Date(trade.createdAt).toLocaleString() : ''}
                              {trade.transactionHash && (
                                <a
                                  href={`https://${nft?.network === 'polygon' ? 'polygonscan' : 'etherscan'}.com/tx/${trade.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 text-cyan-400 hover:underline"
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
                          <div className="text-[10px] xs:text-xs text-ink-400">x{trade.quantity}</div>
                        </div>
                      </div>
                    ); })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Buy / Make Offer Modal */}
      <OfferModal isOpen={offerModalOpen} onClose={() => setOfferModalOpen(false)} nft={nft} />
      {/* Sell Modal â€" list for sale (owner only) */}
      <SellModal isOpen={sellModalOpen} onClose={() => setSellModalOpen(false)} nft={nft} />
      {/* Marketplace Buy Modal */}
      <BuyModal
        isOpen={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        listing={selectedMarketplaceListing}
      />
    </div>
  );
};

export default NftDetailsPage;

