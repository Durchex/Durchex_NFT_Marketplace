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

function Hero() {
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

  // Auto-advance NFT slider to show one at a time
  useEffect(() => {
    if (!displayedAllNfts || displayedAllNfts.length === 0) return;

    const interval = setInterval(() => {
      setCurrentNFTIndex((prev) => (prev + 1) % displayedAllNfts.length);
    }, 4000); // Change NFT every 4 seconds

    return () => clearInterval(interval);
  }, [displayedAllNfts]);

  const fetchallnftItems = () => {
    const addressString = selectedChain.toString();
    nftAPI.getAllNftsByNetwork(addressString)
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
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1>Hero Page - Simplified</h1>
        <p>NFT slider will take 50%, Top NFTs 25%, Top Creators 25%</p>
      </main>
      <Footer />
    </div>
  );
}

export default Hero;
