import { useContext, useEffect, useState } from "react";
import { ICOContent } from "../Context/index";
import { nftAPI } from "../services/api";
import { SuccessToast } from "../app/Toast/Success.jsx";
import { ErrorToast } from "../app/Toast/Error.jsx";
import toast from "react-hot-toast";
import { Loader, Check, X, ZapOff } from "lucide-react";

/**
 * MintingHub - User interface for minting NFTs to blockchain
 * Displays unminted NFTs and allows single/batch minting with transaction tracking
 */
function MintingHub() {
  const contexts = useContext(ICOContent);
  const { address, connectWallet } = contexts;

  const [tab, setTab] = useState("mintable"); // "mintable" or "minted"
  const [mintableNFTs, setMintableNFTs] = useState([]);
  const [mintedNFTs, setMintedNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState(new Set());
  const [minting, setMinting] = useState(false);
  const [mintingProgress, setMintingProgress] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch mintable NFTs
  const fetchMintableNFTs = async () => {
    if (!address) {
      toast.error("Please connect wallet first");
      return;
    }
    
    try {
      setLoading(true);
      const response = await nftAPI.get(`/minting/mintable`, {
        params: {
          walletAddress: address,
          page,
          limit: 12
        }
      });
      
      setMintableNFTs(response.data.nfts);
      setTotalPages(response.data.totalPages || 1);
      
      if (response.data.nfts.length === 0) {
        toast("No mintable NFTs found", { icon: "ℹ️" });
      }
    } catch (error) {
      ErrorToast("Failed to fetch mintable NFTs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch minted NFTs
  const fetchMintedNFTs = async () => {
    if (!address) {
      toast.error("Please connect wallet first");
      return;
    }
    
    try {
      setLoading(true);
      const response = await nftAPI.get(`/minting/minted`, {
        params: {
          walletAddress: address,
          page,
          limit: 12
        }
      });
      
      setMintedNFTs(response.data.nfts);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      ErrorToast("Failed to fetch minted NFTs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab changes
  useEffect(() => {
    setPage(1);
    setSelectedNFTs(new Set());
    if (tab === "mintable") {
      fetchMintableNFTs();
    } else {
      fetchMintedNFTs();
    }
  }, [tab, address]);

  // Handle pagination
  useEffect(() => {
    if (tab === "mintable") {
      fetchMintableNFTs();
    } else {
      fetchMintedNFTs();
    }
  }, [page]);

  // Toggle NFT selection
  const toggleNFTSelection = (nftId) => {
    const newSelected = new Set(selectedNFTs);
    if (newSelected.has(nftId)) {
      newSelected.delete(nftId);
    } else {
      newSelected.add(nftId);
    }
    setSelectedNFTs(newSelected);
  };

  // Mint single NFT
  const handleMintSingle = async (nft) => {
    if (!address) {
      toast.error("Please connect wallet first");
      return;
    }

    try {
      setMinting(true);
      setMintingProgress({ [nft._id]: 0 });
      
      const response = await nftAPI.post(`/minting/mint`, {
        nftId: nft._id,
        walletAddress: address,
        collectionAddress: nft.collectionAddress
      });

      setMintingProgress({ [nft._id]: 100 });
      
      SuccessToast(`NFT minted successfully! Token ID: ${response.data.tokenId}`);
      
      // Update display
      setMintableNFTs(prev => prev.filter(n => n._id !== nft._id));
      
      // Optionally fetch updated minted NFTs
      setTimeout(() => fetchMintedNFTs(), 2000);
    } catch (error) {
      ErrorToast(error.response?.data?.message || "Failed to mint NFT");
      console.error(error);
    } finally {
      setMinting(false);
      setMintingProgress({});
    }
  };

  // Batch mint selected NFTs
  const handleBatchMint = async () => {
    if (selectedNFTs.size === 0) {
      toast.error("Please select at least one NFT");
      return;
    }

    if (!address) {
      toast.error("Please connect wallet first");
      return;
    }

    try {
      setMinting(true);
      
      const nftIds = Array.from(selectedNFTs);
      const selectedNFTObjects = mintableNFTs.filter(n => nftIds.includes(n._id));
      
      // Initialize progress for all NFTs
      const progress = {};
      nftIds.forEach(id => progress[id] = 0);
      setMintingProgress(progress);

      const response = await nftAPI.post(`/minting/batch-mint`, {
        nftIds,
        walletAddress: address,
        collectionAddress: selectedNFTObjects[0]?.collectionAddress
      });

      // Update progress
      nftIds.forEach(id => {
        setMintingProgress(prev => ({ ...prev, [id]: 100 }));
      });

      SuccessToast(`${response.data.mintedNFTs.length} NFTs minted successfully!`);
      
      // Update display
      setMintableNFTs(prev => prev.filter(n => !selectedNFTs.has(n._id)));
      setSelectedNFTs(new Set());
      
      // Optionally fetch updated minted NFTs
      setTimeout(() => fetchMintedNFTs(), 2000);
    } catch (error) {
      ErrorToast(error.response?.data?.message || "Failed to batch mint NFTs");
      console.error(error);
    } finally {
      setMinting(false);
      setMintingProgress({});
    }
  };

  // Select/deselect all
  const handleSelectAll = () => {
    if (selectedNFTs.size === mintableNFTs.length) {
      setSelectedNFTs(new Set());
    } else {
      setSelectedNFTs(new Set(mintableNFTs.map(nft => nft._id)));
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Minting Hub</h1>
            <p className="text-gray-400">Mint your NFTs to the blockchain</p>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <ZapOff size={48} className="mx-auto mb-4 text-gray-500" />
              <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
              <p className="text-gray-400 mb-6">Please connect your wallet to view your NFTs and start minting</p>
              <button
                onClick={connectWallet}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Minting Hub</h1>
          <p className="text-gray-400">Mint your NFTs to the blockchain and track your minted collections</p>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-4 border-b border-gray-700">
            <button
              onClick={() => setTab("mintable")}
              className={`pb-4 font-semibold transition ${
                tab === "mintable"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Mintable NFTs ({mintableNFTs.length})
            </button>
            <button
              onClick={() => setTab("minted")}
              className={`pb-4 font-semibold transition ${
                tab === "minted"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Minted NFTs ({mintedNFTs.length})
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {tab === "mintable" ? (
            <>
              {/* Mintable NFTs View */}
              {mintableNFTs.length > 0 && (
                <div className="mb-6 flex items-center justify-between bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedNFTs.size === mintableNFTs.length && mintableNFTs.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm font-semibold">
                      {selectedNFTs.size > 0
                        ? `${selectedNFTs.size} selected`
                        : "Select all on page"}
                    </span>
                  </label>
                  {selectedNFTs.size > 0 && (
                    <button
                      onClick={handleBatchMint}
                      disabled={minting}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
                    >
                      {minting && <Loader size={18} className="animate-spin" />}
                      Batch Mint ({selectedNFTs.size})
                    </button>
                  )}
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <Loader size={40} className="mx-auto animate-spin text-purple-600 mb-4" />
                  <p className="text-gray-400">Loading your NFTs...</p>
                </div>
              ) : mintableNFTs.length === 0 ? (
                <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                  <ZapOff size={40} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">No mintable NFTs found</p>
                  <p className="text-sm text-gray-500 mt-2">Create or import NFTs to start minting</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mintableNFTs.map((nft) => (
                    <div
                      key={nft._id}
                      className={`rounded-lg border transition cursor-pointer ${
                        selectedNFTs.has(nft._id)
                          ? "border-purple-600 bg-gray-800 bg-opacity-50"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="p-4">
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedNFTs.has(nft._id)}
                            onChange={() => toggleNFTSelection(nft._id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs text-gray-400">Select</span>
                        </label>

                        {/* Image */}
                        <img
                          src={nft.image || "https://via.placeholder.com/300"}
                          alt={nft.name}
                          className="w-full h-64 object-cover rounded-lg mb-4"
                        />

                        {/* NFT Info */}
                        <h3 className="font-bold mb-1 truncate">{nft.name}</h3>
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{nft.description}</p>

                        {/* Collection */}
                        <div className="mb-3 p-2 bg-gray-700 rounded text-xs">
                          <p className="text-gray-400">Collection</p>
                          <p className="font-semibold truncate">{nft.collectionName || "N/A"}</p>
                        </div>

                        {/* Progress Bar */}
                        {mintingProgress[nft._id] !== undefined && (
                          <div className="mb-3">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${mintingProgress[nft._id]}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {mintingProgress[nft._id]}% Complete
                            </p>
                          </div>
                        )}

                        {/* Mint Button */}
                        <button
                          onClick={() => handleMintSingle(nft)}
                          disabled={minting || mintingProgress[nft._id] !== undefined}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                        >
                          {mintingProgress[nft._id] !== undefined ? (
                            <>
                              <Loader size={16} className="animate-spin" />
                              Minting...
                            </>
                          ) : (
                            "Mint Now"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-lg ${
                          p === page
                            ? "bg-purple-600 font-bold"
                            : "bg-gray-800 hover:bg-gray-700"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Minted NFTs View */}
              {loading ? (
                <div className="text-center py-12">
                  <Loader size={40} className="mx-auto animate-spin text-purple-600 mb-4" />
                  <p className="text-gray-400">Loading your minted NFTs...</p>
                </div>
              ) : mintedNFTs.length === 0 ? (
                <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                  <ZapOff size={40} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">No minted NFTs yet</p>
                  <p className="text-sm text-gray-500 mt-2">Mint some NFTs to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mintedNFTs.map((nft) => (
                    <div
                      key={nft._id}
                      className="rounded-lg border border-gray-700 hover:border-gray-600 transition overflow-hidden"
                    >
                      <div className="p-4">
                        {/* Image */}
                        <img
                          src={nft.image || "https://via.placeholder.com/300"}
                          alt={nft.name}
                          className="w-full h-64 object-cover rounded-lg mb-4"
                        />

                        {/* NFT Info */}
                        <h3 className="font-bold mb-1 truncate">{nft.name}</h3>
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{nft.description}</p>

                        {/* Token ID Badge */}
                        {nft.tokenId && (
                          <div className="mb-3 p-2 bg-green-900/30 border border-green-700 rounded-lg">
                            <p className="text-xs text-green-400 mb-1">Token ID</p>
                            <p className="font-mono font-bold text-green-400">#{nft.tokenId}</p>
                          </div>
                        )}

                        {/* Contract Info */}
                        <div className="mb-3 p-2 bg-gray-700 rounded text-xs">
                          <p className="text-gray-400">Contract</p>
                          <p className="font-mono text-xs truncate text-gray-300">
                            {nft.contractAddress}
                          </p>
                        </div>

                        {/* Network Badge */}
                        {nft.network && (
                          <div className="p-2 bg-blue-900/30 border border-blue-700 rounded-lg flex items-center gap-2">
                            <Check size={16} className="text-blue-400" />
                            <span className="text-xs font-semibold text-blue-400">
                              Minted on {nft.network}
                            </span>
                          </div>
                        )}

                        {/* Minted At */}
                        {nft.mintedAt && (
                          <p className="text-xs text-gray-400 mt-3">
                            Minted: {new Date(nft.mintedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-lg ${
                          p === page
                            ? "bg-purple-600 font-bold"
                            : "bg-gray-800 hover:bg-gray-700"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default MintingHub;
