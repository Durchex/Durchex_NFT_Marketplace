import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ICOContent } from "../Context";
import { useCart } from "../Context/CartContext";
import { Toaster } from "react-hot-toast";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import Header from "../components/Header";
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <div className="flex justify-center items-center h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <div className="flex justify-center items-center h-[70vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Collection Not Found</h2>
            <button
              onClick={() => navigate("/collections")}
              className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
            >
              Back to Collections
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />
      <Toaster />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/collections")}
            className="flex items-center gap-2 mb-6 text-cyan-400 hover:text-cyan-300"
          >
            <FiArrowLeft /> Back to Collections
          </button>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{collection.name}</h1>
              <p className="text-gray-300 mb-4">{collection.description}</p>
              <div className="flex items-center gap-4">
                {/* Creator Info */}
                <div className="flex items-center gap-2">
                  <img
                    src={collection.creatorAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${collection.creatorWallet}`}
                    alt={collection.creatorName}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${collection.creatorWallet || collection._id}`;
                    }}
                  />
                  <div>
                    <div className="text-xs text-gray-500">Creator</div>
                    <div className="text-white font-semibold">{collection.creatorName || collection.creatorWallet?.slice(0, 6) + '...'}</div>
                  </div>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">Network: <span className="text-cyan-400 uppercase">{collection.network}</span></span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isOwner && (
                <>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </>
              )}
              <button
                onClick={handleToggleCollectionLike}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
              >
                <span>❤</span>
                <span>{collectionLikes.toLocaleString()}</span>
              </button>
            </div>
          </div>

          {collection.image && (
            <img
              src={collection.image}
              alt={collection.name}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-5 gap-4 mb-12">
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Floor Price</p>
            <p className="text-2xl font-bold text-cyan-400">
              {stats.floorPrice ? stats.floorPrice.toFixed(4) : '0.0000'}{' '}
              {getCurrencySymbol(collection.network || 'ethereum')}
            </p>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Avg Price</p>
            <p className="text-2xl font-bold text-cyan-400">
              {stats.avgPrice ? stats.avgPrice.toFixed(4) : '0.0000'}{' '}
              {getCurrencySymbol(collection.network || 'ethereum')}
            </p>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Total Volume</p>
            <p className="text-2xl font-bold text-cyan-400">
              {stats.volume ? stats.volume.toFixed(2) : '0.00'}{' '}
              {getCurrencySymbol(collection.network || 'ethereum')}
            </p>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Items</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.nftCount || 0}</p>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Owners</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.ownerCount || 0}</p>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Views</p>
            <p className="text-2xl font-bold text-cyan-400">{collectionViews.toLocaleString()}</p>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Likes</p>
            <p className="text-2xl font-bold text-cyan-400">{collectionLikes.toLocaleString()}</p>
          </div>
        </div>

        {/* NFTs Grid Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Collection Items ({nfts.length})</h2>
          
          {nfts.length === 0 ? (
            <div className="text-center py-12 bg-slate-700 rounded-lg">
              <p className="text-gray-400">No NFTs found in this collection</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {nfts.map((nft) => (
                <Link
                  key={nft._id}
                  to={`/nft/${nft._id}`}
                  className="group relative bg-slate-700 rounded-lg overflow-hidden hover:scale-105 transition-transform"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-600">
                    {nft.image ? (
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    <NFTImageHoverOverlay
                      nft={nft}
                      onAddToCart={() => handleAddToCart(nft)}
                      onLike={() => handleLike(nft)}
                      isLiked={likedItems.has(nft._id)}
                      isInCart={getCartNftId ? isInCart(getCartNftId(nft), nft.contractAddress || nft.nftContract) : false}
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold mb-2 truncate">{nft.name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Price</span>
                      <span className="font-bold text-cyan-400">
                        {parseFloat(nft.price || nft.floorPrice || 0).toFixed(4)}{' '}
                        {getCurrencySymbol(nft.network || collection.network || 'ethereum')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-lg max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Edit Collection</h3>
            <input
              type="text"
              value={editData.name || ""}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              placeholder="Collection Name"
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg mb-4"
            />
            <textarea
              value={editData.description || ""}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              placeholder="Collection Description"
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg mb-4 h-24"
            />
            <div className="flex gap-4">
              <button
                onClick={handleEditCollection}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-lg max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Delete Collection</h3>
            <p className="text-gray-300 mb-6">Are you sure? This cannot be undone.</p>
            <div className="flex gap-4">
              <button
                onClick={handleDeleteCollection}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
