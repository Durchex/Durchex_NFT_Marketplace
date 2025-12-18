// import { HiMenu, HiX } from "react-icons/hi"; // Removed - no longer needed
import { useContext, useEffect, useState } from "react";
import RealTimeData from "../components/RealTimeData";
import NFTCard from "../components/NFTCard";
// import LOGO from "../assets/logo.png"; // Removed - no longer needed
// import metamask from "../assets/metamask.png"; // Removed - no longer needed
import { ICOContent } from "../Context/index";
// import Header from "../components/Header"; // Removed - header already exists in Profile page
import { nftAPI } from "../services/api";
import { adminAPI } from "../services/adminAPI";
import { ErrorToast, SuccessToast } from "../app/Toast/Error.jsx";

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
  const [mintingNFT, setMintingNFT] = useState(null);

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

  const handleMintNFT = async (nft) => {
    if (!nft.metadataURI) {
      ErrorToast("NFT metadata not found");
      return;
    }

    setMintingNFT(nft.itemId);
    
    try {
      const nftmarketplace = import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS;
      const isVendor = await isAuthorizedVendor(address);
      
      const mintFunction = isVendor ? vendorMint : publicMint;
      const mintResult = await mintFunction([nft.metadataURI], nftmarketplace, nft.itemId, nft.network);
      
      if (mintResult && mintResult.transactionHash) {
        // Update local state
        setMyNFTs(prevNFTs => 
          prevNFTs.map(n => 
            n.itemId === nft.itemId 
              ? { 
                  ...n, 
                  isMinted: true, 
                  mintedAt: new Date(), 
                  mintTxHash: mintResult.transactionHash,
                  tokenId: mintResult.tokenId || n.tokenId
                }
              : n
          )
        );
        
        SuccessToast("NFT minted successfully!");
      } else {
        ErrorToast("Minting failed");
      }
    } catch (error) {
      console.error("Minting error:", error);
      ErrorToast("Minting failed. Please try again.");
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
            View and manage your created NFTs. Mint unminted NFTs to get token IDs for listing.
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
            <p className="text-xl mb-4">You haven't created any NFTs yet</p>
            <p className="text-gray-400">
              Create NFTs first, then come back here to mint them and get token IDs for listing.
            </p>
          </div>
        ) : (
          <div className="mb-12">
            {/* Unminted NFTs Section */}
            {MyNFTs.some(nft => !nft.isMinted) && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-4 text-yellow-400">Unminted NFTs</h3>
                <p className="text-gray-400 mb-6">These NFTs need to be minted on the blockchain to get token IDs.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {MyNFTs.filter(nft => !nft.isMinted).map((nft, index) => (
                    <div key={nft._id || index} className="bg-gray-800 rounded-lg p-4 border border-yellow-500">
                      <div className="mb-4">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{nft.name}</h3>
                      <div className="space-y-2 text-sm mb-4">
                        <p><span className="text-gray-400">Status:</span> <span className="text-yellow-400">Not Minted</span></p>
                        <p><span className="text-gray-400">Created:</span> {new Date(nft.createdAt || nft._id?.getTimestamp?.() || Date.now()).toLocaleDateString()}</p>
                        <p><span className="text-gray-400">Network:</span> {nft.network}</p>
                      </div>
                      <button
                        onClick={() => handleMintNFT(nft)}
                        disabled={mintingNFT === nft.itemId}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-semibold text-sm"
                      >
                        {mintingNFT === nft.itemId ? "Minting..." : "Mint NFT"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Minted NFTs Section */}
            {MyNFTs.some(nft => nft.isMinted) && (
              <div>
                <h3 className="text-2xl font-bold mb-4 text-green-400">Minted NFTs</h3>
                <p className="text-gray-400 mb-6">These NFTs are minted on the blockchain and ready for listing requests.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {MyNFTs.filter(nft => nft.isMinted).map((nft, index) => (
                    <div key={nft._id || index} className="bg-gray-800 rounded-lg p-4 border border-green-500">
                      <div className="mb-4">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{nft.name}</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-400">Token ID:</span> {nft.tokenId}</p>
                        <p><span className="text-gray-400">Contract:</span> {nft.nftContract}</p>
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
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-xs text-gray-400 mb-2">
                          Use this token ID to request admin listing:
                        </p>
                        <div className="bg-gray-900 p-2 rounded text-xs font-mono">
                          Token ID: {nft.tokenId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyMintedNFTs;