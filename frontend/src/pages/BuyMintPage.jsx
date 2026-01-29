import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { FiArrowLeft, FiDollarSign } from 'react-icons/fi';
import Header from '../components/Header';
import { nftAPI } from '../services/api';
import { getCurrencySymbol } from '../Context/constants';
import { getContractAddresses } from '../Context/constants';
import { ICOContent } from '../Context';
import toast from 'react-hot-toast';

/**
 * Dedicated Buy & Mint page – user pays the exact NFT price and mints (no offer modal).
 */
export default function BuyMintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, buyNFT } = useContext(ICOContent);
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNft = async () => {
      try {
        setLoading(true);
        setError(null);
        let nftData = null;
        const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
        for (const network of networks) {
          try {
            const nfts = await nftAPI.getAllNftsByNetwork(network);
            const found = nfts?.find(n =>
              n.itemId === id || n.tokenId === id || n._id === id
            );
            if (found) {
              nftData = found;
              break;
            }
          } catch (_) {
            continue;
          }
        }
        if (!nftData) {
          setError('NFT not found.');
          setNft(null);
          return;
        }
        setNft(nftData);
      } catch (err) {
        setError(err.message || 'Failed to load NFT');
        setNft(null);
      } finally {
        setLoading(false);
      }
    };
    fetchNft();
  }, [id]);

  const handleBuyAndMint = async () => {
    if (!nft || !address) {
      toast.error('Connect your wallet first.');
      return;
    }
    const contractAddress =
      nft.contractAddress ||
      nft.nftContract ||
      (nft.network && getContractAddresses(nft.network)?.vendor);
    if (!contractAddress) {
      toast.error('NFT contract not found for this network.');
      return;
    }
    const itemId = nft.itemId ?? nft.tokenId ?? nft._id;
    const priceEth = String(nft.price || '0');
    const priceWei = ethers.utils.parseEther(priceEth).toString();
    const network = nft.network || 'polygon';
    setMinting(true);
    try {
      await buyNFT(contractAddress, itemId, priceWei, network);
      toast.success('Minted successfully!');
      navigate(`/nft/${id}`);
    } catch (err) {
      console.error('Mint error:', err);
      toast.error(err.message || 'Mint failed.');
    } finally {
      setMinting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-400 mb-4">{error || 'NFT not found.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-purple-400 hover:text-purple-300 flex items-center gap-2 mx-auto"
          >
            <FiArrowLeft /> Go back
          </button>
        </div>
      </div>
    );
  }

  const priceDisplay = parseFloat(nft.price || '0').toFixed(4);
  const currency = getCurrencySymbol(nft.network || 'ethereum');
  const hasPieces = Number(nft.remainingPieces ?? nft.pieces ?? 0) > 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6"
        >
          <FiArrowLeft /> Back
        </button>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div className="aspect-square bg-gray-800 relative">
            {nft.image ? (
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No image
              </div>
            )}
          </div>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{nft.name}</h1>
            <p className="text-gray-400 text-sm mb-4">
              {nft.collection && <span>Collection: {nft.collection}</span>}
              {nft.network && (
                <span className="ml-2">Network: {nft.network}</span>
              )}
            </p>
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-400">Price</span>
              <span className="text-xl font-bold text-purple-400">
                {priceDisplay} {currency}
              </span>
            </div>
            {!address ? (
              <p className="text-amber-400 text-sm mb-4">
                Connect your wallet to buy and mint.
              </p>
            ) : !hasPieces ? (
              <p className="text-amber-400 text-sm mb-4">
                No pieces available to mint.
              </p>
            ) : null}
            <button
              onClick={handleBuyAndMint}
              disabled={!address || !hasPieces || minting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FiDollarSign />
              {minting ? 'Minting…' : `Buy & Mint at ${priceDisplay} ${currency}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
