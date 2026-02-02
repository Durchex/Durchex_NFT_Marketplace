import React, { useContext, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { BsStars } from 'react-icons/bs';
import { ErrorToast } from '../app/Toast/Error.jsx';
import { SuccessToast } from '../app/Toast/Success';
import { ICOContent } from '../Context/index.jsx';
import Header from '../components/Header.jsx';
import { nftAPI } from '../services/api';
import { getContractAddresses, changeNetwork } from '../Context/constants';

/**
 * List NFT – select one of your owned NFTs and list it on the marketplace.
 * Fetches user NFTs from backend; lists via marketplace contract (listNFT).
 */
function ListNft() {
  const { address, listNFT, connectWallet } = useContext(ICOContent) || {};
  const navigate = useNavigate();
  const [userNfts, setUserNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (address) {
      setLoading(true);
      setError('');
      nftAPI
        .getUserNFTs(address)
        .then((nfts) => {
          setUserNfts(Array.isArray(nfts) ? nfts : []);
          if (!selectedNft && nfts?.length) setSelectedNft(nfts[0]);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load your NFTs');
          setUserNfts([]);
        })
        .finally(() => setLoading(false));
    } else {
      setUserNfts([]);
      setSelectedNft(null);
    }
  }, [address]);

  const getNftContractAddress = (nft) => {
    if (!nft) return null;
    const net = (nft.network || 'polygon').toLowerCase();
    const addrs = getContractAddresses(net);
    if (nft.contractAddress) return nft.contractAddress;
    if (nft.nftContract) return nft.nftContract;
    if (nft.isLazyMint && addrs?.lazyMint) return addrs.lazyMint;
    return addrs?.vendor || null;
  };

  const handleListing = async (e) => {
    e.preventDefault();
    if (!address) {
      ErrorToast(<div>Connect your wallet first.</div>);
      return;
    }
    const nft = selectedNft;
    if (!nft) {
      ErrorToast(<div>Select an NFT to list.</div>);
      return;
    }
    const priceStr = String(price).trim();
    const priceNum = parseFloat(priceStr);
    if (!priceStr || isNaN(priceNum) || priceNum <= 0) {
      ErrorToast(<div>Enter a valid price (e.g. 0.01).</div>);
      return;
    }
    const nftContract = getNftContractAddress(nft);
    if (!nftContract || nftContract === '0x0') {
      ErrorToast(<div>NFT contract not configured for this network.</div>);
      return;
    }
    const tokenId = nft.tokenId ?? nft.itemId ?? nft._id?.toString();
    if (tokenId == null) {
      ErrorToast(<div>This NFT has no token ID.</div>);
      return;
    }
    const network = (nft.network || 'polygon').toLowerCase();
    setListing(true);
    setError('');
    try {
      await changeNetwork(network);
      await new Promise((r) => setTimeout(r, 500));
      await listNFT(nftContract, tokenId, priceStr);
      SuccessToast(<div>NFT listed successfully.</div>);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      const msg = err?.message || err?.error || 'Listing failed';
      setError(msg);
      ErrorToast(<div>{msg}</div>);
    } finally {
      setListing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="min-h-screen px-4 sm:px-10 py-6">
        <Toaster position="top-right" />
        <h1 className="text-white/90 font-semibold text-xl sm:text-2xl mt-4">
          List your NFT <span className="text-white/60 font-medium">on the marketplace</span>
        </h1>
        <div className="flex flex-row gap-2 items-center text-sm sm:base mt-2 text-white/70">
          <BsStars />
          <p>Select an NFT you own and set a price. Buyers can purchase it directly.</p>
        </div>
        {!address && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <p className="text-gray-300 mb-3">Connect your wallet to see your NFTs and list them.</p>
            <button
              type="button"
              onClick={connectWallet}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
            >
              Connect Wallet
            </button>
          </div>
        )}
        {address && (
          <div className="flex flex-col lg:flex-row gap-8 mt-8">
            <div className="flex-auto max-w-xl">
              <form onSubmit={handleListing} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-white/80 font-semibold text-sm sm:text-base">Select your NFT *</label>
                  {loading ? (
                    <p className="text-gray-400">Loading your NFTs...</p>
                  ) : userNfts.length === 0 ? (
                    <p className="text-gray-400">You have no NFTs to list. Mint or buy one first.</p>
                  ) : (
                    <select
                      className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500"
                      value={selectedNft ? (selectedNft._id?.toString() || selectedNft.itemId || '') : ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        const n = userNfts.find((nft) => (nft._id?.toString() || nft.itemId) === id);
                        setSelectedNft(n ?? null);
                      }}
                    >
                      {userNfts.map((n, i) => (
                        <option key={n._id || n.itemId || i} value={n._id?.toString() || n.itemId || String(i)}>
                          {n.name || 'Unnamed'} {n.tokenId != null ? `#${n.tokenId}` : ''} ({n.network || 'polygon'})
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedNft && (
                    <div className="flex items-center gap-3 mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      {selectedNft.image && (
                        <img src={selectedNft.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-medium">{selectedNft.name || 'Unnamed'}</p>
                        <p className="text-gray-400 text-sm">
                          Token ID: {selectedNft.tokenId ?? selectedNft.itemId ?? '—'} · {selectedNft.network || 'polygon'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-white/80 font-semibold text-sm sm:text-base">Price (native token, e.g. ETH/MATIC) *</label>
                  <input
                    className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500"
                    type="text"
                    placeholder="e.g. 0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                  <p className="text-gray-400 text-xs">Use decimal (e.g. 0.05). Buyers pay this amount on the same network.</p>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={listing || !selectedNft || !price.trim() || userNfts.length === 0}
                    className="px-6 py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold"
                  >
                    {listing ? 'Listing…' : 'List NFT'}
                  </button>
                  <Link
                    to="/"
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-center"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ListNft;
