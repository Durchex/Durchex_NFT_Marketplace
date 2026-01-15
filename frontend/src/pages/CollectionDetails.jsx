import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ICOContent } from "../Context";
import { Toaster } from "react-hot-toast";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import Header from "../components/Header";
import { nftAPI, engagementAPI } from "../services/api";
import NFTImageHoverOverlay from "../components/NFTImageHoverOverlay";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FiEdit2, FiTrash2, FiArrowLeft, FiDownload } from "react-icons/fi";
import toast from "react-hot-toast";

export default function CollectionDetails() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const contexts = useContext(ICOContent);
  const { address } = contexts;

  // Collection data
  const [collection, setCollection] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [cartItems, setCartItems] = useState(new Set());
  const [likedItems, setLikedItems] = useState(new Set());
  
  // Edit/Delete modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({});

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState([]);
  const [stats, setStats] = useState({
    floorPrice: 0,
    volume: 0,
    nftCount: 0,
    avgPrice: 0,
    ownerCount: 0
  });

  useEffect(() => {
    fetchCollectionData();
  }, [collectionId, address]);

  const fetchCollectionData = async () => {
    try {
      setLoading(true);

      // Fetch collection details
      const collectionData = await nftAPI.getCollection(collectionId);
      console.log('🔍 Collection Data:', collectionData);
      setCollection(collectionData);
      setEditData(collectionData);

      // Check if user is owner
      if (collectionData.creatorWallet === address) {
        setIsOwner(true);
      }

      // Fetch NFTs like in Explore page - from all networks and filter by collection ID
      console.log('📡 Fetching NFTs from all networks for collection:', collectionId);
      let allNFTs = [];
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
      
      for (const network of networks) {
        try {
          console.log(`[CollectionDetails] Fetching NFTs from ${network}...`);
          // Get all NFTs from this network
          const networkNfts = await nftAPI.getAllNftsByNetwork(network);
          if (networkNfts && Array.isArray(networkNfts)) {
            console.log(`[CollectionDetails] Found ${networkNfts.length} NFTs on ${network}`);
            allNFTs = [...allNFTs, ...networkNfts];
          }
        } catch (err) {
          console.warn(`[CollectionDetails] Error fetching from ${network}:`, err.message);
          // Continue to next network
        }
      }

      // Filter NFTs by collection ID
      console.log(`[CollectionDetails] Total NFTs from all networks: ${allNFTs.length}`);
      const collectionNFTs = allNFTs.filter(nft => {
        const nftCollection = nft.collection ? String(nft.collection).toLowerCase() : '';
        const targetCollectionId = String(collectionId).toLowerCase();
        return nftCollection === targetCollectionId;
      });

      console.log(`[CollectionDetails] Filtered ${collectionNFTs.length} NFTs for collection ${collectionId}`);
      if (collectionNFTs.length > 0) {
        console.log('✅ First filtered NFT:', collectionNFTs[0]);
      }
      
      // Sort by creation date (newest first)
      collectionNFTs.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setNfts(collectionNFTs);

      // Calculate analytics
      calculateAnalytics(collectionNFTs);
    } catch (error) {
      console.error("❌ Error fetching collection:", error);
      ErrorToast("Failed to load collection details");
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (nftsList) => {
    if (nftsList.length === 0) {
      setStats({
        floorPrice: 0,
        volume: 0,
        nftCount: 0,
        avgPrice: 0,
        ownerCount: 0
      });
      setAnalyticsData([]);
      return;
    }

    // Calculate floor price (minimum)
    const floorPrice = Math.min(...nftsList.map(nft => parseFloat(nft.floorPrice) || 0));
    
    // Calculate average price
    const avgPrice = nftsList.reduce((sum, nft) => sum + (parseFloat(nft.price) || 0), 0) / nftsList.length;
    
    // Calculate total volume (sum of all floor prices)
    const volume = nftsList.reduce((sum, nft) => sum + (parseFloat(nft.floorPrice) || 0), 0);

    // Calculate unique owner count
    const uniqueOwners = new Set(
      nftsList
        .map(nft => nft.owner)
        .filter(owner => owner) // Filter out undefined/null owners
    );
    const ownerCount = uniqueOwners.size;

    setStats({
      floorPrice: isNaN(floorPrice) ? 0 : floorPrice,
      volume: isNaN(volume) ? 0 : volume,
      nftCount: nftsList.length,
      avgPrice: isNaN(avgPrice) ? 0 : avgPrice,
      ownerCount: ownerCount
    });

    // Generate analytics chart data (simulated 7-day data)
    const chartData = [];
    const baseFloorPrice = floorPrice * 0.95;
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() - (6 - i));
      chartData.push({
        day: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        floorPrice: parseFloat((baseFloorPrice + (Math.random() * 0.1 - 0.05) * baseFloorPrice).toFixed(4)),
        volume: parseInt(volume * 0.8 + Math.random() * volume * 0.4)
      });
    }
    setAnalyticsData(chartData);
  };

  const handleUpdateCollection = async () => {
    try {
      await nftAPI.updateCollection(collectionId, editData);
      setCollection(editData);
      setShowEditModal(false);
      SuccessToast("Collection updated successfully!");
    } catch (error) {
      console.error("Error updating collection:", error);
      ErrorToast("Failed to update collection");
    }
  };

  const handleDeleteCollection = async () => {
    try {
      await nftAPI.deleteCollection(collectionId);
      SuccessToast("Collection deleted successfully!");
      setTimeout(() => navigate("/profile"), 2000);
    } catch (error) {
      console.error("Error deleting collection:", error);
      ErrorToast("Failed to delete collection");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-black text-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading collection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-black text-white">
        <Header />
        <Toaster position="left" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
            <p className="text-gray-400 mb-6">The collection you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-black text-white">
      <Header />
      <Toaster position="left" />

      <div className="p-4 sm:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors"
        >
          <FiArrowLeft /> Back
        </button>

        {/* Collection Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Collection Image */}
          <div className="flex-shrink-0">
            {collection.image ? (
              <img
                src={collection.image}
                alt={collection.name}
                className="w-48 h-48 object-cover rounded-lg border-2 border-blue-500/30"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-900 rounded-lg border-2 border-blue-500/30 flex items-center justify-center">
                <span className="text-4xl">📦</span>
              </div>
            )}
          </div>

          {/* Collection Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{collection.name}</h1>
            <p className="text-gray-400 mb-4">{collection.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Creator</p>
                <p className="text-white font-semibold">
                  {collection.creatorName || `${collection.creatorWallet?.slice(0, 8)}...${collection.creatorWallet?.slice(-6)}`}
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Network</p>
                <p className="text-white font-semibold capitalize">{collection.network}</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Category</p>
                <p className="text-white font-semibold capitalize">{collection.category}</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-gray-400 text-sm">NFTs Count</p>
                <p className="text-white font-semibold">{stats.nftCount}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {isOwner && (
              <div className="flex gap-4">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  <FiEdit2 /> Edit Collection
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  <FiTrash2 /> Delete Collection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collection Analytics */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Collection Analytics</h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Floor Price</p>
              <p className="text-2xl font-bold text-blue-400">
                {stats.floorPrice.toFixed(4)} {collection.network === "solana" ? "SOL" : collection.network === "ethereum" ? "ETH" : "POL"}
              </p>
            </div>

            <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Average Price</p>
              <p className="text-2xl font-bold text-purple-400">
                {stats.avgPrice.toFixed(4)} {collection.network === "solana" ? "SOL" : collection.network === "ethereum" ? "ETH" : "POL"}
              </p>
            </div>

            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Total Volume</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.volume.toFixed(4)} {collection.network === "solana" ? "SOL" : collection.network === "ethereum" ? "ETH" : "POL"}
              </p>
            </div>

            <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Items in Collection</p>
              <p className="text-2xl font-bold text-orange-400">{stats.nftCount}</p>
            </div>

            <div className="bg-pink-900/30 border border-pink-500/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Owners</p>
              <p className="text-2xl font-bold text-pink-400">{stats.ownerCount}</p>
            </div>
          </div>

          {/* Analytics Chart */}
          {analyticsData.length > 0 && (
            <div className="bg-gray-950/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">7-Day Floor Price Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="day" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => value.toFixed(4)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="floorPrice"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Floor Price"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* NFTs Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">NFTs in Collection</h2>
          
          {nfts.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
              <p className="text-gray-400">No NFTs in this collection yet. (nfts.length = {nfts.length})</p>
              {isOwner && (
                <p className="text-gray-500 text-sm mt-2">Add NFTs to this collection from the Create page.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nfts.map((nft) => (
                <div
                  key={nft._id}
                  className="relative group"
                  onMouseEnter={() => {
                    engagementAPI.trackNFTView(nft._id, address).catch(err => console.log('View tracking:', err));
                  }}
                >
                  {/* NFT Image */}
                  <img
                    src={nft.image || '/placeholder-nft.png'}
                    alt={nft.name}
                    className="w-full h-64 object-cover rounded-lg bg-gray-900"
                    onError={(e) => { e.target.src = '/placeholder-nft.png'; }}
                  />
                  
                  {/* Hover Overlay */}
                  <NFTImageHoverOverlay
                    nft={{
                      ...nft,
                      itemId: nft._id,
                      price: nft.price || '0',
                      currency: 'ETH'
                    }}
                    isInCart={cartItems.has(nft._id)}
                    isLiked={likedItems.has(nft._id)}
                    onAddToCart={() => {
                      setCartItems(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(nft._id)) {
                          newSet.delete(nft._id);
                        } else {
                          newSet.add(nft._id);
                        }
                        return newSet;
                      });
                    }}
                    onLike={() => {
                      if (likedItems.has(nft._id)) {
                        engagementAPI.unlikeNFT(nft._id, address).then(() => {
                          setLikedItems(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(nft._id);
                            return newSet;
                          });
                          toast.success('Unliked');
                        }).catch(err => {
                          console.error('Unlike error:', err);
                          toast.error('Failed to unlike');
                        });
                      } else {
                        engagementAPI.likeNFT(nft._id, address).then(() => {
                          setLikedItems(prev => new Set(prev).add(nft._id));
                          toast.success('Liked');
                        }).catch(err => {
                          console.error('Like error:', err);
                          toast.error('Failed to like');
                        });
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Edit Collection</h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Collection Name</label>
                <input
                  type="text"
                  className="w-full bg-gray-950 text-white rounded-lg p-2 border border-gray-800"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Description</label>
                <textarea
                  rows={3}
                  className="w-full bg-gray-950 text-white rounded-lg p-2 border border-gray-800"
                  value={editData.description || ''}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Category</label>
                <select
                  className="w-full bg-gray-950 text-white rounded-lg p-2 border border-gray-800"
                  value={editData.category || ''}
                  onChange={(e) => setEditData({...editData, category: e.target.value})}
                >
                  <option value="">Select category</option>
                  <option value="gaming">Gaming</option>
                  <option value="sports">Sports</option>
                  <option value="music">Music</option>
                  <option value="art">Art</option>
                  <option value="photography">Photography</option>
                  <option value="utility">Utility</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCollection}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-red-500">Delete Collection</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this collection? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCollection}
                className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
