import React, { useContext, useEffect, useState } from "react";
import Header from "../components/Header";
import LoadingNFTRow from "../components/LoadingNftRow";
import { ICOContent } from "../Context/index";
import Footer from "../FooterComponents/Footer";
import socketService from "../services/socketService";
import { FiCheck, FiStar } from "react-icons/fi";
import toast from "react-hot-toast";

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

  return Array.from({ length: count }, (_, i) => ({
    id: `creator_${i}`,
    username: names[i % names.length],
    walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${names[i % names.length]}`,
    bio: bios[i % bios.length],
    isVerified: Math.random() > 0.5,
    nftCount: Math.floor(Math.random() * 50) + 5,
    followers: Math.floor(Math.random() * 10000) + 100
  }));
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
  console.log("🚀 ~ App ~ allNfts:", allNfts);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreNFTs, setHasMoreNFTs] = useState(true);
  const [offset, setOffset] = useState(0);
  const [creators, setCreators] = useState([]);

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
    fetchallnftItems();
    fetchAllSingleNft();
    
    // Load creators from localStorage or generate new ones
    const savedCreators = localStorage.getItem("durchex_creators");
    if (savedCreators) {
      try {
        setCreators(JSON.parse(savedCreators));
      } catch {
        const newCreators = generateMockCreators(8);
        setCreators(newCreators);
        localStorage.setItem("durchex_creators", JSON.stringify(newCreators));
      }
    } else {
      const newCreators = generateMockCreators(8);
      setCreators(newCreators);
      localStorage.setItem("durchex_creators", JSON.stringify(newCreators));
    }
  }, [navigate]);
  
  // Listen for new NFT mints and remove a mock creator
  useEffect(() => {
    const socket = socketService.connect();
    
    const handleNFTMinted = (data) => {
      const isMintEvent = data.type === "nft_minted" || 
                         (data.type === "user_activity" && data.nftName) ||
                         (data.user && data.nftName);
      
      if (isMintEvent) {
        setCreators((prev) => {
          const mockCreators = prev.filter(c => c.id.startsWith("creator_"));
          if (mockCreators.length > 0) {
            const updated = prev.filter((_, idx) => {
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

  const fetchallnftItems = () => {
    const addressString = selectedChain.toString();
    fetch(`https://backend-2wkx.onrender.com/api/v1/nft/nfts/${addressString}`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const first12Nfts = data.slice(0, 12); // get first 12 items
            setallNfts(first12Nfts);
            localStorage.setItem("allNFTs", JSON.stringify(first12Nfts));
          } else {
            setallNfts([]);
          }

        })
      .catch((err) => console.error("Error fetching cart:", err));
  };

  const fetchCollectionItems = () => {
    // Get cart from localStorage if it exists
    const storedCart = JSON.parse(localStorage.getItem("tradingNFTs") || "[]");
    if (storedCart.length > 0) {
      setTradingNFTs(storedCart);
    } else {
      const addressString = selectedChain.toString();
      fetch(
        `https://backend-2wkx.onrender.com/api/v1/nft/collections/${addressString}`
      )
        .then((res) => {
          return res.json();
        })
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
    fetch(
      `https://backend-2wkx.onrender.com/api/v1/nft/single-nfts/${addressString}`
    )
      .then((res) => {
        return res.json();
      })
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
          const response = await fetch(
            "https://backend-2wkx.onrender.com/api/v1/nft/nfts/check",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                itemId: formattedItem.itemId,
                network: formattedItem.network,
              }),
            }
          );

          const data = await response.json();
          if (data.exists) {
            // console.log(
            //   `NFT with itemId ${formattedItem.itemId} already exists.`
            // );
            continue; // Skip saving if it already exists
          }

          // Send the data to the backend API to save it
          const saveResponse = await fetch(
            "https://backend-2wkx.onrender.com/api/v1/nft/nfts",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(formattedItem),
            }
          );

          const savedData = await saveResponse.json();
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
            {allNfts?.map((item, index) => (
              <div
                key={index}
                className="bg-red-600 rounded-lg h-[250px] sm:w-[200px] md:w-[250px] flex items-end relative slide-item overflow-hidden"
              >
                <Link to={`/nft/${item.tokenId}/${item.itemId}/${item.price}`}>
                <span className="text-medium md:text-xl text-blue-900 bg-black px-2 rounded-md absolute left-5 font-bold bottom-2">
                  {item.name}
                </span>
                <img
                  className="w-full h-full object-cover absolute top-0 left-0"
                  src={item.image}
                  alt={item.name}
                />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Flex Layout - Popular NFTs and Creators */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full items-start my-8">
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
                  {/* Use actual NFTs from allNfts, duplicate for seamless loop */}
                  {allNfts && allNfts.length > 0 ? (
                    [...allNfts, ...allNfts].map((nft, idx) => (
                      <Link
                        key={`popular_${nft.itemId || nft.tokenId || idx}_${idx}`}
                        to={`/nft/${nft.tokenId}/${nft.itemId}/${nft.price}`}
                        className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] group"
                      >
                        <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-105">
                          <div className="relative aspect-square overflow-hidden">
                            <img
                              src={nft.image || `https://picsum.photos/400/400?random=${idx}`}
                              alt={nft.name || "NFT"}
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
                                  <span className="text-sm font-medium">0</span>
                                </div>
                                <div className="text-sm font-medium">
                                  {nft.price ? (parseFloat(nft.price) / 1e18).toFixed(4) : "0.0000"} ETH
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-white truncate mb-1">{nft.name || "Unknown NFT"}</h3>
                            <p className="text-gray-400 text-sm truncate">{nft.collection || "Collection"}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="w-full text-center py-12 text-gray-400">
                      <p>No NFTs available yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Creators List (Smaller) */}
          <div className="w-full lg:w-[35%] lg:flex-1 lg:max-w-sm">
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
                      {creator.isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1">
                          <FiCheck className="text-white text-xs" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{creator.username}</h3>
                        {creator.isVerified && (
                          <FiCheck className="text-blue-500 flex-shrink-0" title="Verified Creator" />
                        )}
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
            <SlidingContainer TradingNFTs={TradingNFTs} />
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
              <SlidingContainerLazy TradingNFTs={singleNfts} />
            </React.Suspense>
          </div>
        )}
      </main>
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
}

export default App;
