import { ICOContent } from "../Context/index";
import { useContext, useEffect, useState } from "react";
import Header from "../components/Header";
import NFTCard from "../components/NFTCard";
import RealTimeData from "../components/RealTimeData";
import Footer from "../components/Footer";

function App() {
  const contexts = useContext(ICOContent);
  const {
    tokenURI,
    fetchMetadataFromPinata,
    getAllListings,
    getActiveListings,
    // getNFTById_,
    // shortenAddress,
    // accountBalance,
    // setAccountBalance,
    // address,
    // connectWallet,
  } = contexts;
  const [TradingNFTs, setTradingNFTs] = useState([]);
  const [allNfts, setallNfts] = useState([]);
  console.log("🚀 ~ Section_2 ~ TradingNFTs:", TradingNFTs.length);
  // const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const nftData = Array(8).fill({
  //   collectionName: "Happy cow collection",
  //   nftName: "Happy cow dance #1242",
  // });

  useEffect(() => {
    const fetching = async (functions, trading) => {
      try {
        const response = await functions();
        console.log("🚀 ~ .then ~ response:", response);

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
          const parsedFile = await fetchMetadataFromPinata(url);
          const metadata = JSON.parse(parsedFile.file);
          formattedItem.name = metadata.name;
          formattedItem.description = metadata.description;
          formattedItem.image = metadata.image;
          formattedItem.category = metadata.catogory;
          formattedItem.properties = metadata.properties;
          formattedItem.royalties = metadata.royalties;
          formattedListings.push(formattedItem);
        }

        trading
          ? setTradingNFTs(formattedListings)
          : setallNfts(formattedListings);
      } catch (error) {
        console.error("Error fetching active listings or metadata:", error);
      }
    };

    fetching(getActiveListings, true);
    fetching(getAllListings, false);
  }, [fetchMetadataFromPinata, getActiveListings, getAllListings, tokenURI]);

  // useEffect(() => {
  //   const fetching = async (functions, trading) => {
  //     try {
  //       const response = await functions();
  //       console.log("🚀 ~ .then ~ response:", response);

  //       // Create an empty array to store formatted items
  //       const formattedListings = [];

  //       // Iterate over each item in the response
  //       for (const item of response) {
  //         const formattedItem = {
  //           itemId: item.itemId.toString(),
  //           nftContract: item.nftContract,
  //           tokenId: item.tokenId.toString(),
  //           owner: item.owner,
  //           seller: item.seller,
  //           price: item.price.toString(),
  //           currentlyListed: item.currentlyListed,
  //         };

  //         // Fetch the tokenURI and metadata using the tokenId
  //         const url = await tokenURI(formattedItem.tokenId);

  //         // Fetch metadata from the tokenURI
  //         const parsedFile = await fetchMetadataFromPinata(url);
  //         const metadata = JSON.parse(parsedFile.file);

  //         // Add each field of metadata to the formatted item
  //         formattedItem.name = metadata.name;
  //         formattedItem.description = metadata.description;
  //         formattedItem.image = metadata.image; // assuming the metadata has an `image` field
  //         formattedItem.category = metadata.catogory; // add other fields as needed
  //         formattedItem.properties = metadata.properties; // add other fields as needed
  //         formattedItem.royalties = metadata.royalties; // add other fields as needed
  //         // formattedItem.creator = metadata.creator; // add other fields as needed

  //         // Push the formatted item into the array
  //         formattedListings.push(formattedItem);
  //       }

  //       // Now set the state with the entire array of listings
  //       trading
  //         ? setTradingNFTs(formattedListings)
  //         : setallNfts(formattedListings);
  //     } catch (error) {
  //       console.error("Error fetching active listings or metadata:", error);
  //     }
  //   };

  //   fetching(getActiveListings, true);
  //   fetching(getAllListings, false);
  // }, []);
  // console.log("get all nft", allNfts);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto mt8 px4 overflow-x-auto">
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {allNfts?.map((item) => (
            <div
              key={item}
              className="bg-gray-600 rounded-lg aspectsquare flex items-end relative"
            >
              <span className="text-xl text-blue-900  absolute left-5 font-bold  bottom-2">
                {item.name}
              </span>
              <img
                className="w-full h-96 object-cover"
                src={item.image}
                alt={item.name}
              />
            </div>
          ))}
        </div> */}
        {/* Sliding effect for allNfts */}
        <div className="sliding-container">
          <div className="sliding-nfts grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allNfts?.map((item) => (
              <div
                key={item.itemId}
                className="bg-gray-600 rounded-lg aspectsquare flex items-end relative slide-item"
              >
                <span className="text-xl text-blue-900 absolute left-5 font-bold bottom-2">
                  {item.name}
                </span>
                <img
                  className="w-full h-96 object-cover"
                  src={item.image}
                  alt={item.name}
                />
              </div>
            ))}
          </div>
        </div>

        <RealTimeData />

        {/* <h2 className="text-3xl font-bold p-6">Trending collections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 p-6">
          {TradingNFTs.slice(0, 7).map((nft, index) => (
            <NFTCard key={index} {...nft} />
          ))}
        </div>

        <h2 className="text-3xl font-bold p-6">Minting now</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 p-6">
          {TradingNFTs.slice(0, 7).map((nft, index) => (
            <NFTCard key={index} {...nft} />
          ))}
        </div> */}
        {/* Sliding effect for Trending collections */}

        
        <h2 className="text-3xl font-bold p-6">Trending collections</h2>
        <div className="sliding-container">
          <div className="sliding-nfts grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 p-6">
            {TradingNFTs.slice(0, 7).map((nft, index) => (
              <div key={index} className="slide-item">
                <NFTCard {...nft} />
              </div>
            ))}
          </div>
        </div>

        {/* Sliding effect for Minting now */}
        <h2 className="text-3xl font-bold p-6">Minting now</h2>
        <div className="sliding-container">
          <div className="sliding-nfts grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 p-6">
            {TradingNFTs.slice(0, 7).map((nft, index) => (
              <div key={index} className="slide-item">
                <NFTCard {...nft} />
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
