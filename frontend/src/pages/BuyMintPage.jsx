import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { FiArrowLeft, FiDollarSign } from 'react-icons/fi';
import Header from '../components/Header';
import { nftAPI, lazyMintAPI } from '../services/api';
import { getCurrencySymbol, getContractAddresses, LazyMintNFT_ABI, changeNetwork, priceInDecimalForBuy } from '../Context/constants';
import { ICOContent } from '../Context';
import toast from 'react-hot-toast';

/**
 * Dedicated page for lazy-mint (Mint) vs listed NFT (Buy / Make Offer).
 * - Lazy-mint with pieces: "Mint" only — pay and receive NEW token(s); creator keeps the listing.
 * - Lazy-mint sold out: "Sold out" + "Make Offer" (go to NFT detail).
 * - Non–lazy-mint (listed NFT): "Buy" (marketplace) + "Make Offer".
 */
export default function BuyMintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, buyNFT } = useContext(ICOContent);
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

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

  const isLazyMint = nft?.isLazyMint === true;
  const remainingPieces = Number(nft?.remainingPieces ?? nft?.pieces ?? 0);
  const maxQuantity = Math.max(1, remainingPieces);
  const hasPiecesToMint = isLazyMint && remainingPieces > 0;
  const lazyMintSoldOut = isLazyMint && remainingPieces <= 0;
  const isListedNft = !isLazyMint;

  const handlePrimaryAction = async () => {
    if (!nft || !address) {
      toast.error('Connect your wallet first.');
      return;
    }
    const qty = Math.max(1, Math.min(maxQuantity, quantity));
    const pricePerPiece = priceInDecimalForBuy(nft.price);
    const totalPriceEth = (parseFloat(pricePerPiece) * qty).toFixed(18);
    const totalPriceWei = ethers.utils.parseEther(totalPriceEth);
    const network = (nft.network || 'polygon').toLowerCase().trim();
    const currentNetwork = network;
    setMinting(true);
    try {
      // Lazy-mint with pieces: only redeem (mint new token(s) to buyer; creator keeps the listing).
      if (hasPiecesToMint) {
        const lazyNftId = (nft._id && nft._id.toString()) || id;

        if (!window.ethereum) {
          throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        await changeNetwork(network);
        await new Promise((r) => setTimeout(r, 500));

        const redemptionRes = await lazyMintAPI.redeem(lazyNftId, pricePerPiece, qty);
        const { redemptionData } = redemptionRes;
        if (!redemptionData) throw new Error('No redemption data from server.');
        const lazyMintAddress = getContractAddresses(network)?.lazyMint;
        if (!lazyMintAddress || lazyMintAddress === '0x0') {
          throw new Error(
            'Lazy mint contract is not configured. Add VITE_APP_LAZY_MINT_CONTRACT_ADDRESS to your .env (or VITE_APP_LAZY_MINT_CONTRACT_ADDRESS_' +
              network.toUpperCase() +
              ' for this network), then rebuild. Use the address from your LazyMintNFT deployment.'
          );
        }
        const sig = redemptionData.signature?.startsWith('0x') ? redemptionData.signature : '0x' + redemptionData.signature;
        const iface = new ethers.utils.Interface(LazyMintNFT_ABI);

        let encodedData;
        let valueWei;
        const useMulti = qty > 1 && redemptionData.pricePerPiece != null && redemptionData.maxQuantity != null;
        if (useMulti) {
          const pricePerPieceWei = ethers.utils.parseEther(String(redemptionData.pricePerPiece));
          encodedData = iface.encodeFunctionData('redeemNFTWithQuantity', [
            redemptionData.creator,
            redemptionData.ipfsURI,
            redemptionData.royaltyPercentage,
            pricePerPieceWei,
            qty,
            redemptionData.maxQuantity,
            sig,
          ]);
          valueWei = totalPriceWei;
        } else {
          const singlePrice = qty === 1 ? totalPriceWei : ethers.utils.parseEther(totalPriceEth);
          encodedData = iface.encodeFunctionData('redeemNFT', [
            redemptionData.creator,
            redemptionData.ipfsURI,
            redemptionData.royaltyPercentage,
            singlePrice,
            sig,
          ]);
          valueWei = singlePrice;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const valueHex = ethers.BigNumber.isBigNumber(valueWei) ? valueWei.toHexString() : ethers.utils.hexValue(valueWei);

        const sendRawTx = async () => {
          return window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: address,
              to: lazyMintAddress,
              value: valueHex,
              data: encodedData,
              gasLimit: useMulti ? '0x989680' : '0x493E0',
            }],
          });
        };

        let txHash;
        try {
          txHash = await sendRawTx();
        } catch (txErr) {
          const txCode = txErr?.code ?? txErr?.error?.code;
          const txMsg = (txErr?.message || txErr?.error?.message || '').toLowerCase();
          const isInsufficientFunds = txCode === -32003 || txMsg.includes('insufficient funds');
          const isNoResponse =
            txCode === -32603 ||
            txMsg.includes('response has no error or result') ||
            txMsg.includes('jsonrpcengine');
          if (isInsufficientFunds) {
            throw txErr;
          }
          if (isNoResponse) {
            await new Promise((r) => setTimeout(r, 1000));
            txHash = await sendRawTx();
          } else {
            throw txErr;
          }
        }

        if (!txHash || typeof txHash !== 'string') {
          throw new Error('No transaction hash returned from wallet.');
        }
        const receipt = await provider.waitForTransaction(txHash);
        let firstTokenId = null;
        const redeemedEvents = receipt.logs?.length
          ? receipt.logs
              .map((log) => {
                try {
                  return iface.parseLog(log);
                } catch (_) {
                  return null;
                }
              })
              .filter((p) => p?.name === 'NFTRedeemed' && p.args?.tokenId != null)
          : [];
        if (redeemedEvents.length > 0) {
          firstTokenId = redeemedEvents[0].args.tokenId.toString();
        }
        await lazyMintAPI.confirmRedemption(lazyNftId, {
          tokenId: qty === 1 ? firstTokenId || '0' : undefined,
          firstTokenId: qty > 1 ? firstTokenId : undefined,
          quantity: qty,
          transactionHash: receipt.transactionHash,
          salePrice: totalPriceEth,
        });
        toast.success(qty > 1 ? `${qty} pieces minted to your wallet.` : 'Piece minted to your wallet.');
        navigate(`/nft/${id}`);
        return;
      }
      // Listed NFT (not lazy-mint): marketplace buy — transfer from seller to buyer.
      if (!isListedNft) {
        toast.error('This item is not available to buy here. Use Make Offer on the NFT page.');
        return;
      }
      const contractAddress =
        nft.contractAddress ||
        nft.nftContract ||
        getContractAddresses(currentNetwork)?.vendor;
      if (!contractAddress) {
        toast.error('NFT contract not found for this network.');
        return;
      }
      const itemIdStr = nft.itemId ?? nft.tokenId ?? nft._id;
      const qtyNum = Math.max(1, Math.min(maxQuantity, quantity));
      const totalEth = (parseFloat(priceInDecimalForBuy(nft.price)) * qtyNum).toFixed(18);
      if (typeof buyNFT !== 'function') {
        toast.error('Wallet purchase is not available. Please try again.');
        return;
      }
      await buyNFT(contractAddress, itemIdStr, totalEth, currentNetwork);
      toast.success('Purchase complete.');
      navigate(`/nft/${id}`);
    } catch (err) {
      console.error('Mint error:', err);
      const code = err?.code ?? err?.error?.code;
      const msg = String(err?.message || err?.error?.message || '');
      const errNetwork = nft?.network || 'ethereum';
      const token = getCurrencySymbol(errNetwork);
      if (code === -32003 || msg.toLowerCase().includes('insufficient funds')) {
        toast.error(
          `Insufficient funds on ${errNetwork}. Your wallet has 0 ${token} on this network. Add ${token} for the purchase and gas, then try again.`
        );
      } else if (code === -32603 || msg.includes('Response has no error or result') || msg.includes('JsonRpcEngine')) {
        toast.error(
          "Wallet didn't respond. Click Buy & Mint again and approve the transaction when your wallet opens."
        );
      } else if (code === 4001 || code === 'ACTION_REJECTED' || msg.includes('rejected')) {
        toast.error('Transaction was rejected.');
      } else {
        toast.error(msg || 'Mint failed.');
      }
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

  // Use same normalizer as tx so UI and wallet show the same price (avoids huge figure if API returns wei)
  const pricePerPiece = parseFloat(priceInDecimalForBuy(nft.price));
  const priceDisplay = pricePerPiece.toFixed(4);
  const totalDisplay = (pricePerPiece * Math.max(1, Math.min(maxQuantity, quantity))).toFixed(4);
  const currency = getCurrencySymbol(nft.network || 'ethereum');
  const canMint = hasPiecesToMint && address;
  const canBuy = isListedNft && address;

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
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">{hasPiecesToMint ? 'Price per piece' : 'Price'}</span>
              <span className="text-lg font-bold text-purple-400">
                {priceDisplay} {currency}
              </span>
            </div>
            {hasPiecesToMint && (
              <div className="mb-4">
                <label className="text-gray-400 text-sm block mb-1">Pieces to mint</label>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value, 10) || 1)))}
                  className="w-full max-w-[120px] bg-black/50 border border-purple-500/40 rounded-lg px-3 py-2 text-white text-center focus:ring-2 focus:ring-purple-500/50"
                />
                <span className="text-gray-500 text-sm ml-2">of {maxQuantity} available</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Total</span>
              <span className="text-xl font-bold text-purple-400">
                {totalDisplay} {currency}
              </span>
            </div>

            {/* Copy: Mint = new token(s), creator keeps listing. Buy = transfer from seller. */}
            {hasPiecesToMint && (
              <p className="text-gray-500 text-xs mb-4">
                Minting gives you new token(s) on-chain. The creator keeps the listing; you are not buying the whole NFT from them.
              </p>
            )}
            {isListedNft && (
              <p className="text-gray-500 text-xs mb-4">
                Buying transfers this listed NFT from the current owner to you.
              </p>
            )}

            {!address ? (
              <p className="text-amber-400 text-sm mb-4">Connect your wallet to continue.</p>
            ) : null}

            {/* Lazy-mint sold out: Sold out + Make Offer */}
            {lazyMintSoldOut && (
              <div className="space-y-3">
                <button disabled className="w-full bg-gray-600 text-gray-400 font-semibold py-3 rounded-lg cursor-not-allowed">
                  Sold out
                </button>
                <button
                  onClick={() => navigate(`/nft/${id}`)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FiDollarSign /> Make Offer
                </button>
              </div>
            )}

            {/* Lazy-mint with pieces: Mint only (redeem); no "Buy" that would transfer from creator */}
            {hasPiecesToMint && (
              <button
                onClick={handlePrimaryAction}
                disabled={!canMint || minting}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FiDollarSign />
                {minting ? 'Minting…' : `Mint ${quantity} piece(s) — ${totalDisplay} ${currency}`}
              </button>
            )}

            {/* Listed NFT (not lazy-mint): Buy + Make Offer */}
            {isListedNft && (
              <div className="space-y-3">
                <button
                  onClick={handlePrimaryAction}
                  disabled={!canBuy || minting}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FiDollarSign />
                  {minting ? 'Buying…' : `Buy — ${totalDisplay} ${currency}`}
                </button>
                <button
                  onClick={() => navigate(`/nft/${id}`)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FiDollarSign /> Make Offer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
