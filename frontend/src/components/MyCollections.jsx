import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ICOContent } from "../Context/index.jsx";

import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import LoadingNFTRow from "../components/LoadingNftRow.jsx";
import { formatPrice, getCurrencySymbol } from "../Context/constants.jsx";
import { nftAPI } from "../services/api";
import { FiArrowRight, FiTrash2, FiEdit2 } from "react-icons/fi";

const MyCollections = ({ placeholder }) => {
  const navigate = useNavigate();
  const contexts = useContext(ICOContent);
  const { address } = contexts || {};
  const {
    tokenURI,
    delistNFTs,
    editNftPrices,
    fetchMetadataFromPinata,
    getMyNFTs,
    selectedChain
  } = contexts;
  
  // Collections state
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  
  const [myNFTs, setMyNFTs] = useState([]);
  console.log("🚀 ~ MyCollections ~ myNFTs:", myNFTs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  console.log("🚀 ~ MyCollections ~ selectedNFT:", selectedNFT);
  const [newPrice, setNewPrice] = useState("");

  // Fetch user collections
  useEffect(() => {
    fetchCollections();
  }, [address]);

  const fetchCollections = async () => {
    if (!address) {
      setCollectionsLoading(false);
      return;
    }

    try {
      setCollectionsLoading(true);
      const data = await nftAPI.getUserCollections(address);
      setCollections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching collections:", error);
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleDeleteCollection = async (collectionId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this collection?")) {
      return;
    }

    try {
      await nftAPI.deleteCollection(collectionId);
      setCollections(collections.filter(c => c._id !== collectionId));
      SuccessToast("Collection deleted successfully!");
    } catch (error) {
      console.error("Error deleting collection:", error);
      ErrorToast("Failed to delete collection");
    }
  };

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        const response = await getMyNFTs();
        console.log("🚀 5555555555555555555555555", response);

        if (!response || response.length === 0) {
          setMyNFTs([]); // Explicitly set an empty array if no NFTs are found
        } else {
          const formattedNFTs = await Promise.all(
            response.map(async (item) => {
              const formattedItem = {
                itemId: item.itemId.toString(),
                nftContract: item.nftContract,
                tokenId: item.tokenId.toString(),
                owner: item.owner,
                seller: item.seller,
                price: item.price.toString(),
                currentlyListed: item.currentlyListed,
              };

              try {
                const url = await tokenURI(formattedItem.tokenId);
                const parsedFile = await fetchMetadataFromPinata(url);
                // const metadata = JSON.parse(parsedFile.file);

                return {
                  ...formattedItem,
                  name: parsedFile.name,
                  description: parsedFile.description,
                  image: parsedFile.image,
                  category: parsedFile.category,
                  properties: parsedFile.properties,
                  royalties: parsedFile.royalties,
                };
              } catch (err) {
                console.error("Error fetching metadata:", err);
                return formattedItem; // Return item without metadata if an error occurs
              }
            })
          );

          setMyNFTs(formattedNFTs);
        }
      } catch (error) {
        console.error("Error fetching NFTs or metadata:", error);
        setMyNFTs([]); // Ensure myNFTs is set to empty if there is an error
      } finally {
        setLoading(false); // Ensure loading is set to false in all cases
      }
    };

    fetchNFTs();
  }, [getMyNFTs, tokenURI, fetchMetadataFromPinata]);

  //       const formattedNFTs = [];

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

  //         const url = await tokenURI(formattedItem.tokenId);
  //         const parsedFile = await fetchMetadataFromPinata(url);
  //         const metadata = JSON.parse(parsedFile.file);
  //         formattedItem.name = metadata.name;
  //         formattedItem.description = metadata.description;
  //         formattedItem.image = metadata.image;
  //         formattedItem.category = metadata.category;
  //         formattedItem.properties = metadata.properties;
  //         formattedItem.royalties = metadata.royalties;

  //         formattedNFTs.push(formattedItem);
  //       }

  //       setLoading(false);
  //       setMyNFTs(formattedNFTs);
  //     } catch (error) {
  //       console.error("Error fetching NFTs or metadata:", error);
  //     }
  //   };

  //   fetchNFTs();
  // }, [getMyNFTs, tokenURI, fetchMetadataFromPinata]);

  const handleDelistnft = async (itemId) => {
    console.log("🚀 ~ handleDelistnft ~ itemId:", itemId);
    await delistNFTs(itemId)
      .then((response) => {
        SuccessToast(
          <div>
            NFT Delisted successfully 🎉 !<br />
          </div>
        );
      })
      .catch((error) => {
        console.error(error);
        ErrorToast(<div>Something error happen try agin 💔 !</div>);
      });
    // setMyNFTs(myNFTs.filter(nft => nft.tokenId !== tokenId));
  };

  const handleSubmitPrice = async () => {
    if (!newPrice || isNaN(newPrice)) {
      ErrorToast("Please enter a valid price.");
      return;
    }
    try {
      await editNftPrices(selectedNFT.itemId, newPrice)
        .then((response) => {
          SuccessToast(
            <div>
              NFT Price Edited successfully 🎉 !<br />
            </div>
          );
        })
        .catch((error) => {
          console.error(error);
          ErrorToast(<div>Something error happen try agin 💔 !</div>);
        });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating NFT price:", error);
      ErrorToast("Failed to update price.");
    }
  };

  const handleEditClick = (nft) => {
    setSelectedNFT(nft);
    setNewPrice("");
    setIsModalOpen(true);
  };

  const handleEdit = (tokenId) => {
    editNftPrices(tokenId);
  };

  return (
    <div className="px-12 py-6">
      {/* Collections Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">My Collections</h2>
        
        {collectionsLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
            <p className="text-gray-400 mb-4">You haven't created any collections yet.</p>
            <button
              onClick={() => navigate("/create")}
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Create Collection
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {collections.map((collection) => (
                <div
                  key={collection._id}
                  onClick={() => navigate(`/collection/${collection._id}`)}
                  className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500/50 transition-all group cursor-pointer"
                >
                  {/* Collection Image */}
                  <div className="relative h-40 bg-gray-800 overflow-hidden">
                    {collection.image ? (
                      <img
                        src={collection.image}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                    
                    {/* Overlay with buttons */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/collection/${collection._id}`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-colors"
                        title="View details"
                      >
                        <FiArrowRight className="text-white" size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/collection/${collection._id}?edit=true`);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 p-2 rounded-full transition-colors"
                        title="Edit collection"
                      >
                        <FiEdit2 className="text-white" size={20} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCollection(collection._id, e)}
                        className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition-colors"
                        title="Delete collection"
                      >
                        <FiTrash2 className="text-white" size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Collection Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 truncate">{collection.name}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{collection.description}</p>

                    {/* Collection Meta */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-800 rounded p-2">
                        <p className="text-gray-400 text-xs">Network</p>
                        <p className="font-semibold text-sm capitalize">{collection.network}</p>
                      </div>
                      <div className="bg-gray-800 rounded p-2">
                        <p className="text-gray-400 text-xs">Category</p>
                        <p className="font-semibold text-sm capitalize">{collection.category}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Collection Button */}
            <button
              onClick={() => navigate("/create")}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-4 rounded-lg font-semibold text-lg transition-colors mb-8"
            >
              + Create New Collection
            </button>
          </>
        )}
      </div>

      {/* Existing NFTs Section */}
      <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {placeholder == "Collection" ? "My NFT Collection" : "MY NFT"}
        </h2>
        <div className="hidden md:flex space-x-2">
          <button
            className={`p-1.5 rounded ${
              viewMode === "grid"
                ? "bg-white text-black"
                : "bg-[#222] text-white"
            }`}
            onClick={() => setViewMode("grid")}
          >
            {/* <Grid className="h-5 w-5" /> */}
          </button>
          <button
            className={`p-1.5 rounded ${
              viewMode === "list"
                ? "bg-white text-black"
                : "bg-[#222] text-white"
            }`}
            onClick={() => setViewMode("list")}
          >
            {/* <List className="h-5 w-5" /> */}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingNFTRow /> // Show loading component when fetching
      ) : myNFTs.length === 0 ? (
        <div className="text-center text-purple-200 text-3xl font-bold">
          No {placeholder} available
        </div>
      ) : (
        <div
  className={
    viewMode === "grid" ? "grid grid-cols-4 gap-6" : "space-y-4"
  }
>
  <>
    {myNFTs?.map((nft, index) => (
      <div
        key={index}
        className="bg-[#222] rounded-lg overflow-hidden cursor-pointer transition-transform transform hover:scale-105 shadow-lg hover:shadow-2xl"
      >
        <img
          src={nft?.image}
          alt={nft?.name}
          className="rounded-lg w-full aspect-square object-cover"
        />
        <div className="p-2">
          <p className="text-gray-400 text-sm">{nft?.collection}</p>
          <p className="font-medium text-white mt-2 text-sm">{nft?.name}</p>
          <p className="text-gray-400 text-xs">{nft?.itemId}</p>

          <p className="text-sm text-purple-400 mt-2">
            {nft?.price
              ? `${formatPrice(nft?.price)} ${getCurrencySymbol(selectedChain)}`
              : "Price not available"}
          </p>
        </div>

        <div className="flex justify-between mt-1 px-2 pb-2">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-600 transform hover:scale-105 transition-all"
            onClick={() => handleDelistnft(nft.itemId)}
          >
            Delist
          </button>
          <button
            className="bg-purple-800 text-sm text-white px-1 py-2 rounded-md shadow-md hover:bg-blue-600 transform hover:scale-105 transition-all"
            onClick={() => handleEditClick(nft)}
          >
            Edit NFT
          </button>
        </div>
      </div>
    ))}
  </>
</div>

      )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center">
          <div className="bg-purple-950/55 p-6 rounded-lg md:w-[500px] md:h-[300px]">
            <h3 className="text-2xl font-bold mb-8 bg-gradient-to-br from-purple-90">
              Edit NFT Price
            </h3>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Enter new price"
              className="border p-2 w-full mt-2 bg-gray-900/80 rounded-xl my-5"
            />
            <div className="flex justify-end mt-4">
              <button
                className="mr-2 p-2 bg-gray-900 rounded"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="p-2 bg-blue-500 text-white rounded"
                onClick={handleSubmitPrice}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCollections;

//  {/* Filters and View Toggle */}
//  <div className="px-12 py-6 hidden md:flex justify-between">
//  <button className="bg-[#222] rounded-lg px-4 py-2 text-sm">
//    <Filter className="h-4 w-4" /> <span>Filters</span>
//  </button>
//  <div className="flex items-center space-x-2">
//    <button
//      className={`p-1.5 rounded ${
//        viewMode === "grid"
//          ? "bg-white text-black"
//          : "bg-[#222] text-white"
//      }`}
//      onClick={() => setViewMode("grid")}
//    >
//      <Grid className="h-5 w-5" />
//    </button>
//    <button
//      className={`p-1.5 rounded ${
//        viewMode === "list"
//          ? "bg-white text-black"
//          : "bg-[#222] text-white"
//      }`}
//      onClick={() => setViewMode("list")}
//    >
//      <List className="h-5 w-5" />
//    </button>
//  </div>
// </div>
