import { useState, useEffect, useContext } from "react";
import {
  Edit3,
  Share2,
  MoreVertical,
  Grid,
  List,
  Filter,
  X,
} from "lucide-react";
import { ICOContent } from "../Context";

function App() {
  const { address, getAllListings } = useContext(ICOContent);
  const [activeTab, setActiveTab] = useState("Owned");
  const [viewMode, setViewMode] = useState("grid");
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState("Anonymous User");
  const [tempName, setTempName] = useState("Anonymous User");
  const [nameError, setNameError] = useState("");
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [nftItems, setNftItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserNFTs = async () => {
      if (!address) {
        setNftItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // TODO: Replace with real API call to fetch user's NFTs
        // For now, we'll show empty state until real API is implemented
        setNftItems([]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading user NFTs:', error);
        setNftItems([]);
        setLoading(false);
      }
    };

    loadUserNFTs();
  }, [address, activeTab]);

  const tabs = ["Owned", "On sale", "My Collections", "Created"];

  const validateName = (name) => {
    if (!name.trim()) return "Name cannot be empty";
    if (name.length < 3) return "Name must be at least 3 characters";
    if (name.length > 30) return "Name must be less than 30 characters";
    return "";
  };

  const handleEditProfile = () => {
    if (isEditing) {
      const error = validateName(tempName);
      if (error) {
        setNameError(error);
        return;
      }
      setProfileName(tempName);
      setNameError("");
    }
    setIsEditing(!isEditing);
  };

  const handleShare = (type) => {
    const currentUrl = window.location.href;
    switch (type) {
      case "copy":
        navigator.clipboard
          .writeText(currentUrl)
          .then(() => alert("Profile URL copied to clipboard!"))
          .catch(() => alert("Failed to copy URL"));
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            currentUrl
          )}&text=Check out my NFT profile!`
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            currentUrl
          )}`
        );
        break;
    }
    setShowShareOptions(false);
  };

  const handleViewItem = (item) => {
    setSelectedNFT(item);
  };

  const closeModal = () => {
    setSelectedNFT(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Profile Header */}
      <div className="bg-purple-900/50 py-10 px-12">
        <div className="flx items-end mb-6">
          <div className="h-16 w-16 bg-gray-700 rounded-md mb-4"></div>
          <div>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="text-3xl font-bold bg-[#222] rounded px-2 py-1 text-white"
                />
                {nameError && (
                  <p className="text-red-500 text-sm mt-1">{nameError}</p>
                )}
              </div>
            ) : (
              <h1 className="text-3xl font-bold">{profileName}</h1>
            )}
            <p className="text-gray-400">3 followers</p>
          </div>
        </div>

        <div className="flex space-x-3 relative">
          <button
            onClick={handleEditProfile}
            className="flex items-center space-x-2 bg-[#222] rounded-lg px-4 py-2 text-sm hover:bg-[#333]"
          >
            <Edit3 className="h-4 w-4" />
            <span>{isEditing ? "Save Profile" : "Edit Profile details"}</span>
          </button>
          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="flex items-center space-x-2 bg-[#222] rounded-lg px-4 py-2 text-sm hover:bg-[#333]"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          {showShareOptions && (
            <div className="absolute top-12 left-44 bg-[#222] rounded-lg p-2 shadow-lg z-10">
              <button
                onClick={() => handleShare("copy")}
                className="block w-full text-left px-4 py-2 hover:bg-[#333] rounded"
              >
                Copy Link
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="block w-full text-left px-4 py-2 hover:bg-[#333] rounded"
              >
                Share on Twitter
              </button>
              <button
                onClick={() => handleShare("facebook")}
                className="block w-full text-left px-4 py-2 hover:bg-[#333] rounded"
              >
                Share on Facebook
              </button>
            </div>
          )}
          {/* <button className="bg-[#222] rounded-lg p-2 hover:bg-[#333]">
            <MoreVertical className="h-5 w-5" />
          </button> */}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-12">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`py-4 px-1 ${
                activeTab === tab
                  ? "border-b-2 border-white font-medium"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="px-12 py-6 flex justify-between">
        <button className="flex items-center space-x-2 bg-[#222] rounded-lg px-4 py-2 text-sm">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-sm mr-2">View</span>
          <button
            className={`p-1.5 rounded ${
              viewMode === "grid"
                ? "bg-white text-black"
                : "bg-[#222] text-white"
            }`}
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            className={`p-1.5 rounded ${
              viewMode === "list"
                ? "bg-white text-black"
                : "bg-[#222] text-white"
            }`}
            onClick={() => setViewMode("list")}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="px-12 pb-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your NFTs...</p>
          </div>
        ) : nftItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No NFTs Found</h3>
            <p className="text-gray-400 mb-4">
              {!address 
                ? "Connect your wallet to view your NFTs" 
                : `You don't have any NFTs in the "${activeTab}" category yet`
              }
            </p>
            <p className="text-sm text-gray-500">
              {!address 
                ? "Your NFT collection will appear here once you connect your wallet"
                : "Start minting or buying NFTs to build your collection"
              }
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-4 gap-6" : "space-y-4"
            }
          >
            {nftItems.map((item) => (
              <div
                key={item.id}
                className={`${
                  viewMode === "grid"
                    ? "bg-[#222] rounded-lg overflow-hidden hover:shadow-lg cursor-pointer"
                    : "bg-[#222] rounded-lg p-4 flex items-center space-x-4 hover:shadow-lg cursor-pointer"
                }`}
                onClick={() => handleViewItem(item)}
              >
                <div
                  className={
                    viewMode === "grid"
                      ? "aspect-square bg-[#333]"
                      : "h-20 w-20 bg-[#333] rounded"
                  }
                ></div>
                <div className={viewMode === "grid" ? "p-4" : "flex-1"}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-400 text-sm">{item.collection}</p>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-purple-400">{item.price}</p>
                    </div>
                    <button className="p-1">
                      <MoreVertical className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#222] rounded-lg p-6 w-full max-w-md relative">
            <button onClick={closeModal} className="absolute top-4 right-4">
              <X className="h-6 w-6 text-gray-400" />
            </button>
            <div className="aspect-square bg-[#333] rounded-lg mb-4"></div>
            <h2 className="text-xl font-bold">{selectedNFT.name}</h2>
            <p className="text-gray-400">{selectedNFT.collection}</p>
            <p className="text-purple-400 mt-2">{selectedNFT.price}</p>
            <div className="mt-4 flex space-x-2">
              <button className="flex-1 bg-purple-600 hover:bg-purple-700 rounded-lg py-2">
                Buy Now
              </button>
              <button className="flex-1 bg-[#333] hover:bg-[#444] rounded-lg py-2">
                Make Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
