import { useContext, useEffect, useState } from "react";
// import RealTimeData from "../components/RealTimeData"; // Removed - not used
// import NFTCard from "../components/NFTCard"; // Removed - not used
// import LOGO from "../assets/logo.png"; // Removed - no longer needed
// import metamask from "../assets/metamask.png"; // Removed - no longer needed
import { ICOContent } from "../Context/index";
// import Header from "../components/Header"; // Removed - header already exists in Profile page
import { nftAPI, engagementAPI } from "../services/api";
import { adminAPI } from "../services/adminAPI";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success.jsx";
import NFTImageHoverOverlay from "../components/NFTImageHoverOverlay.jsx";
import SellModal from "../components/SellModal.jsx";
import toast from "react-hot-toast";

function MyMintedNFTs() {
  const contexts = useContext(ICOContent);
  const {
    address,
    connectWallet,
    vendorMint,
    publicMint,
    isAuthorizedVendor
  } = contexts;

  // Helper function to get marketplace address for network
  const getMarketplaceAddress = (network) => {
    const networkName = network?.toLowerCase();
    // Use environment variables or constants for marketplace addresses
    switch (networkName) {
      case 'polygon':
        return import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_POLYGON;
      case 'ethereum':
        return import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ETHEREUM;
      case 'bsc':
        return import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_BSC;
      case 'arbitrum':
        return import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ARBITRUM;
      case 'base':
        return import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_BASE;
      case 'solana':
        // Solana uses program ID instead of contract address
        return import.meta.env.VITE_APP_NFTMARKETPLACE_PROGRAM_ID_SOLANA;
      case 'zksync':
        return import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ZKSYNC;
      default:
        // Fallback to default marketplace address
        return import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS;
    }
  };

  // const [isMenuOpen, setIsMenuOpen] = useState(false); // Removed - no longer needed
  const [MyNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingNFT, setEditingNFT] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: ''
  });
  const [mintingNFT, setMintingNFT] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'minted', 'unminted'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', or specific categories
  const [cartItems, setCartItems] = useState(new Set());
  const [likedItems, setLikedItems] = useState(new Set());
  const [sellModalNft, setSellModalNft] = useState(null);
  const [sellPiecesModal, setSellPiecesModal] = useState(null); // { nft, myPieces }
  const [sellPiecesQty, setSellPiecesQty] = useState(1);
  const [sellPiecesPrice, setSellPiecesPrice] = useState("");
  const [sellPiecesSubmitting, setSellPiecesSubmitting] = useState(false);
  const [pieceHoldings, setPieceHoldings] = useState([]); // { network, itemId, wallet, pieces }
  const { address: userWalletAddress } = useContext(ICOContent) || {};

  // User is the initial creator (can edit/delete). Non-creator owners see Sell only.
  const isCreator = (nft) =>
    address &&
    (nft.creator || nft.creatorWallet) &&
    String(nft.creator || nft.creatorWallet).toLowerCase() === address.toLowerCase();

  useEffect(() => {
    const fetchMyNFTs = async () => {
      if (!address) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [nfts, holdings] = await Promise.all([
          nftAPI.getUserNFTs(address),
          nftAPI.getPieceHoldingsByWallet(address).catch(() => []),
        ]);
        setMyNFTs(nfts);
        setPieceHoldings(holdings);
        setError(null);
      } catch (err) {
        console.error("Error fetching NFTs:", err);
        setError("Error fetching NFTs");
      } finally {
        setLoading(false);
      }
    };
    fetchMyNFTs();
  }, [address]);

  const getMyPieces = (nft) => {
    if (nft.userPieces != null && nft.userPieces > 0) return Number(nft.userPieces);
    const h = pieceHoldings.find(
      (x) => x.network === (nft.network || "").toLowerCase() && String(x.itemId) === String(nft.itemId)
    );
    return h ? Number(h.pieces) : 0;
  };

  const handleEditNFT = async (nft) => {
    setEditingNFT(nft.itemId);
    setEditForm({
      name: nft.name,
      description: nft.description,
      price: nft.price
    });
  };

  const handleSaveEdit = async (nft) => {
    try {
      await nftAPI.editSingleNft(nft.network, nft.itemId, editForm);
      
      // Update local state
      setMyNFTs(prevNFTs => 
        prevNFTs.map(n => 
          n.itemId === nft.itemId 
            ? { ...n, ...editForm }
            : n
        )
      );
      
      setEditingNFT(null);
      SuccessToast("NFT updated successfully!");
    } catch (error) {
      console.error("Edit error:", error);
      ErrorToast("Failed to update NFT. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingNFT(null);
    setEditForm({ name: '', description: '', price: '' });
  };

  const handleSellPieces = async () => {
    if (!sellPiecesModal?.nft || !address) return;
    const nft = sellPiecesModal.nft;
    const qty = Math.max(1, parseInt(sellPiecesQty, 10));
    const price = sellPiecesPrice?.trim();
    if (!price || parseFloat(price) <= 0) {
      ErrorToast("Enter a valid price per piece");
      return;
    }
    if (qty > (sellPiecesModal.myPieces || 0)) {
      ErrorToast("Quantity exceeds your pieces");
      return;
    }
    try {
      setSellPiecesSubmitting(true);
      await nftAPI.createPieceSellOrder({
        network: nft.network,
        itemId: nft.itemId,
        seller: address,
        quantity: qty,
        pricePerPiece: price,
      });
      SuccessToast("Pieces listed for sale. They are now in the NFT liquidity.");
      setSellPiecesModal(null);
      setSellPiecesQty(1);
      setSellPiecesPrice("");
      const holdings = await nftAPI.getPieceHoldingsByWallet(address);
      setPieceHoldings(holdings);
    } catch (err) {
      console.error("Sell pieces error:", err);
      ErrorToast(err?.message || "Failed to list pieces");
    } finally {
      setSellPiecesSubmitting(false);
    }
  };

  const handleDeleteNFT = async (nft) => {
    if (!window.confirm(`Are you sure you want to delete "${nft.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await nftAPI.deleteSingleNft(nft.network, nft.itemId);
      
      // Update local state
      setMyNFTs(prevNFTs => prevNFTs.filter(n => n.itemId !== nft.itemId));
      
      SuccessToast("NFT deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      ErrorToast("Failed to delete NFT. Please try again.");
    }
  };

  const handleMintNFT = async (nft) => {
    if (!address) {
      ErrorToast("Please connect your wallet first");
      return;
    }

    setMintingNFT(nft.itemId);

    try {
      console.log("Minting NFT:", nft);

      // Get marketplace contract address based on network
      const networkName = nft.network?.toLowerCase() || 'polygon';
      const marketplaceAddress = getMarketplaceAddress(networkName);
      
      if (!marketplaceAddress) {
        ErrorToast("Marketplace contract address not found for network: " + networkName);
        return;
      }

      // Use metadataURI if available, otherwise construct from image
      const uri = nft.metadataURI || nft.image;
      
      if (!uri) {
        ErrorToast("NFT metadata URI not found");
        return;
      }

      console.log("Minting with params:", { uri, marketplaceAddress, itemId: nft.itemId, network: nft.network });

      // Call the appropriate minting function based on vendor status
      const mintFunction = isAuthorizedVendor ? vendorMint : publicMint;
      const result = await mintFunction(uri, marketplaceAddress, nft.itemId, nft.network);

      console.log("Mint result:", result);

      // Handle different return formats
      let tokenId = null;
      let txHash = null;

      if (result && typeof result === 'object') {
        // publicMint returns { ...receipt, tokenId }
        tokenId = result.tokenId;
        txHash = result.transactionHash || result.hash;
        console.log("Extracted tokenId from result:", tokenId);
        console.log("Transaction hash:", txHash);
        console.log("Result has tokenId property:", 'tokenId' in result);
      } else if (result && result.transactionHash) {
        // vendorMint returns receipt directly
        txHash = result.transactionHash;
        // Try to extract tokenId from events if available
        if (result.events) {
          console.log("Checking events for tokenId:", result.events);
          for (const event of result.events) {
            console.log("Event object:", event);
            console.log("Event name:", event.event);
            console.log("Event args:", event.args);
            if (event.event === 'Transfer' && event.args && event.args.tokenId) {
              tokenId = event.args.tokenId.toString();
              console.log("Found tokenId in events:", tokenId);
              break;
            }
          }
        } else {
          console.log("No events found in receipt");
        }
      }

      if (!txHash) {
        throw new Error("Minting transaction failed - no transaction hash returned");
      }

      // Update the NFT in the database with minted status and tokenId
      console.log("Updating database with tokenId:", tokenId, "for itemId:", nft.itemId);
      await adminAPI.updateNFTStatus(nft.network, nft.itemId, {
        isMinted: true,
        tokenId: tokenId,
        mintTxHash: txHash,
        mintedAt: new Date().toISOString()
      });
      console.log("Database update completed");

      // Update local state
      setMyNFTs(prevNFTs =>
        prevNFTs.map(n =>
          n.itemId === nft.itemId
            ? {
                ...n,
                isMinted: true,
                tokenId: tokenId,
                mintTxHash: txHash,
                mintedAt: new Date().toISOString()
              }
            : n
        )
      );

      SuccessToast(`NFT minted successfully!${tokenId ? ` Token ID: ${tokenId}` : ''}`);
    } catch (error) {
      console.error("Mint error:", error);
      ErrorToast(`Minting failed: ${error.message || 'Unknown error'}`);
    } finally {
      setMintingNFT(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header removed - already exists in Profile page */}

      <main className="mx-auto mt-8 px-4">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">My NFTs</h2>
          <p className="text-gray-400">
            Create NFTs from the create page, then mint them here to get token IDs for listing requests.
          </p>
        </div>

        {!address ? (
          <div className="text-center py-12">
            <p className="text-xl mb-4">Please connect your wallet to view your NFTs</p>
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            >
              Connect Wallet
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-xl">Loading your NFTs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-xl text-red-500">{error}</p>
          </div>
        ) : MyNFTs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl mb-4">You haven&apos;t created any NFTs yet</p>
            <p className="text-gray-400">
              Create NFTs first, then come back here to mint them and get token IDs for listing.
            </p>
          </div>
        ) : (
          <div className="mb-12">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <label className="text-gray-300 text-sm font-medium">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="all">All NFTs</option>
                  <option value="minted">Minted Only</option>
                  <option value="unminted">Unminted Only</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-300 text-sm font-medium">Category:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="art">Art</option>
                  <option value="collectibles">Collectibles</option>
                  <option value="gaming">Gaming</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Apply filters */}
            {(() => {
              let filteredNFTs = MyNFTs;

              // Apply status filter
              if (statusFilter === 'minted') {
                filteredNFTs = filteredNFTs.filter(nft => nft.isMinted);
              } else if (statusFilter === 'unminted') {
                filteredNFTs = filteredNFTs.filter(nft => !nft.isMinted);
              }

              // Apply category filter (assuming NFTs have a category field, or we can use a default)
              if (categoryFilter !== 'all') {
                filteredNFTs = filteredNFTs.filter(nft => 
                  (nft.category && nft.category.toLowerCase() === categoryFilter) || 
                  (!nft.category && categoryFilter === 'other')
                );
              }

              // Unminted: NFTs you created that are not yet on-chain and you don't hold pieces of
              const unmintedNFTs = filteredNFTs.filter(
                (nft) => isCreator(nft) && !nft.isMinted && getMyPieces(nft) <= 0
              );

              // Minted / owned: either minted on-chain or you have pieces recorded
              const mintedNFTs = filteredNFTs.filter(
                (nft) => nft.isMinted || getMyPieces(nft) > 0
              );

              const mintedCreatedNFTs = mintedNFTs.filter((nft) => isCreator(nft));
              const mintedOwnedNFTs = mintedNFTs.filter((nft) => !isCreator(nft));

              return (
                <>
                  {/* Unminted NFTs Section */}
                  {unmintedNFTs.length > 0 && (
                    <div className="mb-12">
                      <h3 className="text-2xl font-bold mb-4 text-yellow-400">Unminted NFTs</h3>
                      <p className="text-gray-400 mb-6">These NFTs need to be minted on the blockchain to get token IDs.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {unmintedNFTs.map((nft, index) => (
                    <div key={nft._id || index} className="bg-gray-800 rounded-lg p-4 border border-yellow-500">
                      <div className="mb-4">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                      
                      {editingNFT === nft.itemId ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            placeholder="NFT Name"
                          />
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white h-20"
                            placeholder="Description"
                          />
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            placeholder="Price"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(nft)}
                              className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded font-semibold text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded font-semibold text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold mb-2">{nft.name}</h3>
                          <div className="space-y-2 text-sm mb-4">
                            <p><span className="text-gray-400">Status:</span> <span className="text-yellow-400">Not Minted</span></p>
                            <p><span className="text-gray-400">Created:</span> {new Date(nft.createdAt || nft._id?.getTimestamp?.() || Date.now()).toLocaleDateString()}</p>
                            <p><span className="text-gray-400">Network:</span> {nft.network}</p>
                          </div>
                          
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => handleEditNFT(nft)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded font-semibold text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNFT(nft)}
                              className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded font-semibold text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          
                          <button
                            onClick={() => handleMintNFT(nft)}
                            disabled={mintingNFT === nft.itemId}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-semibold text-sm"
                          >
                            {mintingNFT === nft.itemId ? "Minting..." : "Mint NFT"}
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

                  {/* Minted NFTs Section */}
                  {mintedNFTs.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-green-400">Minted NFTs</h3>
                      <p className="text-gray-400 mb-6">These NFTs are minted on the blockchain and ready for listing requests.</p>
                      
                      {/* Created NFTs (you are the creator) */}
                      {mintedCreatedNFTs.length > 0 && (
                        <>
                          <h4 className="text-xl font-semibold mb-2 text-white">Created by you</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {mintedCreatedNFTs.map((nft, index) => (
                              <div key={nft._id || index} className="bg-gray-800 rounded-lg p-4 border border-green-500">
                                <div className="mb-4 relative group overflow-hidden rounded-lg">
                                  <img
                                    src={nft.image}
                                    alt={nft.name}
                                    className="w-full h-48 object-cover rounded-lg"
                                  />
                                  {/* Hover Overlay */}
                                  <NFTImageHoverOverlay
                                    nft={{
                                      itemId: nft.itemId || nft._id,
                                      name: nft.name,
                                      collection: nft.collection || 'Personal Collection',
                                      price: nft.price || '0',
                                      currency: 'ETH',
                                      image: nft.image
                                    }}
                                    isInCart={cartItems.has(nft.itemId || nft._id)}
                                    isLiked={likedItems.has(nft.itemId || nft._id)}
                                    onAddToCart={() => {
                                      setCartItems(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(nft.itemId || nft._id)) {
                                          newSet.delete(nft.itemId || nft._id);
                                        } else {
                                          newSet.add(nft.itemId || nft._id);
                                        }
                                        return newSet;
                                      });
                                    }}
                                    onLike={async () => {
                                      if (!userWalletAddress) {
                                        toast.error("Please connect your wallet");
                                        return;
                                      }
                                      try {
                                        const nftId = nft.itemId || nft._id;
                                        if (likedItems.has(nftId)) {
                                          await engagementAPI.unlikeNFT(userWalletAddress, nftId);
                                          setLikedItems(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(nftId);
                                            return newSet;
                                          });
                                          toast.success("Removed from likes");
                                        } else {
                                          await engagementAPI.likeNFT(userWalletAddress, nftId);
                                          setLikedItems(prev => new Set(prev).add(nftId));
                                          toast.success("Added to likes");
                                        }
                                      } catch (error) {
                                        toast.error("Failed to update like");
                                      }
                                    }}
                                  />
                                </div>

                                {editingNFT === nft.itemId ? (
                                  <div className="space-y-3">
                                    <input
                                      type="text"
                                      value={editForm.name}
                                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                                      placeholder="NFT Name"
                                    />
                                    <textarea
                                      value={editForm.description}
                                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white h-20"
                                      placeholder="Description"
                                    />
                                    <input
                                      type="number"
                                      value={editForm.price}
                                      onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                                      placeholder="Price"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveEdit(nft)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded font-semibold text-sm"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="flex-1 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded font-semibold text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <h3 className="text-lg font-semibold mb-2">{nft.name}</h3>
                                    <div className="space-y-2 text-sm mb-4">
                                      <p><span className="text-gray-400">Status:</span> <span className="text-green-400">Minted</span></p>
                                      <p><span className="text-gray-400">Token ID:</span> {nft.tokenId}</p>
                                      <p><span className="text-gray-400">Network:</span> {nft.network}</p>
                                      <p><span className="text-gray-400">Minted:</span> {new Date(nft.mintedAt).toLocaleDateString()}</p>
                                      {nft.mintTxHash && (
                                        <p>
                                          <span className="text-gray-400">Tx Hash:</span>{" "}
                                          <a
                                            href={`https://${nft.network === 'polygon' ? 'polygonscan' : 'etherscan'}.com/tx/${nft.mintTxHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 underline"
                                          >
                                            {nft.mintTxHash.substring(0, 10)}...
                                          </a>
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex gap-2 mb-3 flex-wrap">
                                      <button
                                        onClick={() => handleEditNFT(nft)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded font-semibold text-sm"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteNFT(nft)}
                                        className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded font-semibold text-sm"
                                      >
                                        Delete
                                      </button>
                                      {getMyPieces(nft) > 0 && (
                                        <button
                                          onClick={() => setSellPiecesModal({ nft, myPieces: getMyPieces(nft) })}
                                          className="flex-1 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded font-semibold text-sm"
                                        >
                                          Sell pieces
                                        </button>
                                      )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                      <p className="text-xs text-gray-400 mb-2">
                                        Use this token ID to request admin listing:
                                      </p>
                                      <div className="bg-gray-900 p-2 rounded text-xs font-mono">
                                        Token ID: {nft.tokenId}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Owned NFTs (you are a collector, not creator) */}
                      {mintedOwnedNFTs.length > 0 && (
                        <>
                          <h4 className="text-xl font-semibold mb-2 text-white">Owned NFTs</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {mintedOwnedNFTs.map((nft, index) => {
                              const pieces = getMyPieces(nft);
                              const mintedDate = new Date(
                                nft.mintedAt || nft.redeemedAt || nft.createdAt || Date.now()
                              ).toLocaleDateString();
                              return (
                                <div key={nft._id || index} className="bg-gray-800 rounded-lg p-4 border border-green-500">
                                  <div className="mb-4 relative group overflow-hidden rounded-lg">
                                    <img
                                      src={nft.image}
                                      alt={nft.name}
                                      className="w-full h-48 object-cover rounded-lg"
                                    />
                                  </div>

                                  <h3 className="text-lg font-semibold mb-2">{nft.name}</h3>
                                  <div className="space-y-2 text-sm mb-4">
                                    <p>
                                      <span className="text-gray-400">Pieces:</span>{" "}
                                      <span className="text-white">{pieces || 0}</span>
                                    </p>
                                    <p>
                                      <span className="text-gray-400">Minted At:</span>{" "}
                                      <span className="text-white">{mintedDate}</span>
                                    </p>
                                    <p>
                                      <span className="text-gray-400">Network:</span>{" "}
                                      <span className="text-white">{nft.network || "—"}</span>
                                    </p>
                                    <p>
                                      <span className="text-gray-400">Collection:</span>{" "}
                                      <span className="text-white">
                                        {nft.collectionName || nft.collection || "—"}
                                      </span>
                                    </p>
                                  </div>

                                  {pieces > 0 && (
                                    <button
                                      onClick={() => setSellPiecesModal({ nft, myPieces: pieces })}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded font-semibold text-sm"
                                    >
                                      Sell
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
          </>
              );
            })()}
          </div>
        )}
      </main>
      <SellModal
        isOpen={!!sellModalNft}
        onClose={() => setSellModalNft(null)}
        nft={sellModalNft}
      />

      {/* Sell pieces: list pieces back into NFT liquidity (no relist/approval) */}
      {sellPiecesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => !sellPiecesSubmitting && setSellPiecesModal(null)}>
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-600" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Sell pieces back to liquidity</h3>
            <p className="text-gray-400 text-sm mb-4">&quot;{sellPiecesModal.nft?.name}&quot; — You have {sellPiecesModal.myPieces} piece{sellPiecesModal.myPieces !== 1 ? "s" : ""}. List them for sale so others can buy; you get paid (minus fee and royalty to creator).</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={sellPiecesModal.myPieces || 1}
                  value={sellPiecesQty}
                  onChange={(e) => setSellPiecesQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Price per piece (ETH)</label>
                <input
                  type="text"
                  placeholder="0.01"
                  value={sellPiecesPrice}
                  onChange={(e) => setSellPiecesPrice(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setSellPiecesModal(null); setSellPiecesQty(1); setSellPiecesPrice(""); }}
                disabled={sellPiecesSubmitting}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSellPieces}
                disabled={sellPiecesSubmitting}
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm disabled:opacity-50"
              >
                {sellPiecesSubmitting ? "Listing…" : "List for sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyMintedNFTs;