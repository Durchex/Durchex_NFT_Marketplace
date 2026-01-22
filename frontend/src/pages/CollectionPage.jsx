import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // Assuming you're using React Router
import NFTCard from "../components/NFTCard"; // Component to display each NFT card
import LoadingNFTGrid from "../components/LoadingNftGrid"; // A loading spinner or grid component
import { ICOContent } from "../Context";
import LoadingNFTRow from "../components/LoadingNftRow";
import Header from "../components/Header";
import { nftAPI } from "../services/api";

const CollectionPage = () => {
  const contexts = useContext(ICOContent);
  const {
    tokenURI,
    fetchMetadataFromPinata,
    getActiveListings,
    selectedChain,
  } = contexts;

  // Get the collection name from the URL params
  const { collection } = useParams();

  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerImage, setBannerImage] = useState("");

  useEffect(() => {
    const savedNFTs = localStorage.getItem("nfts");
    if (savedNFTs) {
      console.log("🚀 ~ useEffect ~ savedNFTs:", savedNFTs);
      setTradingNFTs(JSON.parse(savedNFTs)); // Load data from localStorage
      localStorage.setItem("tradingNFTs", JSON.stringify(nfts));
    } else {
      fetchCollectionItems(); // Fallback to fetching NFTs if no saved data
    }
  }, []);

  const fetchCollectionItems = () => {
    const addressString = selectedChain.toString();
    nftAPI.getCollectionNfts(addressString, collection)
      .then((data) => {
        console.log("🚀 ~ .then ~ data:", data);
        setNfts(data);
        // Only set banner image if there are NFTs in the collection
        if (data && data.length > 0 && data[0].image) {
          setBannerImage(data[0].image);
        }
        setIsLoading(false);
      })
      .catch((err) => console.error("Error fetching cart:", err));
  };

  // const fetchMetadata = async (tokenId) => {
  //   try {
  //     const url = await tokenURI(tokenId);
  //     const parsedFile = await fetchMetadataFromPinata(url);

  //     return {
  //       name: parsedFile.name,
  //       description: parsedFile.description,
  //       image: parsedFile.image,
  //       category: parsedFile.category,
  //       collection: parsedFile.collection,
  //       properties: parsedFile.properties,
  //       royalties: parsedFile.royalties,
  //     };
  //   } catch (error) {
  //     console.error("Error fetching metadata:", error);
  //     return null; // Return null if metadata fetching fails
  //   }
  // };

  // const fetchNFTsByCollection = async () => {
  //   try {
  //     setIsLoading(true);

  //     // Function to fetch active listings from API or smart contract
  //     const response = await getActiveListings(); // Replace this with your API call

  //     const formattedListings = [];

  //     for (const item of response) {
  //       const formattedItem = {
  //         itemId: item.itemId.toString(),
  //         nftContract: item.nftContract,
  //         tokenId: item.tokenId.toString(),
  //         owner: item.owner,
  //         seller: item.seller,
  //         price: item.price.toString(),
  //         currentlyListed: item.currentlyListed,
  //       };

  //       // Fetch the metadata for the NFT
  //       // const url = await tokenURI(formattedItem.tokenId);
  //       // const safeUrl = url.replace(
  //       //   "https://copper-leading-yak-964.mypinata.cloud",
  //       //   "https://silver-solid-beetle-367.mypinata.cloud"
  //       // );

  //       const metadata = await fetchMetadata(formattedItem.tokenId);

  //       // const metadata = await fetchMetadataFromPinata(safeUrl);

  //       formattedItem.name = metadata.name;
  //       formattedItem.description = metadata.description;
  //       formattedItem.image = metadata.image;
  //       formattedItem.category = metadata.collection; // Assuming category holds the collection name
  //       formattedItem.properties = metadata.properties;
  //       formattedItem.royalties = metadata.royalties;

  //       // Only add the NFT to the list if it matches the selected collection
  //       if (formattedItem.category === collection) {
  //         formattedListings.push(formattedItem);
  //       }
  //     }

  //     // Set the filtered NFTs (based on the collection name)
  //     setNfts(formattedListings);

  //     // Set the banner image to the first NFT's image if any NFTs exist
  //     if (formattedListings.length > 0) {
  //       setBannerImage(formattedListings[0].image);
  //     }

  //     setIsLoading(false);
  //   } catch (error) {
  //     console.error("Error fetching active listings or metadata:", error);
  //     setIsLoading(false);
  //   }
  // };

  useEffect(() => {
    fetchCollectionItems();
  }, [collection]);

  return (
    <div className="min-h-screen w-full bg-black px-2 xs:px-3 sm:px-4 md:px-6 lg:px-10 text-white">
      <Header />

      {/* Banner Section */}
      {bannerImage && (
        <div
          className="w-full h-32 xs:h-40 sm:h-48 md:h-64 lg:h-80 bg-cover my-2 xs:my-3 sm:my-4 bg-center mb-4 xs:mb-6 sm:mb-8"
          style={{ backgroundImage: `url(${bannerImage})` }}
        >
          <div className="flex justify-center items-center h-full bg-black bg-opacity-50">
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold px-3 xs:px-4 sm:px-6 bg-gradient-to-tr from-purple-200 to-pink-100 bg-clip-text text-transparent text-center">
              {collection} NFTs
            </h1>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto">
        {isLoading ? (
          <LoadingNFTRow />
        ) : (
          <div className="flex flex-wrap gap-2 xs:gap-3 sm:gap-4 justify-center">
            {nfts.length === 0 ? (
              <div className="w-full text-center py-8 xs:py-12 sm:py-16">
                <p className="text-gray-400 text-sm xs:text-base">No NFTs found in this collection.</p>
              </div>
            ) : (
              nfts.map((nft) => (
                <NFTCard key={nft.tokenId} {...nft} collection={collection} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionPage;
