import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ICOContent } from "../Context";
import { useCart } from "../Context/CartContext";
import { Toaster } from "react-hot-toast";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import Header from "../components/Header";
import Footer from "../FooterComponents/Footer";
import { nftAPI, userAPI, engagementAPI } from "../services/api";
import NFTImageHoverOverlay from "../components/NFTImageHoverOverlay";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FiEdit2, FiTrash2, FiArrowLeft, FiDownload } from "react-icons/fi";
import { getCurrencySymbol } from "../Context/constants";
import toast from "react-hot-toast";

export default function CollectionDetails() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const contexts = useContext(ICOContent);
  const { address } = contexts;
  const { addToCart, isInCart, getCartNftId } = useCart();

  // State
  const [collection, setCollection] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [likedItems, setLikedItems] = useState(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [stats, setStats] = useState({
    floorPrice: 0,
    volume: 0,
    nftCount: 0,
    avgPrice: 0,
    ownerCount: 0
  });
  const [collectionViews, setCollectionViews] = useState(0);
  const [collectionLikes, setCollectionLikes] = useState(0);

  // Single unified fetch function
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch collection details
        console.log('📥 Fetching collection:', collectionId);
        let collection = null;
        
        // Try direct API first
        const collectionData = await nftAPI.getCollection(collectionId);
        
        if (!collectionData || (Array.isArray(collectionData) && collectionData.length === 0)) {
          // Fallback: fetch all collections and find the one matching our ID
          console.log('⚠️ Direct API returned empty, trying getCollections fallback...');
          const allCollections = await nftAPI.getCollections();
          console.log('📋 All collections found:', allCollections.length);
          console.log('🔍 Looking for collectionId:', collectionId);
          
          // Try multiple matching strategies
          collection = allCollections.find(c => 
            String(c.collectionId).toLowerCase() === String(collectionId).toLowerCase()
          );
          
          if (!collection) {
            // Try matching by _id
            collection = allCollections.find(c => 
              String(c._id).toLowerCase() === String(collectionId).toLowerCase()
            );
          }
          
          if (!collection && allCollections.length > 0) {
            // Debug: log first collection structure
            console.log('📊 First collection structure:', allCollections[0]);
            console.log('📊 All collections:', allCollections.map(c => ({ 
              _id: c._id, 
              collectionId: c.collectionId, 
              name: c.name 
            })));
          }
          
          if (!collection) {
            throw new Error("Collection not found");
          }
        } else {
          // Handle if API returns array (shouldn't but just in case)
          collection = Array.isArray(collectionData) ? collectionData[0] : collectionData;
        }

        setCollection(collection);
        setEditData(collection);

        // Initialize engagement counters if present
        setCollectionViews(collection.views || 0);
        setCollectionLikes(collection.likes || 0);

        // Fetch creator profile information
        if (collection?.creatorWallet) {
          try {
            const profile = await userAPI.getUserProfile(collection.creatorWallet);
            if (profile) {
              collection.creatorName = profile.userName || profile.creatorName || collection.creatorName;
              collection.creatorAvatar = profile.profilePicture || profile.creatorAvatar;
            }
          } catch (err) {
            console.warn('Error fetching creator profile:', err.message);
          }
        }

        setCollection(collection);
        setEditData(collection);

        // 2. Check if user is owner
        if (collection?.creatorWallet === address) {
          setIsOwner(true);
        }

        // 3. Fetch NFTs from all networks IN PARALLEL
        console.log('📥 Fetching NFTs for collection:', collectionId);
        const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
        let allNFTs = [];

        const results = await Promise.allSettled(
          networks.map(async (network) => {
            try {
              const networkNfts = await nftAPI.getAllNftsByNetwork(network);
              return networkNfts && Array.isArray(networkNfts) ? networkNfts : [];
            } catch (err) {
              console.warn(`⚠️ Error fetching ${network}:`, err.message);
              return [];
            }
          })
        );

        results.forEach((res) => {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            allNFTs = allNFTs.concat(res.value);
          }
        });

        // ✅ De-duplicate NFTs that may appear under multiple networks
        const uniqueMap = new Map();
        allNFTs.forEach((nft) => {
          const key =
            nft._id ||
            `${nft.network || nft.chain || 'unknown'}-${nft.itemId || nft.tokenId || nft.name || Math.random()}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, nft);
          }
        });
        const uniqueNFTs = Array.from(uniqueMap.values());

        // 4. Filter NFTs by collection ID
        const collectionNFTs = uniqueNFTs.filter(nft => {
          const nftCollection = String(nft.collection || '').toLowerCase();
          const targetId = String(collectionId).toLowerCase();
          return nftCollection === targetId;
        });

        // Sort by creation date
        collectionNFTs.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        setNfts(collectionNFTs);

        // 5. Calculate analytics
        calculateAnalytics(collectionNFTs);

        console.log('✅ Data loaded successfully');
      } catch (error) {
        console.error("❌ Error fetching collection:", error);
        ErrorToast("Failed to load collection details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionId, address]);

  // Track collection view (best-effort, after basic data is loaded)
  useEffect(() => {
    const trackView = async () => {
      if (!collection) return;
      try {
        const userWallet =
          localStorage.getItem('walletAddress') ||
          (typeof window !== 'undefined' && window.ethereum?.selectedAddress) ||
          null;

        await engagementAPI.trackCollectionView(
          collection._id || collection.collectionId || collectionId,
          collection.name,
          collection.network || 'ethereum',
          userWallet
        );
        setCollectionViews((prev) => prev + 1);
      } catch (err) {
        console.warn('Failed to track collection view:', err?.message || err);
      }
    };

    trackView();
  }, [collection, collectionId]);

  const handleToggleCollectionLike = async () => {
    if (!collection) return;
    const userWallet =
      localStorage.getItem('walletAddress') ||
      (typeof window !== 'undefined' && window.ethereum?.selectedAddress) ||
      null;

    if (!userWallet) {
      // No wallet: do nothing server-side, but avoid crashing
      return;
    }

    try {
      const collectionKey = collection._id || collection.collectionId || collectionId;
      const isLiked = likedItems.has(collectionKey);

      if (isLiked) {
        await engagementAPI.unlikeCollection(
          collectionKey,
          collection.network || 'ethereum',
          userWallet
        );
        setCollectionLikes((prev) => Math.max(0, prev - 1));
        const updated = new Set(likedItems);
        updated.delete(collectionKey);
        setLikedItems(updated);
      } else {
        await engagementAPI.likeCollection(
          collectionKey,
          collection.name,
          collection.network || 'ethereum',
          userWallet
        );
        setCollectionLikes((prev) => prev + 1);
        const updated = new Set(likedItems);
        updated.add(collectionKey);
        setLikedItems(updated);
      }
    } catch (err) {
      console.error('Failed to toggle collection like:', err);
    }
  };

  const calculateAnalytics = (nftsList) => {
    if (nftsList.length === 0) {
      console.log('[CollectionDetails] No NFTs in collection');
      setStats({
        floorPrice: 0,
        volume: 0,
        nftCount: 0,
        avgPrice: 0,
        ownerCount: 0
      });
      return;
    }

    // Price per NFT (floorPrice or price); normalize wei to human-readable.
    const pricePerNft = (nft) => {
      const source = nft.floorPrice != null && nft.floorPrice !== '' ? nft.floorPrice : nft.price;
      let value = parseFloat(source || '0');
      if (value > 1000) value = value / 1e18;
      return isNaN(value) || value < 0 ? 0 : value;
    };
    // Pieces per NFT (for volume = price × pieces summed)
    const piecesPerNft = (nft) => Math.max(1, Number(nft.pieces ?? nft.remainingPieces ?? 1) || 1);

    const prices = nftsList.map(pricePerNft).filter(p => p > 0);
    const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    // Total volume = sum of (price × pieces) for each NFT
    const volume = nftsList.reduce((sum, nft) => sum + pricePerNft(nft) * piecesPerNft(nft), 0);
    const uniqueOwners = new Set(nftsList.map(nft => String(nft.owner || '').toLowerCase()).filter(owner => owner));

    console.log('[CollectionDetails] Calculated stats (volume = sum(price×pieces)):', {
      nftCount: nftsList.length,
      floorPrice: floorPrice.toFixed(4),
      avgPrice: avgPrice.toFixed(4),
      totalVolume: volume.toFixed(4),
      uniqueOwners: uniqueOwners.size
    });

    setStats({
      floorPrice: isNaN(floorPrice) ? 0 : floorPrice,
      volume: isNaN(volume) ? 0 : volume,
      nftCount: nftsList.length,
      avgPrice: isNaN(avgPrice) ? 0 : avgPrice,
      ownerCount: uniqueOwners.size
    });
  };

  const handleAddToCart = async (nft) => {
    if (!address) {
      toast.error('Connect your wallet to add to cart');
      return;
    }
    try {
      await addToCart(nft, address);
      SuccessToast("Added to cart");
    } catch (e) {
      toast.error(e.message || 'Could not add to cart');
    }
  };

  const handleLike = (nft) => {
    const newLikes = new Set(likedItems);
    newLikes.add(nft._id);
    setLikedItems(newLikes);
  };

  const handleEditCollection = async () => {
    try {
      await nftAPI.updateCollection(collectionId, editData);
      SuccessToast("Collection updated successfully");
      setShowEditModal(false);
      setCollection(editData);
    } catch (error) {
      ErrorToast("Failed to update collection");
    }
  };

  const handleDeleteCollection = async () => {
    try {
      await nftAPI.deleteCollection(collectionId);
      SuccessToast("Collection deleted successfully");
      navigate("/collections");
    } catch (error) {
      ErrorToast("Failed to delete collection");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--c-void)' }}>
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-ink-400 text-sm animate-pulse">Loading collection…</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--c-void)' }}>
        <Header />
        <div className="page-container py-20 text-center">
          <h2 className="text-2xl font-bold text-ink-100 mb-4">Collection Not Found</h2>
          <button onClick={() => navigate("/collections")} className="btn-primary gap-2">
            <FiArrowLeft /> Back to Collections
          </button>
        </div>
      </div>
    );
  }

  const sym = getCurrencySymbol(collection.network || 'ethereum');
  const collectionKey = collection._id || collection.collectionId || collectionId;
  const isLiked = likedItems.has(collectionKey);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-void)' }}>
      <Header />
      <Toaster />

      {/* ── Banner ── */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden bg-raised">
        {(collection.banner || collection.image) ? (
          <img src={collection.banner || collection.image} alt=""
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full"
            style={{ background: 'linear-gradient(135deg,rgba(192,132,252,0.2),rgba(124,58,237,0.2))' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-void)] via-transparent to-transparent" />
      </div>

      <main className="flex-1 page-container -mt-16 pb-20 relative">
        {/* Back */}
        <button onClick={() => navigate("/collections")}
          className="flex items-center gap-2 text-ink-400 hover:text-ink-100 mb-6 text-sm font-medium transition-colors">
          <FiArrowLeft size={16} /> Collections
        </button>

        {/* ── Collection header ── */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-10">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 bg-raised shrink-0"
            style={{ borderColor: 'var(--c-void)' }}>
            {collection.image ? (
              <img src={collection.image} alt={collection.name}
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl">🖼</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-ink-100 mb-2">
                  {collection.name}
                </h1>
                {collection.description && (
                  <p className="text-ink-300 text-sm leading-relaxed max-w-xl mb-3">
                    {collection.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Creator */}
                  <div className="flex items-center gap-2">
                    <img
                      src={collection.creatorAvatar ||
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${collection.creatorWallet}`}
                      alt="creator"
                      className="w-7 h-7 rounded-full"
                      onError={e => {
                        e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${collection.creatorWallet || collection._id}`;
                      }}
                    />
                    <div>
                      <p className="text-[10px] text-ink-600">Creator</p>
                      <p className="text-xs font-semibold text-ink-200">
                        {collection.creatorName || (collection.creatorWallet
                          ? collection.creatorWallet.slice(0, 6) + '…' + collection.creatorWallet.slice(-4)
                          : 'Unknown')}
                      </p>
                    </div>
                  </div>
                  {collection.network && (
                    <span className="badge-violet capitalize">{collection.network}</span>
                  )}
                  {collection.isVerified && (
                    <span className="badge-green">✓ Verified</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleToggleCollectionLike}
                  className={`btn-secondary gap-2 transition-all
                    ${isLiked ? 'border-red-400/40 text-red-400 bg-red-500/10' : ''}`}>
                  {isLiked ? '♥' : '♡'}
                  <span>{collectionLikes.toLocaleString()}</span>
                </button>
                {isOwner && (
                  <>
                    <button onClick={() => setShowEditModal(true)}
                      className="btn-secondary gap-2">
                      <FiEdit2 size={14} /> Edit
                    </button>
                    <button onClick={() => setShowDeleteModal(true)}
                      className="btn-danger gap-2">
                      <FiTrash2 size={14} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mb-10">
          {[
            { label: 'Floor',   value: `${stats.floorPrice.toFixed(4)} ${sym}` },
            { label: 'Avg',     value: `${stats.avgPrice.toFixed(4)} ${sym}` },
            { label: 'Volume',  value: `${stats.volume.toFixed(2)} ${sym}` },
            { label: 'Items',   value: stats.nftCount.toString() },
            { label: 'Owners',  value: stats.ownerCount.toString() },
            { label: 'Views',   value: collectionViews.toLocaleString() },
            { label: 'Likes',   value: collectionLikes.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="stat-card text-center">
              <p className="stat-value text-lg">{value}</p>
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>

        {/* ── NFT grid ── */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">
              Items
              <span className="ml-2 text-base font-normal text-ink-400">({nfts.length})</span>
            </h2>
          </div>

          {nfts.length === 0 ? (
            <div className="py-20 text-center card">
              <p className="text-ink-400 text-lg mb-2">No NFTs in this collection yet</p>
              <p className="text-ink-600 text-sm">Items will appear here once they're minted</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {nfts.map((nft, i) => (
                <Link key={nft._id || i} to={`/nft/${nft._id || nft.itemId}`}
                  className="nft-card group block">
                  <div className="nft-card-image">
                    {nft.image ? (
                      <img src={nft.image} alt={nft.name} loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-raised"
                        style={{ aspectRatio: '1' }}>
                        <span className="text-ink-600 text-3xl">🖼</span>
                      </div>
                    )}
                    <div className="nft-card-overlay">
                      <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleAddToCart(nft); }}
                        className="btn-primary btn-sm w-full justify-center gap-1.5">
                        Quick Add
                      </button>
                    </div>
                  </div>
                  <div className="nft-card-body">
                    <h3 className="text-sm font-semibold text-ink-100 mb-2 truncate
                                   group-hover:text-cyan-400 transition-colors">
                      {nft.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      {(nft.price || nft.floorPrice) ? (
                        <p className="text-sm font-bold text-ink-100">
                          {parseFloat(nft.price || nft.floorPrice || 0).toFixed(4)}
                          <span className="text-xs text-ink-400 ml-1 font-normal">{sym}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-ink-600">Not listed</p>
                      )}
                      {nft.isLazyMint && (
                        <span className="badge-violet text-[10px]">Lazy</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-ink-100 mb-5">Edit Collection</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={editData.name || ''}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
                placeholder="Collection Name"
                className="input"
              />
              <textarea
                value={editData.description || ''}
                onChange={e => setEditData({ ...editData, description: e.target.value })}
                placeholder="Collection Description"
                className="input h-24 resize-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={handleEditCollection} className="btn-primary flex-1 justify-center">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-ink-100 mb-2">Delete Collection</h3>
            <p className="text-ink-400 text-sm mb-6">
              Are you sure you want to delete <strong className="text-ink-100">{collection.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={handleDeleteCollection} className="btn-danger flex-1 justify-center">
                <FiTrash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
