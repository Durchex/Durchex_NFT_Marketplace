import React, { useContext, useEffect, useState } from "react";
import Header from "../components/Header";
import LoadingNFTRow from "../components/LoadingNftRow";
import { ICOContent } from "../Context/index";
import Footer from "../FooterComponents/Footer";
import socketService from "../services/socketService";
import { FiCheck, FiStar } from "react-icons/fi";
import toast from "react-hot-toast";
import { getVerificationBadge } from "../utils/verificationUtils";
import { nftAPI, userAPI } from "../services/api";

import SlidingContainer from "../components/SlindingContainer";
import { nftCollections } from "../utils";
import { Link, useNavigate } from "react-router-dom";
const SlidingContainerLazy = React.lazy(() =>
  import("../components/SlindingContainer2")
);

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

function App() {
  const navigate = useNavigate();
  const contexts = useContext(ICOContent);
  const {
    tokenURI,
    fetchMetadataFromPinata,
    getAllListings,
    getActiveListings,
    selectedChain,
  } = contexts;
  const [TradingNFTs, setTradingNFTs] = useState([]);
  const [dummyAllNFTs, setDummyAllNFTs] = useState(nftCollections);
  const [singleNfts, setSingleNfts] = useState([]);
  const [allNfts, setallNfts] = useState([]);
  // Fallback: use local dummy NFTs when backend returns empty
  const displayedAllNfts = (allNfts && allNfts.length > 0) ? allNfts : dummyAllNFTs;
  console.log("🚀 ~ App ~ allNfts:", allNfts);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreNFTs, setHasMoreNFTs] = useState(true);
  const [offset, setOffset] = useState(0);
  const [creators, setCreators] = useState([]);
  const [currentNFTIndex, setCurrentNFTIndex] = useState(0);

  // useEffect(() => {
  //   const savedNFTs = localStorage.getItem("tradingNFTs");
  //   if (savedNFTs) {
  //     setTradingNFTs(JSON.parse(savedNFTs)); // Load data from localStorage
  //     localStorage.setItem("tradingNFTs", JSON.stringify(TradingNFTs));
  //   } else {
  //     fetchCollectionItems(); // Fallback to fetching NFTs if no saved data
  //   }
  // }, []);

   useEffect(() => {
    fetchCollectionItems();
    fetchLatestNftsFromAllNetworks();
    fetchAllSingleNft();
  }, [navigate]);
  
  // Listen for new NFT mints and refresh latest NFTs
  useEffect(() => {
    const socket = socketService.connect();
    
    const handleNFTMinted = (data) => {
      const isMintEvent = data.type === "nft_minted" || 
                         (data.type === "user_activity" && data.nftName) ||
                         (data.user && data.nftName);
      
      if (isMintEvent) {
        // Refresh latest NFTs when new one is minted
        setTimeout(() => {
          fetchLatestNftsFromAllNetworks();
          toast.success("New NFT minted! Updating latest NFTs...");
        }, 500);
      }
    };

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

  // Auto-advance NFT slider to show one at a time
  useEffect(() => {
    if (!displayedAllNfts || displayedAllNfts.length === 0) return;

    const interval = setInterval(() => {
      setCurrentNFTIndex((prev) => (prev + 1) % displayedAllNfts.length);
    }, 4000); // Change NFT every 4 seconds

    return () => clearInterval(interval);
  }, [displayedAllNfts]);

  const fetchLatestNftsFromAllNetworks = async () => {
    try {
      let allNftsFromAllNetworks = [];
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum'];
      
      // Fetch NFTs from all networks
      for (const network of networks) {
        try {
          const networkNfts = await nftAPI.getAllNftsByNetwork(network);
          if (Array.isArray(networkNfts) && networkNfts.length > 0) {
            allNftsFromAllNetworks = [...allNftsFromAllNetworks, ...networkNfts];
          }
        } catch (err) {
          console.warn(`Error fetching from ${network}:`, err.message);
        }
      }

      // Sort by createdAt (newest first)
      allNftsFromAllNetworks.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      // Get latest 20 NFTs
      const latestNfts = allNftsFromAllNetworks.slice(0, 20);
      
      if (latestNfts.length > 0) {
        console.log(`[Hero] Fetched ${latestNfts.length} latest NFTs from all networks`);
        setallNfts(latestNfts);
        localStorage.setItem("allNFTs", JSON.stringify(latestNfts));
        
        // Extract unique creators from latest NFTs and fetch their user profiles
        const creatorsMap = {};
        const creatorAddresses = new Set();
        
        latestNfts.forEach((nft) => {
          // Use seller (who listed it) as the creator, fallback to owner
          const creatorAddress = nft.seller || nft.owner;
          if (creatorAddress) {
            creatorAddresses.add(creatorAddress);
            if (!creatorsMap[creatorAddress]) {
              creatorsMap[creatorAddress] = {
                id: creatorAddress,
                username: creatorAddress.slice(0, 6) + '...' + creatorAddress.slice(-4),
                walletAddress: creatorAddress,
                avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`,
                bio: `Creator on Durchex`,
                verificationType: null,
                isVerified: false,
                nftCount: 1,
                followers: 0
              };
            } else {
              creatorsMap[creatorAddress].nftCount += 1;
            }
          }
        });
        
        // Fetch user profiles for creators to get real usernames and images
        const creatorsWithProfiles = await Promise.all(
          Array.from(creatorAddresses).map(async (address) => {
            try {
              const userProfile = await userAPI.getUserProfile(address);
              if (userProfile?.username) {
                // User has a profile with username
                return {
                  ...creatorsMap[address],
                  username: userProfile.username,
                  avatar: userProfile.profileImage || creatorsMap[address].avatar,
                  bio: userProfile.bio || creatorsMap[address].bio,
                  email: userProfile.email
                };
              }
            } catch (err) {
              // User profile doesn't exist, use default
              console.log(`No profile for ${address}, using default`);
            }
            return creatorsMap[address];
          })
        );
        
        const uniqueCreators = creatorsWithProfiles.slice(0, 8);
        
        if (uniqueCreators.length > 0) {
          setCreators(uniqueCreators);
          localStorage.setItem("durchex_creators", JSON.stringify(uniqueCreators));
          console.log(`[Hero] Extracted ${uniqueCreators.length} unique creators with profiles from latest NFTs`);
        }
      } else {
        console.warn("[Hero] No NFTs found from any network");
        setallNfts([]);
      }
    } catch (error) {
      console.error("[Hero] Error fetching latest NFTs:", error);
      setallNfts([]);
    }
  };

  const fetchCollectionItems = () => {
    // Get cart from localStorage if it exists
    const storedCart = JSON.parse(localStorage.getItem("tradingNFTs") || "[]");
    if (storedCart.length > 0) {
      setTradingNFTs(storedCart);
    } else {
      const addressString = selectedChain.toString();
      nftAPI.getCollectionsByNetwork(addressString)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const collections = data[0].collections || [];
            setTradingNFTs(collections);
            localStorage.setItem("tradingNFTs", JSON.stringify(collections));
          } else {
            setTradingNFTs([]); // fallback empty
          }

          setIsLoading(false);
        })
        .catch((err) => console.error("Error fetching cart:", err));
    }
  };
  const fetchAllSingleNft = () => {
    // Get cart from localStorage if it exists
    // const storedCart = JSON.parse(localStorage.getItem("tradingNFTs") || "[]");
    // if (storedCart.length > 0) {
    //   setTradingNFTs(storedCart);
    // } else {
    const addressString = selectedChain.toString();
    nftAPI.getSingleNfts(addressString)
      .then((data) => {
        console.log("🚀 123456789~ .then ~ data:", data);

        // if (Array.isArray(data) && data.length > 0) {
        //   const collections = data[0].collections || [];
        //   setTradingNFTs(collections);
        //   localStorage.setItem("tradingNFTs", JSON.stringify(collections));
        // } else {
        //   setTradingNFTs([]); // fallback empty
        // }

        setSingleNfts(data); // fallback empty
        setIsLoading(false);
      })
      .catch((err) => console.error("Error fetching cart:", err));
    // }
  };

 

  useEffect(() => {
    const fetching = async (functions, trading) => {
      try {
        const response = await functions();

        const formattedListings = [];

        for (const item of response) {
          const formattedItem = {
            itemId: item.itemId.toString(),
            nftContract: item.nftContract,
            tokenId: item.tokenId.toString(),
            owner: item.owner,
            seller: item.seller,
            price: item.price.toString(),
            currentlyListed: item.currentlyListed,
          };

          const url = await tokenURI(formattedItem.tokenId);

          // Replace any restricted gateway
          const safeUrl = url.replace(
            "https://copper-leading-yak-964.mypinata.cloud",
            "https://silver-solid-beetle-367.mypinata.cloud"
          );

          const metadata = await fetchMetadataFromPinata(safeUrl);
          // const metadata = await fetchMetadataFromPinata(url);

          formattedItem.network = selectedChain;
          formattedItem.collection = metadata.collection || " ";
          formattedItem.name = metadata.name;
          formattedItem.description = metadata.description;
          formattedItem.image = metadata.image;
          formattedItem.category = metadata.category;
          formattedItem.properties = metadata.properties;
          formattedItem.royalties = metadata.royalties;

          // Now, check if the NFT exists in the backend before storing
          const data = await nftAPI.checkNftExists({
            itemId: formattedItem.itemId,
            network: formattedItem.network,
          });

          if (data.exists) {
            // console.log(
            //   `NFT with itemId ${formattedItem.itemId} already exists.`
            // );
            continue; // Skip saving if it already exists
          }

          // Send the data to the backend API to save it
          const savedData = await nftAPI.createNft(formattedItem);
          console.log(
            "🚀 ~ fetcooooooooooooooooooooooooooooohing ~ savedData:",
            savedData
          );
          formattedListings.push(savedData);
        }

        // trading
        //   ? setTradingNFTs(formattedListings)
        //   : setallNfts(formattedListings);
        // if (formattedListings.length > 0) setIsLoading(false);
      } catch (error) {
        console.error("Error fetching active listings or metadata:", error);
        // Retry using correct reference
        // setTimeout(() => fetching(functions, trading), 5000);
      }
    };

    fetching(getActiveListings, true);
  }, [fetchMetadataFromPinata, getActiveListings, getAllListings, tokenURI]);

  // useEffect(() => {
  //   if (TradingNFTs.length > 0 && allNfts.length > 0) {
  //     setIsLoading(false);
  //   }
  // }, [TradingNFTs, allNfts]);

  // const aLLNfts = allNfts

 
 
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      <main className="mx-auto mt8 px4 overflow-x-auto">
        <div className="sliding-container">
          <div className="sliding-nfts grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedAllNfts.map((item, index) => {
              // Get creator/owner address for profile link
              const creatorAddress = item.owner || item.seller || item.creator;
              // Find creator in creators array to get verification status and real data
              const creator = creators.find(c => 
                c.walletAddress?.toLowerCase() === creatorAddress?.toLowerCase()
              );
              // Use creator's profile picture if available, otherwise generate avatar
              const avatarUrl = creator?.avatar || (creatorAddress 
                ? `https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name || index}`);
              
              return (
                <div
                  key={index}
                  className="bg-red-600 rounded-lg h-[250px] sm:w-[200px] md:w-[250px] flex items-end relative slide-item overflow-hidden group"
                >
                  {/* WhatsApp-style Profile Icon - Clickable to creator profile (always render) */}
                      <div className="absolute top-3 left-3 z-30 pointer-events-auto">
                        {creatorAddress ? (
                          <Link
                            to={`/creator/${creatorAddress}`}
                            onClick={(e) => e.stopPropagation()}
                            className="relative group/avatar"
                            title={creator?.username || 'Creator'}
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg ring-2 ring-purple-500/50 bg-gray-800 relative group-hover/avatar:ring-purple-400 group-hover/avatar:shadow-purple-500/50 transition-all duration-300">
                              <img
                                src={avatarUrl}
                                alt={creator?.username || 'Creator'}
                                className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress || (item.name || index)}`;
                                }}
                              />
                            </div>
                            {/* Creator username tooltip on hover */}
                            <div className="absolute left-14 top-0 bg-gray-900/95 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 pointer-events-none">
                              {creator?.username || `Creator ${creatorAddress.slice(0, 6)}...`}
                            </div>
                          </Link>
                        ) : (
                          <div className="relative" title={item.name || 'Creator'}>
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg ring-2 ring-purple-500/50 bg-gray-800 relative">
                              <img
                                src={avatarUrl}
                                alt={item.name || 'Creator'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name || index}`;
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Verification badge or online indicator (preserve previous logic) */}
                        {(() => {
                          const verificationStatus = creator?.verificationStatus || (creator?.verificationType === 'gold' ? 'super_premium' : creator?.verificationType === 'white' ? 'premium' : null);
                          const badge = verificationStatus ? getVerificationBadge(verificationStatus) : null;

                          if (badge) {
                            return (
                              <span
                                title={badge.title}
                                className="absolute top-[42px] left-[42px] inline-flex items-center justify-center w-5 h-5 z-40 pointer-events-none"
                              >
                                <img
                                  src={badge.imageUrl}
                                  alt={badge.label}
                                  className="w-5 h-5 object-contain drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]"
                                  onError={(e)=>{ e.currentTarget.style.display='none'; }}
                                />
                              </span>
                            );
                          }

                          return (
                            <span aria-hidden="true" className="absolute top-[42px] left-[42px] pointer-events-none z-40 flex items-center justify-center">
                              <span className="online-pulse" />
                              <span className="online-dot" />
                            </span>
                          );
                        })()}
                      </div>

                  {/* NFT Image - Clickable to NFT details */}
                  <Link 
                    to={`/nft/${item.tokenId}/${item.itemId}/${item.price}`}
                    className="w-full h-full relative"
                  >
                    <img
                      className="w-full h-full object-cover absolute top-0 left-0"
                      src={item.image}
                      alt={item.name}
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two Column Flex Layout - Popular NFTs and Creators */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full items-start my-8">
          {/* Column 1: Popular NFTs Slider (50%) */}
          <div className="w-full lg:w-[50%] lg:flex-1">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-300 bg-clip-text text-transparent">
                Most Popular NFTs
              </h2>
              <p className="text-gray-400 text-sm">Discover trending NFTs on Durchex</p>
            </div>

            {/* Auto-sliding NFT Slider - One at a time, Rectangular with fixed height matching second column */}
            <div className="relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800 h-[600px]">
              {displayedAllNfts && displayedAllNfts.length > 0 ? (
                // Ensure index is within bounds of the displayed array
                (() => {
                  const activeIndex = displayedAllNfts.length > 0 ? currentNFTIndex % displayedAllNfts.length : 0;
                  const activeNFT = displayedAllNfts[activeIndex];
                  return (
                    <Link
                      to={`/nft/${activeNFT.tokenId}/${activeNFT.itemId}/${activeNFT.price}`}
                      className="group h-full flex flex-col"
                    >
                      <div 
                        key={activeIndex}
                        className="nft-slide-item bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all duration-500 hover:scale-[1.02] h-full flex flex-col"
                      >
                        <div className="relative w-full flex-1 overflow-hidden min-h-0 nft-image-container">
                          <img
                            src={activeNFT.image || `https://picsum.photos/800/600?random=${activeIndex}`}
                            alt={activeNFT.name || "NFT"}
                            className="w-full h-full object-cover scale-150 group-hover:scale-[1.7] transition-transform duration-700"
                            onError={(e) => {
                              e.target.src = `https://picsum.photos/800/600?random=${activeIndex}`;
                            }}
                          />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-2">
                            <FiStar className="text-yellow-400" />
                            <span className="text-sm font-medium">0</span>
                          </div>
                          <div className="text-sm font-medium">
                            {activeNFT.price ? (parseFloat(activeNFT.price) / 1e18).toFixed(4) : "0.0000"} ETH
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 flex-shrink-0">
                      <h3 className="font-semibold text-xl text-white mb-2">{activeNFT.name || "Unknown NFT"}</h3>
                      <p className="text-gray-400 text-sm mb-4">{activeNFT.collection || "Collection"}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>View Details →</span>
                      </div>
                    </div>
                    </div>
                  </Link>
                  );
                })()
              ) : (
                <div className="w-full h-full text-center py-12 text-gray-400 flex items-center justify-center">
                  <p>No NFTs available yet</p>
                </div>
              )}
              
              {/* Navigation dots */}
              {allNfts && allNfts.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                  {allNfts.slice(0, Math.min(allNfts.length, 10)).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentNFTIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentNFTIndex ? 'w-8 bg-purple-500' : 'w-2 bg-gray-600 hover:bg-gray-500'
                      }`}
                      aria-label={`Go to NFT ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Top NFTs List */}
          <div className="w-full lg:w-[25%] lg:flex-1 lg:max-w-sm">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-300 bg-clip-text text-transparent">
                Top NFTs
              </h2>
              <p className="text-gray-400 text-sm">Trending NFTs on Durchex</p>
            </div>

            {/* Top NFTs List */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {allNfts && allNfts.slice(0, 8).map((nft, index) => (
                <Link
                  key={nft.id || index}
                  to={`/nft/${nft.id || `nft_${index}`}`}
                  className="block bg-gray-900/50 rounded-xl p-4 border border-gray-800 hover:border-purple-500 transition-all duration-300 hover:bg-gray-900/70"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img
                        src={nft.image || `https://picsum.photos/300/300?random=${index}`}
                        alt={nft.name || `NFT ${index + 1}`}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-gray-700"
                        onError={(e) => {
                          e.target.src = `https://picsum.photos/300/300?random=${index}`;
                        }}
                      />
                      <div className="absolute -top-2 -left-2 bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate text-sm">{nft.name || `NFT #${index + 1}`}</h3>
                      </div>
                      <p className="text-gray-400 text-xs truncate mb-2">{nft.collection || "Collection"}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{nft.price ? `${parseFloat(nft.price) / 1e18} ETH` : "0.00 ETH"}</span>
                        <span>#{index + 1}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {(!allNfts || allNfts.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <p>No NFTs yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Creators List */}
          <div className="w-full lg:w-[25%] lg:flex-1 lg:max-w-sm">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-300 bg-clip-text text-transparent">
                Top Creators
              </h2>
              <p className="text-gray-400 text-sm">Verified creators on Durchex</p>
            </div>

            {/* Creators List */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {creators.map((creator) => (
                <Link
                  key={creator.id}
                  to={`/creator/${creator.walletAddress}`}
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
                          className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 z-10 pointer-events-none"
                        >
                          <img
                            src="https://imgur.com/5cAUe81.png"
                            alt="Gold Verified"
                            className="w-6 h-6 object-contain drop-shadow-[0_0_2px_rgba(0,0,0,0.6)]"
                            onError={(e)=>{ e.currentTarget.style.display='none'; }}
                          />
                        </span>
                      )}
                      {creator.verificationType === 'white' && (
                        <span
                          title="Verified"
                          className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 z-10 pointer-events-none"
                        >
                          <img
                            src="https://imgur.com/pa1Y2LB.png"
                            alt="Verified"
                            className="w-6 h-6 object-contain drop-shadow-[0_0_2px_rgba(0,0,0,0.6)]"
                            onError={(e)=>{ e.currentTarget.style.display='none'; }}
                          />
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
                  <p>No creators yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-xl md:text-3xl font-bold p-6 bg-gradient-to-tr from-purple-600 to-pink-300  bg-clip-text text-transparent">
          Trending collections
        </h2>
        {isLoading ? (
          <LoadingNFTRow />
        ) : (
          <div className="sliding-container overflow-x-auto border-2 rounded-lg border-purple-950/30 ">
            {/* Provide fallback mock collections when backend returns empty */}
            {(() => {
              const tradingForDisplay = (TradingNFTs && TradingNFTs.length > 0)
                ? TradingNFTs
                : [
                    {
                      name: 'Durchex Mock Collection',
                      nfts: dummyAllNFTs.slice(0, 8).map(n => ({
                        nft: {
                          ...n,
                          itemId: n.id,
                          tokenId: n.id,
                          price: n.price,
                          collection: n.collection,
                        }
                      }))
                    }
                  ];

              return <SlidingContainer TradingNFTs={tradingForDisplay} />;
            })()}
          </div>
        )}

        {/* Sliding effect for Minting now */}
        <h2 className="text-xl md:text-3xl font-bold p-6 bg-gradient-to-tr from-purple-600 to-pink-300  bg-clip-text text-transparent overflow">
          Trending Non-collection
        </h2>
        {isLoading ? (
          <LoadingNFTRow />
        ) : (
          <div className="sliding-container overflow-x-auto border-2 rounded-lg border-purple-950/20 ">
            <React.Suspense fallback={<div>Loading...</div>}>
              {/* singleNfts is expected to be an array of nft objects; provide mock fallback when empty */}
              {(() => {
                const singleForDisplay = (singleNfts && singleNfts.length > 0)
                  ? singleNfts.map(s => ({
                      ...s,
                      itemId: s.id || s.itemId || s.tokenId,
                      tokenId: s.tokenId || s.id || s.itemId,
                      price: s.price || s.floorPrice || '0'
                    }))
                  : dummyAllNFTs.slice(0, 12).map(n => ({
                      ...n,
                      itemId: n.id,
                      tokenId: n.id,
                      price: n.price,
                    }));

                return <SlidingContainerLazy TradingNFTs={singleForDisplay} />;
              })()}
            </React.Suspense>
          </div>
        )}
      </main>
      <Footer />
      
      <style>{`
        .nft-slide-item {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
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

        /* Online pulse indicator styles for avatar */
        .online-pulse {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: rgba(34,197,94,0.35); /* green-400 translucent */
          transform: translate(0, 0);
          z-index: 0;
          animation: durchex-pulse 1.6s infinite ease-out;
        }

        .online-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #16a34a; /* green-600 */
          border: 2px solid rgba(255,255,255,0.95);
          z-index: 10;
        }

        @keyframes durchex-pulse {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          70% {
            transform: scale(1.8);
            opacity: 0;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
