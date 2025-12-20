// import { HiMenu, HiX } from "react-icons/hi"; // Removed - no longer needed
import { useContext, useEffect, useState } from "react";
// import RealTimeData from "../components/RealTimeData"; // Removed - not used
// import NFTCard from "../components/NFTCard"; // Removed - not used
// import LOGO from "../assets/logo.png"; // Removed - no longer needed
// import metamask from "../assets/metamask.png"; // Removed - no longer needed
import { ICOContent } from "../Context/index";
// import Header from "../components/Header"; // Removed - header already exists in Profile page
import { nftAPI } from "../services/api";
// import { adminAPI } from "../services/adminAPI"; // Removed - not used
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success.jsx";

function MyMintedNFTs() {
  const contexts = useContext(ICOContent);
  const {
    address,
    connectWallet,
    vendorMint,
    publicMint,
    isAuthorizedVendor
  } = contexts;

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

  useEffect(() => {
    const fetchMyNFTs = async () => {
      console.log("MyNFTs: Current wallet address:", address);
      
      if (!address) {
        console.log("MyNFTs: No wallet address, setting loading to false");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("MyNFTs: Fetching all NFTs for address:", address);
        const nfts = await nftAPI.getUserNFTs(address);
        console.log("MyNFTs: API response:", nfts);
        setMyNFTs(nfts);
        setError(null);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
        setError("Error fetching NFTs");
      } finally {
        setLoading(false);
      }
    };

    fetchMyNFTs();
  }, [address]);

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

      // Call the appropriate minting function based on vendor status
      const mintFunction = isAuthorizedVendor ? vendorMint : publicMint;
      const result = await mintFunction(nft);

      console.log("Mint result:", result);

      // Update the NFT in the database with minted status and tokenId
      await nftAPI.updateNftStatus(nft.network, nft.itemId, {
        isMinted: true,
        tokenId: result.tokenId,
        mintTxHash: result.txHash,
        mintedAt: new Date().toISOString()
      });

      // Update local state
      setMyNFTs(prevNFTs =>
        prevNFTs.map(n =>
          n.itemId === nft.itemId
            ? {
                ...n,
                isMinted: true,
                tokenId: result.tokenId,
                mintTxHash: result.txHash,
                mintedAt: new Date().toISOString()
              }
            : n
        )
      );

      SuccessToast("NFT minted successfully!");
    } catch (error) {
      console.error("Mint error:", error);
      ErrorToast("Failed to mint NFT. Please try again.");
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

              const unmintedNFTs = filteredNFTs.filter(nft => !nft.isMinted);
              const mintedNFTs = filteredNFTs.filter(nft => nft.isMinted);

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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {mintedNFTs.map((nft, index) => (
                    <div key={nft._id || index} className="bg-gray-800 rounded-lg p-4 border border-green-500">
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
              </div>
            )}
          </>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyMintedNFTs;