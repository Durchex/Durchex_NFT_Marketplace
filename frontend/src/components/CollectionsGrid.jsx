import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { nftAPI } from "../services/api";
import { FiArrowRight, FiTrash2, FiEdit2 } from "react-icons/fi";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";

export default function CollectionsGrid({ walletAddress }) {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, [walletAddress]);

  const fetchCollections = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await nftAPI.getUserCollections(walletAddress);
      setCollections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching collections:", error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async (collectionId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this collection?")) {
      return;
    }

    try {
      await nftAPI.deleteCollection(collectionId);
      setCollections(collections.filter(c => c._id !== collectionId));
      SuccessToast("Collection deleted successfully!");
    } catch (error) {
      console.error("Error deleting collection:", error);
      ErrorToast("Failed to delete collection");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
        <p className="text-gray-400 mb-4">You haven't created any collections yet.</p>
        <button
          onClick={() => navigate("/create")}
          className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          Create Collection
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Collections ({collections.length})</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {collections.map((collection) => (
          <div
            key={collection._id}
            onClick={() => navigate(`/collection/${collection._id}`)}
            className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500/50 transition-all group cursor-pointer"
          >
            {/* Collection Image */}
            <div className="relative h-40 bg-gray-800 overflow-hidden">
              {collection.image ? (
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  📦
                </div>
              )}
              
              {/* Overlay with buttons */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/collection/${collection._id}`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-colors"
                  title="View details"
                >
                  <FiArrowRight className="text-white" size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/collection/${collection._id}?edit=true`);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 p-2 rounded-full transition-colors"
                  title="Edit collection"
                >
                  <FiEdit2 className="text-white" size={20} />
                </button>
                <button
                  onClick={(e) => handleDeleteCollection(collection._id, e)}
                  className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition-colors"
                  title="Delete collection"
                >
                  <FiTrash2 className="text-white" size={20} />
                </button>
              </div>
            </div>

            {/* Collection Info */}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 truncate">{collection.name}</h3>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{collection.description}</p>

              {/* Collection Meta */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-gray-400 text-xs">Network</p>
                  <p className="font-semibold text-sm capitalize">{collection.network}</p>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-gray-400 text-xs">Category</p>
                  <p className="font-semibold text-sm capitalize">{collection.category}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Collection Button */}
      <button
        onClick={() => navigate("/create")}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-4 rounded-lg font-semibold text-lg transition-colors"
      >
        + Create New Collection
      </button>
    </div>
  );
}
