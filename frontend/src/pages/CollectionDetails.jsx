import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ICOContent } from "../Context";
import { Toaster } from "react-hot-toast";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import Header from "../components/Header";
import { nftAPI } from "../services/api";
import NFTImageHoverOverlay from "../components/NFTImageHoverOverlay";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FiEdit2, FiTrash2, FiArrowLeft, FiDownload } from "react-icons/fi";
import toast from "react-hot-toast";

export default function CollectionDetails() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const contexts = useContext(ICOContent);
  const { address } = contexts;

  // State
  const [collection, setCollection] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [cartItems, setCartItems] = useState(new Set());
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
          console.log('⚠️ Direct API returned empty, trying getAllCollections fallback...');
          const allCollections = await nftAPI.getAllCollections();
          collection = allCollections.find(c => 
            String(c.collectionId || c._id).toLowerCase() === String(collectionId).toLowerCase()
          );
          
          if (!collection) {
            throw new Error("Collection not found");
          }
        } else {
          // Handle if API returns array (shouldn't but just in case)
          collection = Array.isArray(collectionData) ? collectionData[0] : collectionData;
        }

        setCollection(collection);
        setEditData(collection);

        // 2. Check if user is owner
        if (collection?.creatorWallet === address) {
          setIsOwner(true);
        }

        // 3. Fetch NFTs from all networks
        console.log('📥 Fetching NFTs for collection:', collectionId);
        const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
        let allNFTs = [];

        for (const network of networks) {
          try {
            const networkNfts = await nftAPI.getAllNftsByNetwork(network);
            if (networkNfts && Array.isArray(networkNfts)) {
              allNFTs = [...allNFTs, ...networkNfts];
            }
          } catch (err) {
            console.warn(`⚠️ Error fetching ${network}:`, err.message);
          }
        }

        // 4. Filter NFTs by collection ID
        const collectionNFTs = allNFTs.filter(nft => {
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

  const calculateAnalytics = (nftsList) => {
    if (nftsList.length === 0) {
      setStats({
        floorPrice: 0,
        volume: 0,
        nftCount: 0,
        avgPrice: 0,
        ownerCount: 0
      });
      return;
    }

    const floorPrice = Math.min(...nftsList.map(nft => parseFloat(nft.floorPrice) || 0));
    const avgPrice = nftsList.reduce((sum, nft) => sum + (parseFloat(nft.price) || 0), 0) / nftsList.length;
    const volume = nftsList.reduce((sum, nft) => sum + (parseFloat(nft.floorPrice) || 0), 0);
    const uniqueOwners = new Set(nftsList.map(nft => nft.owner).filter(owner => owner));

    setStats({
      floorPrice: isNaN(floorPrice) ? 0 : floorPrice,
      volume: isNaN(volume) ? 0 : volume,
      nftCount: nftsList.length,
      avgPrice: isNaN(avgPrice) ? 0 : avgPrice,
      ownerCount: uniqueOwners.size
    });
  };

  const handleAddToCart = (nft) => {
    const newCart = new Set(cartItems);
    newCart.add(nft._id);
    setCartItems(newCart);
    SuccessToast("Added to cart");
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
              <div className="flex gap-4 text-sm">
                <span className="text-gray-400">Creator: <span className="text-white">{collection.creatorName}</span></span>
                <span className="text-gray-400">Network: <span className="text-cyan-400 uppercase">{collection.network}</span></span>
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-2">
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
              </div>
            )}
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
            <p className="text-2xl font-bold text-cyan-400">${stats.floorPrice.toFixed(2)}</p>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Avg Price</p>
            <p className="text-2xl font-bold text-cyan-400">${stats.avgPrice.toFixed(2)}</p>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Total Volume</p>
            <p className="text-2xl font-bold text-cyan-400">${stats.volume.toFixed(2)}</p>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Items</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.nftCount}</p>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Owners</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.ownerCount}</p>
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
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold mb-2 truncate">{nft.name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Floor</span>
                      <span className="font-bold text-cyan-400">${nft.floorPrice || 0}</span>
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
