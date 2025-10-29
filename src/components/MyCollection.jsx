import { useContext, useEffect, useState } from "react";
import { ErrorToast } from "../app/Toast/Error";
import { SuccessToast } from "../app/Toast/Success";
import { ICOContent } from "../Context";
import LoadingNFTRow from "./LoadingNftRow";






const MyCollection = () => {
    const contexts = useContext(ICOContent);
    const {
      tokenURI,
      delistNFTs,
      editNftPrices,
      getActiveListings,
      fetchMetadataFromPinata,
      formatPOLPrice,
      getMyNFTs,
    } = contexts;
    const [myNFTs, setMyNFTs] = useState([]);
    console.log("🚀 ~ MyCollections ~ myNFTs:", myNFTs);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState("grid");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNFT, setSelectedNFT] = useState(null);
    console.log("🚀 ~ MyCollections ~ selectedNFT:", selectedNFT);
    const [newPrice, setNewPrice] = useState("");
  
    useEffect(() => {
      const fetchNFTs = async () => {
        try {
          const response = await getActiveListings();
          
          const formattedNFTs = [];
          
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
            // const metadata = JSON.parse(parsedFile.file);
            
            formattedItem.name = parsedFile.name;
            formattedItem.description = parsedFile.description;
            formattedItem.image = parsedFile.image;
            formattedItem.category = parsedFile.category;
            formattedItem.properties = parsedFile.properties;
            formattedItem.royalties = parsedFile.royalties;
  
            formattedNFTs.push(formattedItem);
            setLoading(false);
          }
  
          setMyNFTs(formattedNFTs);
        } catch (error) {
          console.error("Error fetching NFTs or metadata:", error);
        }
      };
  
      fetchNFTs();
    }, [getMyNFTs, tokenURI, fetchMetadataFromPinata]);
  
    const handleDelistnft = async (itemId) => {
      await delistNFTs(itemId);
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
      <div className="px-4 mx-1 sm:mx-1 md:mx-1 sm:px-6 md:px-12 py-4">
        <div className="flex justify-between mb-4">
          <div className="flex space-x-2"></div>
        </div>
  
        {loading ? (
          <LoadingNFTRow />
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                : "space-y-2"
            }
          >
            {myNFTs?.map((nft, index) => (
              <div
                key={index}
                className="bg-[#222]/10 rounded-lg px-4 cursor-pointer"
              >
                <img
                  src={nft?.image}
                  alt={nft?.name}
                  className="rounded-lg w-full aspect-square"
                />
                <div className="flex justify-between items-center pt-4">
                  <p className="text-gray-400 text-xs sm:text-sm mt-2">
                    {nft?.collection}
                  </p>
                  <p className="font-medium">{nft?.name}</p>
                  <p className="text-sm sm:text-md font-bold text-purple-400">
                    {formatPOLPrice(nft?.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
  
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center px-4">
            <div className="bg-purple-950/55 p-6 rounded-lg w-full max-w-[90%] sm:max-w-[500px]">
              <h3 className="text-2xl font-bold mb-8 text-white">
                Edit NFT Price
              </h3>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Enter new price"
                className="border p-2 w-full bg-gray-900/80 rounded-xl my-5"
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

  export default MyCollection;