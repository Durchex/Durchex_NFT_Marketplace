import React, { useContext, useEffect, useState } from "react";
import Header from "../components/Header";
import LoadingNFTRow from "../components/LoadingNftRow";
import RealTimeData from "../components/RealTimeData";
import { ICOContent } from "../Context/index";
import Footer from "../FooterComponents/Footer";

import SlidingContainer from "../components/SlindingContainer";
import { nftCollections } from "../utils";
import { Link, useNavigate } from "react-router-dom";
const SlidingContainerLazy = React.lazy(() =>
  import("../components/SlindingContainer2")
);

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
  }, [navigate]);

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

        <RealTimeData nftCollections={allNfts} />

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
    </div>
  );
}

export default App;
