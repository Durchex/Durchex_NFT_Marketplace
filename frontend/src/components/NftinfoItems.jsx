import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // Assuming you're using React Router
import Header from "../components/Header";
import LoadingNFTRow from "../components/LoadingNftRow";
import NFTCard from "../components/NFTCard"; // Component to display each NFT card
import { ICOContent } from "../Context";
import { nftAPI } from "../services/api";

const NftInfoItems = ({ collection }) => {
  const contexts = useContext(ICOContent);
  const {
    tokenURI,
    fetchMetadataFromPinata,
    getActiveListings,
    selectedChain,
  } = contexts;

  // Get the collection name from the URL params
  //   const { collection } = useParams();

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
      fetchNFTsByCollection(); // Fallback to fetching NFTs if no saved data
    }
  }, []);

  const fetchMetadata = async (tokenId) => {
    try {
      const url = await tokenURI(tokenId);
      const parsedFile = await fetchMetadataFromPinata(url);

      return {
        name: parsedFile.name,
        description: parsedFile.description,
        image: parsedFile.image,
        category: parsedFile.category,
        collection: parsedFile.collection,
        properties: parsedFile.properties,
        royalties: parsedFile.royalties,
      };
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return null; // Return null if metadata fetching fails
    }
  };

  const fetchNFTsByCollection = async () => {
    try {
      setIsLoading(true);

      // Function to fetch active listings from API or smart contract
      const response = await getActiveListings(); // Replace this with your API call

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

        const metadata = await fetchMetadata(formattedItem.tokenId);

        // const metadata = await fetchMetadataFromPinata(safeUrl);

        formattedItem.name = metadata.name;
        formattedItem.description = metadata.description;
        formattedItem.image = metadata.image;
        formattedItem.category = metadata.collection; // Assuming category holds the collection name
        formattedItem.properties = metadata.properties;
        formattedItem.royalties = metadata.royalties;

        // Only add the NFT to the list if it matches the selected collection
        if (formattedItem.category === collection) {
          formattedListings.push(formattedItem);
        }
      }

      // Set the filtered NFTs (based on the collection name)
      setNfts(formattedListings);

      // Set the banner image to the first NFT's image if any NFTs exist
      if (formattedListings.length > 0) {
        setBannerImage(formattedListings[0].image);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching active listings or metadata:", error);
      setIsLoading(false);
    }
  };

  const fetchCollectionItems = () => {
    const addressString = selectedChain.toString();
    if (collection) {
      nftAPI.getCollectionNfts(addressString, collection)
        .then((data) => {
          setNfts(data);
          setBannerImage(data[0].image);
          setIsLoading(false);
        })
        .catch((err) => console.error("Error fetching cart:", err));
    } else {
      nftAPI.getSingleNfts(addressString)
        .then((data) => {
          setNfts(data);
          setBannerImage(data[0].image);
          setIsLoading(false);
        })
        .catch((err) => console.error("Error fetching cart:", err));
    }
  };

  useEffect(() => {
    fetchCollectionItems();
  }, [collection]);

  return (
    <div className="min-h-screen w-full bg-black md:px-10 text-white">
      <div className="md:4xl">
        {isLoading ? (
          <LoadingNFTRow />
        ) : (
          <div className="flex flex-wrap gap-2 w-6xl mx-auto justify-center">
            {nfts.length === 0 ? (
              <p>No NFTs found in this collection.</p>
            ) : (
              nfts.map((nft) => <NFTCard key={nft.tokenId} {...nft} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NftInfoItems;
