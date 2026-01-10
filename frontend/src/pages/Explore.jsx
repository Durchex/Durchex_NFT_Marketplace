import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../FooterComponents/Footer";
import { ICOContent } from "../Context";
import socketService from "../services/socketService";
import { nftAPI, userAPI } from "../services/api.js"; // ✅ Import NFT API and User API
import { FiCheck, FiUser, FiTrendingUp, FiStar, FiClock } from "react-icons/fi";
import toast from "react-hot-toast";
import { getVerificationBadge } from "../utils/verificationUtils";
import NFTAnalyticsSection from "../components/NFTAnalyticsSection";
import HeroAnalyticsChart from "../components/HeroAnalyticsChart";

const Explore = () => {
  const { address } = useContext(ICOContent) || {};
  const [popularNFTs, setPopularNFTs] = useState([]);
  const [newlyAddedNFTs, setNewlyAddedNFTs] = useState([]);
  const [creators, setCreators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  
  // Display real NFTs or empty array
  const displayedNFTs = popularNFTs || [];
  const displayedNewlyAddedNFTs = newlyAddedNFTs || [];
  const [verificationRequest, setVerificationRequest] = useState({
    walletAddress: "",
    username: "",
    email: "",
    socialLinks: "",
    reason: "",
    verificationType: "white", // 'white' or 'gold'
    idDocument: null // For gold verification
  });

    // Initialize with real data from backend, fallback to mock data if needed
  useEffect(() => {
    const initializeData = async () => {
      try {
        // ✅ Fetch real NFTs from backend - try all networks
        let nftsData = [];
        const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
        
        for (const network of networks) {
          try {
            console.log(`[Explore] Fetching NFTs from ${network}...`);
            // Use the explore endpoint to get ALL NFTs regardless of listing status
            const networkNfts = await nftAPI.getAllNftsByNetworkForExplore(network);
            if (networkNfts && Array.isArray(networkNfts)) {
              console.log(`[Explore] Found ${networkNfts.length} NFTs on ${network}`);
              nftsData = [...nftsData, ...networkNfts];
            }
          } catch (err) {
            console.warn(`[Explore] Error fetching from ${network}:`, err.message);
            // Continue to next network
          }
        }

        if (nftsData && nftsData.length > 0) {
          console.log(`[Explore] Total NFTs from all networks:`, nftsData.length);
          // Take first 20 NFTs for display
          setPopularNFTs(nftsData.slice(0, 20));
          
          // ✅ Extract unique creators from NFTs (use seller, not contract owner)
          const uniqueCreators = new Map();
          nftsData.forEach(nft => {
            const creatorAddress = nft.seller || nft.owner;
            if (creatorAddress && !uniqueCreators.has(creatorAddress)) {
              uniqueCreators.set(creatorAddress, creatorAddress);
            }
          });

          const creatorAddresses = Array.from(uniqueCreators.keys()).slice(0, 8);
          console.log(`[Explore] Extracted ${creatorAddresses.length} unique creators from NFTs`);

          // Fetch user profiles for creators to get real usernames and profile pictures
          // Using the same pattern as Header.jsx avatarUrl logic
          const creatorProfiles = await Promise.all(
            creatorAddresses.map(async (address) => {
              try {
                console.log(`[Explore] Fetching profile for creator: ${address}`);
                const profile = await userAPI.getUserProfile(address);
                console.log(`[Explore] Profile data for ${address}:`, profile);
                
                const username = profile?.username || address.slice(0, 6) + '...' + address.slice(-4);
                
                // Priority: image -> avatar -> dicebear (same as Header.jsx)
                let profilePicture;
                if (profile?.image) {
                  profilePicture = profile.image;
                  console.log(`[Explore] ✅ Using profile.image for ${address}: ${profilePicture}`);
                } else if (profile?.avatar) {
                  profilePicture = profile.avatar;
                  console.log(`[Explore] ✅ Using profile.avatar for ${address}: ${profilePicture}`);
                } else {
                  profilePicture = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
                  console.log(`[Explore] Using generated avatar for ${address}`);
                }
                
                return {
                  address,
                  username: username,
                  profilePicture: profilePicture
                };
              } catch (err) {
                const fallback = address.slice(0, 6) + '...' + address.slice(-4);
                console.log(`[Explore] No profile for ${address}, error: ${err.message}`);
                return {
                  address,
                  username: fallback,
                  profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`
                };
              }
            })
          );

          console.log(`[Explore] Creator profiles fetched:`, creatorProfiles);

          // Create a map of address -> {username, profilePicture} for quick lookup
          const creatorMap = new Map();
          creatorProfiles.forEach(cp => {
            creatorMap.set(cp.address, { username: cp.username, profilePicture: cp.profilePicture });

            console.log(`[Explore] Added to map: ${cp.address} => ${cp.username}`);
          });

          // Use the most recent NFTs as "newly added" with real creator usernames and profile pictures
          const newlyAddedWithCreators = nftsData.slice(0, 12).map(nft => {
            const nftSeller = nft.seller || nft.owner;
            const creatorData = creatorMap.get(nftSeller) || {
              username: nftSeller?.slice(0, 6) + '...' + nftSeller?.slice(-4) || 'Unknown Creator',
              profilePicture: null
            };
            
            console.log(`[Explore] NFT "${nft.name}" seller=${nftSeller}, mapped creator=${creatorData.username}, picture=${creatorData.profilePicture ? 'yes' : 'no'}`);
            
            return {
              ...nft,
              addedAt: nft.createdAt || new Date().toISOString(),
              timeAgo: 'Recently added',
              creator: creatorData.username,
              creatorProfilePicture: creatorData.profilePicture,
              creatorWallet: nftSeller,
              description: nft.description || 'Newly listed NFT on Durchex marketplace.'
            };
          });
          
          console.log(`[Explore] Newly added NFTs with creators:`, newlyAddedWithCreators);
          setNewlyAddedNFTs(newlyAddedWithCreators);

          // Create full creator profiles for Top Creators section
          const fullCreatorProfiles = await Promise.all(
            creatorAddresses.map(async (address) => {
              try {
                const profile = await userAPI.getUserProfile(address);
                if (profile?.username) {
                  return {
                    id: address,
                    walletAddress: address,
                    username: profile.username,
                    avatar: profile.image || profile.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
                    bio: profile.bio || 'NFT creator on Durchex',
                    nftCount: nftsData.filter(nft => (nft.seller || nft.owner) === address).length,
                    followers: profile.followers || 0,
                    verificationStatus: profile.verificationStatus || null
                  };
                }
              } catch (err) {
                console.log(`[Explore] No profile for ${address}, using defaults`);
              }
              return {
                id: address,
                walletAddress: address,
                username: address.slice(0, 6) + '...' + address.slice(-4),
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
                bio: 'NFT creator on Durchex',
                nftCount: nftsData.filter(nft => (nft.seller || nft.owner) === address).length,
                followers: 0,
                verificationStatus: null
              };
            })
          );

          console.log(`[Explore] Fetched ${fullCreatorProfiles.length} creator profiles`);
          setCreators(fullCreatorProfiles);
        } else {
          console.warn("[Explore] No NFTs found in backend");
          setCreators([]);
        }
      } catch (error) {
        console.error("[Explore] Error fetching NFTs from backend:", error);
        setCreators([]);
      }
      
      // Mark as loaded after data is initialized
      setIsLoading(false);
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(initializeData, 100);
    return () => clearTimeout(timer);
  }, []);

  // Listen for new NFT mints and update creators list
  useEffect(() => {
    // Initialize socket connection
    const socket = socketService.connect();
    
    const handleNFTMinted = async (data) => {
      // Check if this is an NFT minting event
      const isMintEvent = data.type === "nft_minted" || 
                         (data.type === "user_activity" && data.nftName) ||
                         (data.user && data.nftName);
      
      if (isMintEvent) {
        // Refetch creators when new NFT is minted
        try {
          let nftsData = [];
          const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
          
          for (const network of networks) {
            try {
              const networkNfts = await nftAPI.getAllNftsByNetwork(network);
              if (networkNfts && Array.isArray(networkNfts)) {
                nftsData = [...nftsData, ...networkNfts];
              }
            } catch (err) {
              // Continue to next network
            }
          }

          // Extract unique creators from updated NFT data
          const uniqueCreators = new Map();
          nftsData.forEach(nft => {
            const creatorAddress = nft.creator || nft.owner;
            if (creatorAddress && !uniqueCreators.has(creatorAddress)) {
              uniqueCreators.set(creatorAddress, creatorAddress);
            }
          });

          const creatorAddresses = Array.from(uniqueCreators.keys()).slice(0, 8);

          // Fetch user profiles for these creators
          const creatorProfiles = await Promise.all(
            creatorAddresses.map(async (address) => {
              try {
                const profile = await userAPI.getUserProfile(address);
                return {
                  id: address,
                  walletAddress: address,
                  username: profile?.username || address.slice(0, 6) + '...' + address.slice(-4),
                  avatar: profile?.image || profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
                  bio: profile?.bio || 'NFT creator on Durchex',
                  nftCount: nftsData.filter(nft => (nft.creator || nft.owner) === address).length,
                  followers: profile?.followers || 0,
                  verificationStatus: profile?.verificationStatus || null
                };
              } catch (err) {
                return {
                  id: address,
                  walletAddress: address,
                  username: address.slice(0, 6) + '...' + address.slice(-4),
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
                  bio: 'NFT creator on Durchex',
                  nftCount: nftsData.filter(nft => (nft.creator || nft.owner) === address).length,
                  followers: 0,
                  verificationStatus: null
                };
              }
            })
          );

          setCreators(creatorProfiles);
          toast.success("New NFT minted! Creators list updated.");
        } catch (err) {
          console.warn("[Explore] Error updating creators on new mint:", err);
        }
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

            {/* Hero Analytics Chart */}
            <div className="mb-6">
              <HeroAnalyticsChart />
            </div>

            {/* Auto-sliding NFT Slider */}
            <div className="relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800">
              <div className="nft-slider-container overflow-hidden">
                <div className="nft-slider-track flex gap-4">
                  {/* Duplicate NFTs for seamless loop */}
                  {[...displayedNFTs, ...displayedNFTs].map((nft, idx) => (
                    <Link
                      key={`${nft.id}_${idx}`}
                      to={`/nft/${nft.itemId}`}
                      className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] group"
                    >
                      <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-105">
                        <div className="relative aspect-square overflow-hidden bg-gray-800">
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              e.target.style.display = 'none';
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

          {/* Analytics Section - Full Width */}
          <div className="w-full mt-8 mb-8">
            <NFTAnalyticsSection />
          </div>

          {/* Newly Added NFTs Section - Full Width */}
          <div className="w-full mt-12 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-300 bg-clip-text text-transparent">
                Newly Added NFTs
              </h2>
              <p className="text-gray-400 text-sm">Fresh listings on Durchex - discover the latest additions</p>
            </div>

            {/* Newly Added NFTs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {displayedNewlyAddedNFTs.map((nft) => (
                <Link
                  key={nft.id}
                  to={`/nft/${nft.itemId}`}
                  className="group block bg-gray-900/50 rounded-xl border border-gray-800 hover:border-green-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
                >
                  <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-800">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    {/* Overlay with details on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <div className="text-white">
                        <p className="text-xs text-green-400 font-medium mb-1">{nft.timeAgo}</p>
                        <p className="text-xs text-gray-300 line-clamp-2 mb-2">{nft.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                          <img
                            src={nft.creatorProfilePicture}
                            alt={nft.creator}
                            className="w-5 h-5 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${nft.creator}`;
                            }}
                          />
                            <span className="text-gray-400">by {nft.creator}</span>
                          </div>
                          <span className="text-green-400 font-medium">{nft.price} ETH</span>
                        </div>
                      </div>
                    </div>
                    {/* New badge */}
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full opacity-90">
                      NEW
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-white text-sm truncate mb-1 group-hover:text-green-400 transition-colors">
                      {nft.name}
                    </h3>
                    <p className="text-gray-400 text-xs truncate mb-2">{nft.collection}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FiStar className="text-yellow-400" />
                          {nft.likes}
                        </span>
                        <span>{nft.views} views</span>
                      </div>
                      <span className="text-green-400 font-medium">{nft.price} ETH</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center mt-8">
              <Link
                to="/explore/all"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
              >
                View All Newly Added NFTs
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
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
                      {(() => {
                        // Support both verificationStatus (from DB) and verificationType (from mock data)
                        const verificationStatus = creator?.verificationStatus || (creator?.verificationType === 'gold' ? 'super_premium' : creator?.verificationType === 'white' ? 'premium' : null);
                        const badge = verificationStatus ? getVerificationBadge(verificationStatus) : null;
                        
                        if (badge) {
                          return (
                            <span
                              title={badge.title}
                              className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 z-10 pointer-events-none"
                            >
                              <img
                                src={badge.imageUrl}
                                alt={badge.label}
                                className="w-6 h-6 object-contain drop-shadow-[0_0_2px_rgba(0,0,0,0.6)]"
                                onError={(e)=>{ e.currentTarget.style.display='none'; }}
                              />
                            </span>
                          );
                        }
                        return null;
                      })()}
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

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Explore;
