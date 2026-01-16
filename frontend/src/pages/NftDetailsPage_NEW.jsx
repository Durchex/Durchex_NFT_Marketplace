import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ICOContent } from "../Context";
import { Toaster } from "react-hot-toast";
import { ErrorToast, SuccessToast } from "../app/Toast";
import Header from "../components/Header";
import { nftAPI } from "../services/api";
import { FiArrowLeft, FiHeart, FiShare2 } from "react-icons/fi";

const NftDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address } = useContext(ICOContent);

  // Simplified state
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [collection, setCollection] = useState(null);

  useEffect(() => {
    loadNftData();
  }, [id]);

  const loadNftData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Search all collections for NFT with this itemId
      const allCollections = await nftAPI.getAllCollections();
      let foundNft = null;
      let foundCollection = null;

      for (const coll of allCollections) {
        try {
          const nfts = await nftAPI.getCollectionNFTs(coll.collectionId || coll._id);
          const nftFound = nfts?.find(n =>
            n.itemId === id ||
            n.tokenId === id ||
            n._id === id
          );

          if (nftFound) {
            foundNft = nftFound;
            foundCollection = coll;
            break;
          }
        } catch (err) {
          // Continue searching
          continue;
        }
      }

      if (!foundNft) {
        setError("NFT not found");
        setLoading(false);
        return;
      }

      setNft(foundNft);
      setCollection(foundCollection);
    } catch (err) {
      console.error("Error loading NFT:", err);
      setError(err.message || "Failed to load NFT details");
      ErrorToast("Failed to load NFT details");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      if (liked) {
        // Unlike
        await nftAPI.unlikeNFT(nft._id, address);
        setLiked(false);
        SuccessToast("Unliked");
      } else {
        // Like
        await nftAPI.likeNFT(nft._id, address);
        setLiked(true);
        SuccessToast("Liked!");
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      ErrorToast("Failed to update like");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: nft.name,
        text: `Check out ${nft.name}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      SuccessToast("Link copied to clipboard");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-black text-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading NFT...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !nft) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-black text-white">
        <Header />
        <Toaster position="left" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">NFT Not Found</h1>
            <p className="text-gray-400 mb-6">{error || "This NFT doesn't exist."}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold"
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
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6"
        >
          <FiArrowLeft /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* NFT Image */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg overflow-hidden border-2 border-blue-500/30 aspect-square">
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* NFT Details */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6">
              {collection && (
                <button
                  onClick={() => navigate(`/collection/${collection.collectionId || collection._id}`)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold mb-2"
                >
                  {collection.name}
                </button>
              )}
              <h1 className="text-4xl font-bold mb-2">{nft.name}</h1>
              <p className="text-gray-400">{nft.description || "No description"}</p>
            </div>

            {/* Price & Stats */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Current Price</p>
                  <p className="text-3xl font-bold text-blue-400">{nft.price || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Token ID</p>
                  <p className="text-white font-mono text-sm">{nft.tokenId || nft._id?.slice(0, 8)}</p>
                </div>
                {nft.royalty && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Royalty</p>
                    <p className="text-white font-semibold">{nft.royalty}%</p>
                  </div>
                )}
                {nft.chainNetwork && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Network</p>
                    <p className="text-white font-semibold capitalize">{nft.chainNetwork}</p>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleLike}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${
                    liked
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  <FiHeart className={liked ? "fill-current" : ""} />
                  {liked ? "Liked" : "Like"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                >
                  <FiShare2 />
                  Share
                </button>
              </div>
            </div>

            {/* Owner Info */}
            {nft.owner && (
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                <p className="text-gray-400 text-sm mb-2">Owner</p>
                <p className="text-white font-mono">{nft.owner}</p>
              </div>
            )}
          </div>
        </div>

        {/* Properties / Attributes */}
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Properties</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {nft.attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/30 border border-gray-800 rounded-lg p-4"
                >
                  <p className="text-gray-400 text-sm mb-1">{attr.trait_type || "Trait"}</p>
                  <p className="text-white font-semibold">{attr.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-8 bg-gray-900/30 border border-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Item ID</span>
              <span className="text-white font-mono">{nft.itemId || nft._id}</span>
            </div>
            {nft.contractAddress && (
              <div className="flex justify-between">
                <span className="text-gray-400">Contract</span>
                <span className="text-white font-mono">{nft.contractAddress.slice(0, 8)}...</span>
              </div>
            )}
            {nft.creator && (
              <div className="flex justify-between">
                <span className="text-gray-400">Creator</span>
                <span className="text-white font-mono">{nft.creator.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NftDetailsPage;
