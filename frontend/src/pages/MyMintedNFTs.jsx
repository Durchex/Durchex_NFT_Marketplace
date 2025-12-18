import { HiMenu, HiX } from "react-icons/hi";
import { useContext, useEffect, useState } from "react";
import RealTimeData from "../components/RealTimeData";
import NFTCard from "../components/NFTCard";
import LOGO from "../assets/logo.png";
import metamask from "../assets/metamask.png";
import { ICOContent } from "../Context/index";
import Header from "../components/Header";
import { api } from "../services/api";

function MyMintedNFTs() {
  const contexts = useContext(ICOContent);
  const {
    address,
    connectWallet,
  } = contexts;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [MyMintedNFTs, setMyMintedNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyMintedNFTs = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/nft/user-minted-nfts/${address}`);
        console.log("Minted NFTs response:", response);

        if (response.success) {
          setMyMintedNFTs(response.nfts || []);
        } else {
          setError("Failed to fetch minted NFTs");
        }
      } catch (error) {
        console.error("Error fetching minted NFTs:", error);
        setError("Error fetching minted NFTs");
      } finally {
        setLoading(false);
      }
    };

    fetchMyMintedNFTs();
  }, [address]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto mt-8 px-4">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">My Minted NFTs</h2>
          <p className="text-gray-400">
            View your minted NFTs with token IDs for listing requests to admin
          </p>
        </div>

        {!address ? (
          <div className="text-center py-12">
            <p className="text-xl mb-4">Please connect your wallet to view your minted NFTs</p>
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            >
              Connect Wallet
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-xl">Loading your minted NFTs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-xl text-red-500">{error}</p>
          </div>
        ) : MyMintedNFTs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl mb-4">You haven't minted any NFTs yet</p>
            <p className="text-gray-400">
              Once you mint NFTs, they will appear here with their token IDs for listing requests
            </p>
          </div>
        ) : (
          <div className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {MyMintedNFTs.map((nft, index) => (
                <div key={nft._id || index} className="bg-gray-800 rounded-lg p-4">
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
      </main>
    </div>
  );
}

export default MyMintedNFTs;