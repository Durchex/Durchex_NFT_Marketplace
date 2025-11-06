import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../FooterComponents/Footer";
import { ICOContent } from "../Context";
import socketService from "../services/socketService";
import { FiCheck, FiUser, FiTrendingUp, FiStar } from "react-icons/fi";
import toast from "react-hot-toast";

// Mock creators data
const generateMockCreators = (count = 8) => {
  const names = [
    "ArtVanguard", "PixelPioneer", "DigitalDreams", "CryptoCanvas", 
    "NeoNexus", "VirtualVisions", "MetaMasters", "BlockchainBrush",
    "NFTNinja", "CryptoCreator", "DigitalDali", "PixelPunk",
    "ArtArchive", "NFTNomad", "DigitalDynamo", "CanvasCrypto"
  ];
  
  const bios = [
    "Digital artist exploring the boundaries of NFT art",
    "Creator of unique blockchain-based collectibles",
    "Award-winning NFT artist with 5+ years experience",
    "Pioneering the future of digital ownership",
    "Curator of rare and exclusive NFT collections",
    "Innovator in generative and AI-powered art"
  ];

  return Array.from({ length: count }, (_, i) => {
    const verificationType = Math.random() > 0.6 ? 'gold' : (Math.random() > 0.5 ? 'white' : null);
    return {
      id: `creator_${i}`,
      username: names[i % names.length],
      walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${names[i % names.length]}`,
      bio: bios[i % bios.length],
      verificationType: verificationType, // 'gold', 'white', or null
      isVerified: verificationType !== null,
      nftCount: Math.floor(Math.random() * 50) + 5,
      followers: Math.floor(Math.random() * 10000) + 100
    };
  });
};

// Mock popular NFTs
const generateMockNFTs = (count = 20) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `nft_${i}`,
    name: `Amazing NFT #${i + 1}`,
    image: `https://picsum.photos/400/400?random=${i}`,
    price: (Math.random() * 10 + 0.1).toFixed(2),
    collection: `Collection ${Math.floor(i / 5) + 1}`,
    likes: Math.floor(Math.random() * 1000),
    views: Math.floor(Math.random() * 5000)
  }));
};

const Explore = () => {
  const { address } = useContext(ICOContent) || {};
  const [popularNFTs, setPopularNFTs] = useState([]);
  const [creators, setCreators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState({
    walletAddress: "",
    username: "",
    email: "",
    socialLinks: "",
    reason: "",
    verificationType: "white", // 'white' or 'gold'
    idDocument: null // For gold verification
  });

    // Initialize with mock data
  useEffect(() => {
    const initializeData = () => {
      const mockNFTs = generateMockNFTs(20);
      setPopularNFTs(mockNFTs);

      // Load creators from localStorage or generate new ones
      const savedCreators = localStorage.getItem("durchex_creators");
      if (savedCreators) {
        try {
          const parsed = JSON.parse(savedCreators);
          // Filter to show only gold verified users in top creators (trending)
          const goldVerifiedCreators = parsed.filter(c => c.verificationType === 'gold');
          setCreators(goldVerifiedCreators.length > 0 ? goldVerifiedCreators : parsed);
        } catch {
          const newCreators = generateMockCreators(8);
          // Filter to show only gold verified users
          const goldVerifiedCreators = newCreators.filter(c => c.verificationType === 'gold');
          setCreators(goldVerifiedCreators.length > 0 ? goldVerifiedCreators : newCreators);
          localStorage.setItem("durchex_creators", JSON.stringify(newCreators));
        }
      } else {
        const newCreators = generateMockCreators(8);
        // Filter to show only gold verified users
        const goldVerifiedCreators = newCreators.filter(c => c.verificationType === 'gold');
        setCreators(goldVerifiedCreators.length > 0 ? goldVerifiedCreators : newCreators);
        localStorage.setItem("durchex_creators", JSON.stringify(newCreators));
      }
      
      // Mark as loaded after data is initialized
      setIsLoading(false);
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(initializeData, 100);
    return () => clearTimeout(timer);
  }, []);

  // Listen for new NFT mints and remove a mock creator
  useEffect(() => {
    // Initialize socket connection
    const socket = socketService.connect();
    
    const handleNFTMinted = (data) => {
      // Check if this is an NFT minting event
      const isMintEvent = data.type === "nft_minted" || 
                         (data.type === "user_activity" && data.nftName) ||
                         (data.user && data.nftName);
      
      if (isMintEvent) {
        // Remove one mock creator when a new NFT is minted
        setCreators((prev) => {
          // Only remove if there are mock creators (those with generated IDs)
          const mockCreators = prev.filter(c => c.id.startsWith("creator_"));
          if (mockCreators.length > 0) {
            const updated = prev.filter((_, idx) => {
              // Remove the first mock creator
              const isFirstMockCreator = prev[idx].id.startsWith("creator_") && 
                                        idx === prev.findIndex(c => c.id.startsWith("creator_"));
              return !isFirstMockCreator;
            });
            localStorage.setItem("durchex_creators", JSON.stringify(updated));
            setTimeout(() => {
              toast.success("New NFT minted! Creator list updated.");
            }, 100);
            return updated;
          }
          return prev;
        });
      }
    };

    // Listen for socket events
    if (socket) {
      socketService.onUserActivity(handleNFTMinted);
      socketService.onNFTMinted(handleNFTMinted);
      socketService.onLiveMintingUpdate(handleNFTMinted);
    }

    return () => {
      if (socket) {
        socketService.off("user_activity", handleNFTMinted);
        socketService.off("nft_minted", handleNFTMinted);
        socketService.off("live_minting_update", handleNFTMinted);
      }
    };
  }, []);

  // Update verification request wallet address when connected
  useEffect(() => {
    if (address) {
      setVerificationRequest((prev) => ({
        ...prev,
        walletAddress: address
      }));
    }
  }, [address]);

  const handleVerificationRequest = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!verificationRequest.username || !verificationRequest.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Save verification request to localStorage (for now)
      const requests = JSON.parse(localStorage.getItem("durchex_verification_requests") || "[]");
      const newRequest = {
        ...verificationRequest,
        walletAddress: address,
        timestamp: new Date().toISOString(),
        status: "pending"
      };
      
      requests.push(newRequest);
      localStorage.setItem("durchex_verification_requests", JSON.stringify(requests));
      
      toast.success("Verification request submitted! Our team will review it soon.");
      setIsVerificationModalOpen(false);
      setVerificationRequest({
        walletAddress: address,
        username: "",
        email: "",
        socialLinks: "",
        reason: ""
      });
    } catch (error) {
      toast.error("Failed to submit verification request");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading explore page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Two Column Flex Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
          {/* Column 1: Popular NFTs Slider (Larger) */}
          <div className="w-full lg:w-[65%] lg:flex-[3]">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-300 bg-clip-text text-transparent">
                Most Popular NFTs
              </h2>
              <p className="text-gray-400 text-sm">Discover trending NFTs on Durchex</p>
            </div>

            {/* Auto-sliding NFT Slider */}
            <div className="relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800">
              <div className="nft-slider-container overflow-hidden">
                <div className="nft-slider-track flex gap-4">
                  {/* Duplicate NFTs for seamless loop */}
                  {[...popularNFTs, ...popularNFTs].map((nft, idx) => (
                    <Link
                      key={`${nft.id}_${idx}`}
                      to={`/nft/${nft.id}`}
                      className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] group"
                    >
                      <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-105">
                        <div className="relative aspect-square overflow-hidden">
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              e.target.src = `https://picsum.photos/400/400?random=${idx}`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center justify-between text-white">
                              <div className="flex items-center gap-2">
                                <FiStar className="text-yellow-400" />
                                <span className="text-sm font-medium">{nft.likes}</span>
                              </div>
                              <div className="text-sm font-medium">
                                {nft.price} ETH
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-white truncate mb-1">{nft.name}</h3>
                          <p className="text-gray-400 text-sm truncate">{nft.collection}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{nft.views} views</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Creators List (Smaller) */}
          <div className="w-full lg:w-[35%] lg:flex-1 lg:max-w-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-300 bg-clip-text text-transparent">
                  Top Creators
                </h2>
                <p className="text-gray-400 text-sm">Verified creators on Durchex</p>
              </div>
              {address && (
                <button
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Get Verified
                </button>
              )}
            </div>

            {/* Creators List */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {creators.map((creator) => (
                <Link
                  key={creator.id}
                  to={`/profile/${creator.walletAddress}`}
                  className="block bg-gray-900/50 rounded-xl p-4 border border-gray-800 hover:border-purple-500 transition-all duration-300 hover:bg-gray-900/70"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img
                        src={creator.avatar}
                        alt={creator.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`;
                        }}
                      />
                      {creator.verificationType === 'gold' && (
                        <span
                          title="Gold verified"
                          className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-5 h-5 z-10 pointer-events-none"
                        >
                          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                            <defs>
                              <linearGradient id="goldStar" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFE27A" />
                                <stop offset="100%" stopColor="#F7B500" />
                              </linearGradient>
                            </defs>
                            <polygon points="12,2 14,7 20,4 17,10 22,12 17,14 20,20 14,17 12,22 10,17 4,20 7,14 2,12 7,10 4,4 10,7" fill="url(#goldStar)" stroke="#E6B800" strokeWidth="1" />
                            <path d="M9 12.5l1.8 1.8 4.7-4.7" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      {creator.verificationType === 'white' && (
                        <span
                          title="Verified"
                          className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-5 h-5 z-10 pointer-events-none"
                        >
                          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                            <polygon points="12,2 14,7 20,4 17,10 22,12 17,14 20,20 14,17 12,22 10,17 4,20 7,14 2,12 7,10 4,4 10,7" fill="#ffffff" stroke="#E5E7EB" strokeWidth="1" />
                            <path d="M9 12.5l1.8 1.8 4.7-4.7" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{creator.username}</h3>
                        {/* Inline verified pill removed for non-profile views */}
                      </div>
                      <p className="text-gray-400 text-xs truncate mb-2">{creator.bio}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{creator.nftCount} NFTs</span>
                        <span>{creator.followers.toLocaleString()} followers</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              
              {creators.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <FiUser className="mx-auto text-4xl mb-2 opacity-50" />
                  <p>No creators yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Verification Request Modal */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Request Verification</h3>
              <button
                onClick={() => setIsVerificationModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-6">
              Get verified to earn a verification badge and gain trust from collectors. Gold verification requires ID verification and appears in trending creators.
            </p>

            <div className="space-y-4">
              {/* Verification Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Verification Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerificationRequest({ ...verificationRequest, verificationType: "white", idDocument: null })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      verificationRequest.verificationType === "white"
                        ? "border-white bg-white/10"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white rounded-full border-2 border-gray-900 flex items-center justify-center">
                        <FiCheck className="text-gray-900 text-xs font-bold" />
                      </div>
                    </div>
                    <div className="text-white text-sm font-medium">White Badge</div>
                    <div className="text-gray-400 text-xs mt-1">No ID required</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationRequest({ ...verificationRequest, verificationType: "gold" })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      verificationRequest.verificationType === "gold"
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full border-2 border-gray-900 flex items-center justify-center">
                        <FiCheck className="text-gray-900 text-xs font-bold" />
                      </div>
                    </div>
                    <div className="text-white text-sm font-medium">Gold Badge</div>
                    <div className="text-gray-400 text-xs mt-1">ID required</div>
                    <div className="text-yellow-400 text-xs mt-1 font-semibold">Trending</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={verificationRequest.username}
                  onChange={(e) => setVerificationRequest({ ...verificationRequest, username: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={verificationRequest.email}
                  onChange={(e) => setVerificationRequest({ ...verificationRequest, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Social Links (Optional)
                </label>
                <input
                  type="text"
                  value={verificationRequest.socialLinks}
                  onChange={(e) => setVerificationRequest({ ...verificationRequest, socialLinks: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Twitter, Instagram, etc."
                />
              </div>

              {/* ID Document Upload for Gold Verification */}
              {verificationRequest.verificationType === "gold" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ID Document <span className="text-red-400">*</span>
                    <span className="text-gray-500 text-xs ml-2">(Required for Gold verification)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setVerificationRequest({ ...verificationRequest, idDocument: e.target.files[0] })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                  />
                  {verificationRequest.idDocument && (
                    <p className="text-green-400 text-xs mt-2">✓ Document selected: {verificationRequest.idDocument.name}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Why should you be verified?
                </label>
                <textarea
                  value={verificationRequest.reason}
                  onChange={(e) => setVerificationRequest({ ...verificationRequest, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                  rows="3"
                  placeholder="Tell us about your work, achievements, or community involvement..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsVerificationModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerificationRequest}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
      
      <style>{`
        .nft-slider-container {
          position: relative;
          overflow: hidden;
        }
        
        .nft-slider-track {
          animation: slide-nfts 40s linear infinite;
        }
        
        .nft-slider-track:hover {
          animation-play-state: paused;
        }
        
        @keyframes slide-nfts {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Explore;
