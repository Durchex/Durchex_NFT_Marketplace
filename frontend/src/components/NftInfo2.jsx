import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { ICOContent } from "../Context";
import {
  Heart,
  Share2,
  MoreHorizontal,
  Filter,
  Search,
  List,
  Grid,
} from "react-feather";
import ShareModal from "../components/ShareModal";
import FilterSidebar from "../components/FilterSidebar";
import { useFilter } from "../Context/FilterContext";
import Header from "../components/Header";
import { ErrorToast } from "../app/Toast/Error";
import { SuccessToast } from "../app/Toast/Success";
import Modal from "./Modal";
import Button from "./Button";
import LoadingNFTRow from "./LoadingNftRow";
import OffersTab from "./OffersTab";
import { formatPrice, getCurrencySymbol } from "../Context/constants";
import MyCollection from "./MyCollection";
import NftInfoItems from "./NftinfoItems";
import { nftAPI } from "../services/api";

function App() {
  // const { id } = useParams();
  const { tokenId, itemId, price, collection } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const contexts = useContext(ICOContent);

  const {
    getOffer,
    placeOffers,
    editOffers,
    tokenURI,
    getAllListings,
    getActiveListings,
    cancelOffers,
    formatPOLPrice,
    selectedChain,
    acceptOffers,
  } = contexts;
  const {
    getNFTById_,
    buyNFT,
    address,
    fetchMetadataFromPinata,
    fetchMetadata,
    transferNFT,
  } = contexts;
  const [NFTsItems, setNFTsItems] = useState([]);
  const [nftDatas, setNftData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  console.log("🚀 ~ App ~ metadata:", metadata)
  const [ComponentLoad, setComponentLoad] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const { isFilterOpen, toggleFilter } = useFilter();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Items");
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [TradingNFTs, setTradingNFTs] = useState([]);
  const [allNfts, setallNfts] = useState([]);
  const [nftContract, setNftContract] = useState(null);
  const [prices, setPrices] = useState(null);
  const priceee = formatPOLPrice(prices);
  const [bannerImage, setBannerImage] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [newOwner, setNewOwner] = useState("");
  const [pendingTransfer, setPendingTransfer] = useState(null);

  useEffect(() => {
    const fetchActiveListings = async () => {
      try {
        setIsLoading(true);
        const response = await getActiveListings();

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

          if (formattedItem.itemId === itemId) {
            setNftContract(formattedItem.nftContract);
            setPrices(formattedItem.price);
            // setPrices(formattedItem.pr);
            break; // Stop looping once we find the match
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching active listings:", error);
        setIsLoading(false);
      }
    };

    fetchActiveListings();
  }, [getActiveListings, itemId]);

  useEffect(() => {
    const fetching = async () => {
      try {
        const response = await getNFTById_(tokenId.toString());
        setNftData(response);
        if (!response) {
          navigate("/");
          return null;
        } else {
          // Fetch metadata using tokeNURI from the NFT data
          if (response && response.tokeNURI) {
            const parsedFile = await fetchMetadataFromPinata(response.tokeNURI);
            // const metadata = JSON.parse(parsedFile.file);
            // const metadataData = await metadataResponse.json();
            setMetadata(parsedFile);
          }
        }
        setNFTsItems(response);
      } catch (error) {
        console.log(error);
      }
    };
    fetching();
  }, [tokenId]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        //  const response = await getNFTById_(tokenId.toString())

        if (nftContract) {
          const response = await getOffer(nftContract);
          setOffers(response ?? []);
        }
      } catch (error) {
        console.error("Error fetching offers:", error);
      }
    };
    fetchOffers();
  }, [nftContract]);

  useEffect(() => {
    const fetching = async (functions, trading) => {
      try {
        setIsLoading(true);
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
          try {
            const parsedFile = await fetchMetadataFromPinata(url);
            if (parsedFile && parsedFile.file) {
              const metadata = JSON.parse(parsedFile.file);
              // setMetadata(metadata);
            } else {
              console.error("Failed to fetch or parse metadata:", parsedFile);
            }
          } catch (error) {
            console.error("Error fetching or parsing metadata:", error);
          }

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
        if (formattedListings.length > 0) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching active listings or metadata:", error);
        setTimeout(() => fetchNFTs(fetchFunction, setNFTs), 5000);
      }
    };

    fetching(getActiveListings, true);
    fetching(getAllListings, false);
  }, [fetchMetadataFromPinata, getActiveListings, getAllListings, tokenURI]);

  useEffect(() => {
    if (TradingNFTs.length > 0 && allNfts.length > 0) {
      setIsLoading(false);
    }
  }, [TradingNFTs, allNfts]);


  useEffect(() => {
    fetchSingleNftItem();
    // Fetch pending transfer (buyer address) if seller is viewing
    if (nftDatas?.seller && address && nftDatas.seller?.toLowerCase() === address.toLowerCase()) {
      fetchPendingTransfer();
    }
  }, [nftDatas, address, itemId])

  // Fetch pending transfer to auto-populate buyer address
  const fetchPendingTransfer = async () => {
    try {
      const network = nftDatas?.network || selectedChain?.toLowerCase();
      if (!network || !itemId) return;

      const pending = await nftAPI.getPendingTransfer({ network, itemId });
      if (pending && pending.buyerAddress) {
        setPendingTransfer(pending);
        setNewOwner(pending.buyerAddress); // Auto-populate buyer address
        console.log("🚀 ~ Auto-populated buyer address:", pending.buyerAddress);
      }
    } catch (error) {
      // No pending transfer found or API error - this is fine
      console.log("No pending transfer found or error:", error.message);
      setPendingTransfer(null);
    }
  };
  
  // router.get("/nft/:network/:itemId/:tokenId/:collection", fetchSingleNft);

  const fetchSingleNftItem = () => {
    const addressString = selectedChain.toString();
    fetch(
      `https://backend-2wkx.onrender.com/api/v1/nft/nft/${addressString}/${itemId}/${tokenId}`
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        console.log("🚀 123456~ .then ~ data:", data);
        setBannerImage(data.image);
        // Store the full NFT data including network
        if (data) {
          setNftData(data);
          // Ensure network is set from the fetched data
          if (data.network) {
            console.log("🚀 ~ NFT network from API:", data.network);
          }
        }
        setIsLoading(false);
      })
      .catch((err) => console.error("Error fetching NFT:", err));
  };

  const handleBuy = async () => {
    if (!address) {
      ErrorToast("Please connect your wallet first");
      return;
    }

    // Get NFT's listing network from the fetched data
    const nftListingNetwork = nftDatas?.network || selectedChain?.toLowerCase();
    
    if (!nftListingNetwork) {
      ErrorToast("Network information is missing for this NFT");
      return;
    }

    console.log("🚀 ~ handleBuy ~ nftListingNetwork:", nftListingNetwork);
    console.log("🚀 ~ handleBuy ~ itemId:", itemId);
    console.log("🚀 ~ handleBuy ~ price:", price);

    try {
      // Pass the NFT's network to ensure purchase happens on the correct network
      await buyNFT(nftContract || itemId, itemId, price, nftListingNetwork)
        .then((response) => {
          SuccessToast(
            <div>
              NFT Purchased successfully 🎉 ! <br />
              Transaction: {response.transactionHash?.slice(0, 10)}...
            </div>
          );
          setTimeout(() => {
            navigate("/");
          }, 2000);
        })
        .catch((error) => {
          console.error("Buy NFT error:", error);
          ErrorToast(<div>{error.message || "Failed to purchase NFT. Please try again 💔!"}</div>);
        });
    } catch (error) {
      console.error("Buy NFT error:", error);
      ErrorToast(<div>{error.message || "Something went wrong 💔!"}</div>);
    }
  };

  // Seller verification: transfer NFT to new owner and update backend
  const handleConfirmTransfer = async () => {
    if (!address) return ErrorToast("Connect your wallet first");
    if (!newOwner) return ErrorToast("Enter the new owner's address");
    try {
      const receipt = await transferNFT(nftContract, tokenId, newOwner);
      SuccessToast(
        <div>
          NFT transferred successfully 🎉 !<br />
          Tx: {receipt.transactionHash?.slice(0, 10)}...
        </div>
      );

      // Update backend owner record
      try {
        await nftAPI.updateNftOwner({
          network: nftDatas?.network || selectedChain?.toLowerCase(),
          itemId,
          tokenId,
          newOwner,
          listed: false,
        });

        // Delete pending transfer record after successful transfer
        try {
          await nftAPI.deletePendingTransfer({
            network: nftDatas?.network || selectedChain?.toLowerCase(),
            itemId,
          });
          console.log("🚀 ~ Pending transfer record deleted");
        } catch (deleteErr) {
          console.error("Failed to delete pending transfer:", deleteErr);
        }
      } catch (apiErr) {
        console.error("Failed to update backend owner:", apiErr);
      }

      setShowTransfer(false);
      setNewOwner("");
      setPendingTransfer(null);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      ErrorToast(<div>{err.message || "Transfer failed"}</div>);
    }
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  const toggleShareModal = () => {
    setShowShareModal(!showShareModal);
  };

  return (
    <div className="min-h-screen bg-[#0e0e16] text-white overflow-x-hidden">
      <Header />
      <div className="px-2 md:px-5 relative bg-gradient-to-b from-[#1D0E35] to-[#0e0e16]">
        <div className="absolut left-0 top-0 w-full mb-8">
          {/* <div className="absolute inset-0 bg-gradient-to-t from-[#333136] to-transparent z-10"></div> */}
          <img
            src={bannerImage }
            alt="Featured Dancing Monkey"
            className="w-full md:h-[400px] mt-5 object-cove roundedxl"
          />{" "}
        </div>
        <div className="flex justify-between items-center px-2 md:px-16  md:gap-4">
          <div className="block md:flex justify-between">
            <div className="w-12 h-12 mr-5 bg-gray-700 rounded-md"></div>
            <div className="space-x-">
              <h2 className="text-lg md:text-3xl font-bold mb-2 text-purple-400">
                {nftDatas?.name || metadata?.name || "NFT Name"}
              </h2>
              <h1 className="text-sm md:text-2xl font-bold">
                {metadata?.collection || nftDatas?.collection || "Collection"}
              </h1>
              <p className="text-xs md:text-xl text-gray-400">
                {metadata?.creator || nftDatas?.creator || "Creator"}
              </p>
              <div className="flex items-center mt-1">
                <div className="bg-purple-800 text-purple-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  {selectedChain}
                </div>
              </div>
            </div>
          </div>
          {/* Stats */}
          <div className="flex md:grid md:grid-cols-6 gap-2 md:gap-4 px-4 md:px-16 m text-sm items-center h-full  my-auto">
            <div>
              <p className="text-gray-400 text-xs">ItemID</p>
              <p className="font-semibold text-sm">#233{itemId}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Floor Price</p>
              <p className="font-semibold text-xs">
                {formatPrice(price)} {getCurrencySymbol(selectedChain)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Items</p>
              <p className="font-semibold text-xs">None</p>
            </div>
            <div>
              <p className="text-gray-400 hidden md:block">Categories</p>
              <p className="font-semibold hidden md:block">
                {/* {metadata.category} */}
                <span className="text-green-500"></span>
              </p>
            </div>
            <div>
              <p className="text-gray-400 hidden md:block">Properties</p>
              <p className="font-semibold hidden md:block">
                {/* {metadata.properties} */}
              </p>
            </div>
            <div>
              <button
                onClick={toggleShareModal}
                className="p-2 rounded-full hover:bg-gray-800 hidden md:block"
              >
                <Share2 size={20} />
              </button>
              <button
                onClick={toggleLike}
                className="p-2 rounded-full hover:bg-gray-800"
              >
                <Heart
                  size={20}
                  fill={isLiked ? "#ef4444" : "none"}
                  stroke={isLiked ? "#ef4444" : "currentColor"}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {/* <div className="flex justify-end gap-3 mt-4">
          <button className="bg-[#F2ECFE] text-black px-4 py-2 rounded-lg font-medium">
            Place Bid for collection
          </button>
        </div> */}

        {/* Description */}
        <div className="mt-8 px-1 md:px-16  text-sm md:text-xl text-gray-300 leading-relaxed">
          <p className=""> {metadata?.description}</p>
          <p className="mt-10">
            More than just art, this collection celebrates sustainability,
            happiness, and community. Holders gain access to exclusive perks,
            events, and collaborations aimed at supporting eco-friendly
            initiatives and creative ventures in Web3. Join the herd and bring
            happiness to the blockchain.
          </p>
          <p className="mt-4 text-purple-400 cursor-pointer">Learn more.</p>
          <div className="block md:flex  justify-between w-full">
            <p className="my-6">
              Tokenize your cards for free on {" "}
              <span className="text-purple-400">Durchex.com</span>
            </p>
            <div className="">
              <button
                className="w-[200px] md:w-[300px] py-2 bg-gradient-to-tl from-purple-950 to-purple-800 PX-2 md:px-5 text-purple-400 md:text-lg font-extrabold rounded-lg"
                onClick={() => setShowModal(true)}
              >
                Buy NFT
              </button>
            </div>
          </div>

          {/* Modal for payment options */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-lg w-[500px]">
                <h2 className="text-xl font-bold text-white mb-4">
                  Choose Payment Method
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-r pr-4">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">
                      Bank Transfer
                    </h3>
                    <input
                      type="text"
                      placeholder="Enter bank details"
                      className="w-full p-2 bg-gray-800 rounded-md text-white mb-3"
                    />
                    <button
                      // onClick={buyNFTWithOffchainPayment}
                      className="w-full bg-green-600 hover:bg-green-700 py-2 text-white rounded-lg"
                    >
                      Buy with Bank Transfer
                    </button>
                  </div>
                  <div className="pl-4">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">
                      Crypto Payment
                    </h3>
                    <button
                      onClick={handleBuy}
                      className="w-full bg-purple-600 hover:bg-purple-700 py-2 text-white rounded-lg"
                    >
                      Buy with Crypto
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-4 w-full bg-gray-700 hover:bg-gray-800 py-2 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Seller confirm transfer UI (visible to current seller) */}
          {nftDatas?.seller && address && nftDatas.seller?.toLowerCase() === address.toLowerCase() && (
            <div className="mt-6 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
              <h3 className="text-lg font-semibold mb-2">
                {pendingTransfer ? "Confirm Transfer to Buyer" : "Transfer NFT to New Owner"}
              </h3>
              {pendingTransfer ? (
                <>
                  <p className="text-sm text-green-400 mb-2">
                    ✓ Purchase detected! Buyer address auto-populated.
                  </p>
                  {pendingTransfer.transactionHash && (
                    <p className="text-xs text-gray-500 mb-3">
                      Purchase Tx: {pendingTransfer.transactionHash.slice(0, 10)}...
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 mb-3">
                  Enter the buyer's address to transfer this NFT on-chain. This will update the ownership.
                </p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="0xBuyerAddress"
                />
                <button
                  onClick={handleConfirmTransfer}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newOwner}
                >
                  {pendingTransfer ? "Confirm Transfer" : "Transfer NFT"}
                </button>
              </div>
              {newOwner && (
                <p className="text-xs text-gray-400 mt-2">
                  Verify the address before confirming: {newOwner}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#312E38] text-sm md:text-lg">
        <div className="flex gap-8 px-2 md:px-6">
          <button
            onClick={() => setActiveTab("Items")}
            className={`py-4 ${
              activeTab === "Items"
                ? "border-b-2 border-purple-500 font-medium"
                : "text-gray-400"
            }`}
          >
            Items
          </button>
          <button
            onClick={() => setActiveTab("Offers")}
            className={`py-4 ${
              activeTab === "Offers"
                ? "border-b-2 border-purple-500 font-medium"
                : "text-gray-400"
            }`}
          >
            Offers
          </button>
          <button
            onClick={() => setActiveTab("Activity")}
            className={`py-4 ${
              activeTab === "Activity"
                ? "border-b-2 border-purple-500 font-medium"
                : "text-gray-400"
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      {/* Filters and Content Area */}
      <div className="flex overflow-x-hidden justify-center">
        {/* Filter Sidebar with slide animation */}
        <div
          className={`fixed left-0 h-full transition-transform duration-300 transform z-20
            ${isFilterOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <FilterSidebar />
        </div>

        {/* Main Content Area with slide animation */}
        <div
          className={`flex-1 transition-all duration-300 
            ${isFilterOpen ? "ml-64" : "ml-0"}`}
        >
          {/* Filters Bar */}
          <div className="py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleFilter}
                className="md:flex hidden items-center gap-2 text-sm hover:text-purple-500 transition-colors"
              >
                <Filter size={16} />
                Filters
              </button>
              <div className="flex items-center gap-2 text-sm bg-green-900 bg-opacity-30 text-green-500 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Live
              </div>
            </div>

            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search for collections, NFTs or Artists"
                  className="w-full bg-transparent border border-[#312E38] rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select className="text-sm bg-[#19171C] rounded-lg px-3 py-2 focus:outline-none">
                <option className="text-white">Price: Lowest to highest</option>
                <option className="text-white">Price: Highest to lowest</option>
              </select>

              <div className="hidden md:flex items-center bg-[#19171C] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-gray-700" : ""}`}
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-gray-700" : ""}`}
                >
                  <Grid size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* NFT Grid */}
          {activeTab === "Items" && <NftInfoItems collection={null} />}
          {activeTab === "Offers" && (
            <OffersTab
              offers={offers}
              placeOffer={placeOffers}
              editOffer={editOffers}
              cancelOffer={cancelOffers}
              acceptOffer={acceptOffers}
              address={address}
              nftContract={nftContract}
              itemId={itemId}
              tokenId={tokenId}
            />
          )}
          {activeTab === "Activity" && (
            <>
              {" "}
              {isLoading ? (
                <LoadingNFTRow />
              ) : (
                <div className="">
                  <div className="sliding-nfts grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 p-6">
                    <div className="sliding-container">
                      <div className="sliding-nfts grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 p-6">
                        {TradingNFTs.slice(0, 7).map((nft, index) => (
                          <div key={index} className="slide-item">
                            <NFTCard {...nft} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {/* </div> */}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && <ShareModal onClose={toggleShareModal} />}
    </div>
  );
}

function NFTCard({ viewMode, nft }) {}

NFTCard.propTypes = {
  viewMode: PropTypes.oneOf(["grid", "list"]).isRequired,
  nft: PropTypes.shape({
    name: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
  }).isRequired,
};

export default App;
