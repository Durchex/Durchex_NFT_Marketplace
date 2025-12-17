import React, { useContext, useState, useEffect } from "react";
import {
  Edit3,
  Share2,
  MoreVertical,
  Grid,
  List,
  Filter,
  X,
} from "lucide-react";
import Loader from "../components/Loader.jsx";
import Header from "../components/Header";
import { ICOContent } from "../Context/index.jsx";
import { Toaster } from "react-hot-toast";
import { BsStars } from "react-icons/bs";

import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import LoadingNFTRow from "../components/LoadingNftRow.jsx";
import LoadingNFTGrid from "../components/LoadingNftGrid.jsx";
import ListNft from "../components/ListNft.jsx";
import MyCollections from "../components/MyCollections.jsx";
import MyPoints from "../components/MyPoints.jsx";
import MyProfile from "../components/MyProfile.jsx";
import VerificationSubmission from "../components/VerificationSubmission.jsx";
import MyGiveawayNFTs from "./user/MyGiveawayNFTs.jsx";

// import { Grid, List } from "lucide-react";

// Components for each tab section
const OwnedNFTs = ({ nftItems, viewMode, handleViewItem }) => (
  <NFTGrid
    nftItems={nftItems}
    viewMode={viewMode}
    handleViewItem={handleViewItem}
  />
);

// Component for displaying NFTs in grid or list view
const NFTGrid = ({ nftItems, viewMode, handleViewItem }) => (
  <div className="px-12 pb-12">
    <div
      className={viewMode === "grid" ? "grid grid-cols-4 gap-6" : "space-y-4"}
    >
      {nftItems?.map((item) => (
        <div
          key={item?.id}
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
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState("Owned");
  const [viewMode, setViewMode] = useState("grid");
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState("WELCOME USER");
  const [tempName, setTempName] = useState("Welcome User");
  const [nameError, setNameError] = useState("");
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [isEligible, setIsEligible] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const contexts = useContext(ICOContent);
  const { getUserStatu, address } = contexts || {};
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    "MyProfile",
    "Owned",
    "Giveaway NFTs",
    "My Points",
    "My Collections",
    "List NFT",
    "Verification",
  ];

  const nftItems = [
    {
      id: 1,
      collection: "Happy cow collection",
      name: "Happy cow dance #1242",
      price: "0.5 ETH",
    },
    {
      id: 2,
      collection: "Happy cow collection",
      name: "Happy cow dance #1243",
      price: "0.7 ETH",
    },
    {
      id: 3,
      collection: "Happy cow collection",
      name: "Happy cow dance #1244",
      price: "0.6 ETH",
    },
    {
      id: 4,
      collection: "Happy cow collection",
      name: "Happy cow dance #1245",
      price: "0.8 ETH",
    },
    {
      id: 5,
      collection: "Happy cow collection",
      name: "Happy cow dance #1246",
      price: "0.8 ETH",
    },
    {
      id: 6,
      collection: "Happy cow collection",
      name: "Happy cow dance #1247",
      price: "0.8 ETH",
    },
  ];

  const getUserPoints = async () => {
    if (!getUserStatu || !address) {
      console.warn("getUserStatu not available or address not connected");
      return;
    }

    try {
      const response = await getUserStatu(address);
      console.log("🚀 ~ getUserPoints ~ response:", response);

      if (response && response.length >= 2) {
        const points = response[0];
        const eligible = response[1];

        // Update state
        setUserPoints(points.toString());
        setIsEligible(eligible);
      }
    } catch (error) {
      console.error("Error getting user points:", error);
      // Set default values on error
      setUserPoints("0");
      setIsEligible(false);
    }
  };

  useEffect(() => {
    if (address) {
      setUserAddress(address);
    }
  }, [address]);

  useEffect(() => {
    if (activeTab === "My Points" && address && getUserStatu) {
      getUserPoints();
    }
  }, [activeTab, address]);

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
          .then(() => SuccessToast("Profile URL copied to clipboard!"))
          .catch(() => ErrorToast("Failed to copy URL"));
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Require wallet connection to access profile
  if (!address) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Wallet Not Connected</h2>
            <p className="text-gray-400 mb-6">
              Please connect your wallet to access your profile and manage your account settings.
            </p>
            <p className="text-sm text-gray-500">
              Use the wallet connect button in the header to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Bar */}
      <Header />
      {/* Mobile Tabs Dropdown */}
      <div className="px-4 md:hidden">
        <button
          onClick={toggleMobileMenu}
          className="flex justify-between items-center w-full py-3 px-4 bg-[#222] rounded-lg my-2"
        >
          <span>{activeTab}</span>
          <span
            className="transform transition-transform duration-200"
            style={{
              transform: isMobileMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
        </button>

        {isMobileMenuOpen && (
          <div className="bg-[#222] rounded-lg mt-1 shadow-lg mb-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`block w-full text-left px-4 py-3 hover:bg-[#333] ${
                  activeTab === tab ? "text-white font-medium" : "text-gray-400"
                }`}
                onClick={() => {
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Tabs */}
      <div className="min-h-screen flex bg-black text-white">
        {/* Sidebar */}
        <aside className="w-64 bg-[#111] p-6 space-y-4 hidden md:block">
          <h2 className="text-2xl font-bold mb-8">Dashboard</h2>
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`block w-full text-left px-4 py-2 rounded-lg ${
                activeTab === tab ? "bg-purple-600" : "hover:bg-[#222]"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "MyProfile" && <MyProfile />}
          {activeTab === "Owned" && <MyCollections placeholder={"NFT"} />}
          {activeTab === "Giveaway NFTs" && <MyGiveawayNFTs />}
          {activeTab === "My Points" && (
            <MyPoints userPoints={userPoints} isEligible={isEligible} />
          )}
          {activeTab === "My Collections" && (
            <MyCollections placeholder={"Collection"} />
          )}
          {activeTab === "List NFT" && <ListNft />}
          {activeTab === "Verification" && (
            <div className="max-w-4xl mx-auto">
              <VerificationSubmission />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
