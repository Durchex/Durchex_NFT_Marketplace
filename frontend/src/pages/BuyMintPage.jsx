import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { FiArrowLeft, FiDollarSign } from 'react-icons/fi';
import Header from '../components/Header';
import { nftAPI, lazyMintAPI } from '../services/api';
import { getCurrencySymbol, getMultiPieceLazyMintContractWithSigner, getNftLiquidityContractWithSigner, changeNetwork, priceInDecimalForBuy } from '../Context/constants';
import { ICOContent } from '../Context';
import toast from 'react-hot-toast';

/**
 * Dedicated page for lazy-mint (Mint) vs listed NFT (Buy / Make Offer).
 * Lazy-mint redemption is fully on-chain: voucher from backend, then LazyMintNFT.redeemNFT / redeemNFTWithQuantity.
 * - Lazy-mint with pieces: "Mint" — on-chain redeem; creator keeps the listing.
 * - Lazy-mint sold out: "Sold out" + "Make Offer".
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
  const [marketBuyQuantity, setMarketBuyQuantity] = useState(1);
  const [marketBuyLoading, setMarketBuyLoading] = useState(false);
  const [sellOrders, setSellOrders] = useState([]);
  const [sellOrdersLoading, setSellOrdersLoading] = useState(false);
  const [fillOrderQty, setFillOrderQty] = useState({}); // { [orderId]: number }
  const [fillOrderSubmitting, setFillOrderSubmitting] = useState(null); // orderId when submitting

  useEffect(() => {
    const fetchNft = async () => {
      try {
        setLoading(true);
        setError(null);
        let nftData = await nftAPI.getNftByAnyId(id);
        if (!nftData) {
          const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
          for (const network of networks) {
            try {
              const nfts = await nftAPI.getAllNftsByNetwork(network);
              const found = nfts?.find(n =>
                n.itemId === id || n.tokenId === id || (n._id && String(n._id) === String(id))
              );
              if (found) {
                nftData = found;
                break;
              }
            } catch (_) {
              continue;
            }
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

  useEffect(() => {
    if (!nft?.network || (!nft?.itemId && !nft?._id)) return;
    const itemId = nft.itemId || nft._id?.toString() || id;
    setSellOrdersLoading(true);
    nftAPI
      .getPieceSellOrdersByNft(nft.network, itemId)
      .then((orders) => setSellOrders(Array.isArray(orders) ? orders : []))
      .catch(() => setSellOrders([]))
      .finally(() => setSellOrdersLoading(false));
  }, [nft?.network, nft?.itemId, nft?._id, id]);

  const isLazyMint = nft?.isLazyMint === true;
  const remainingPieces = Number(nft?.remainingPieces ?? nft?.pieces ?? 0);
  const maxQuantity = Math.max(1, remainingPieces);
  const hasPiecesToMint = isLazyMint && remainingPieces > 0;
  const lazyMintSoldOut = isLazyMint && remainingPieces <= 0;
  const isListedNft = !isLazyMint;
  const hasLiquidityPool = !!(nft?.liquidityContract && nft?.liquidityPieceId != null);

  const handleFillOrder = async (order, qty) => {
    if (!address || !order?._id) return;
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    const available = order.quantity - (order.filledQuantity || 0);
    if (quantity > available) {
      toast.error(`Max ${available} pieces available in this order.`);
      return;
    }
    setFillOrderSubmitting(order._id);
    try {
      await nftAPI.fillPieceSellOrder(order._id, { buyer: address, quantity });
      toast.success(`Bought ${quantity} piece(s) from order.`);
      const itemId = nft?.itemId || nft?._id?.toString() || id;
      if (nft?.network && itemId) {
        const updated = await nftAPI.getPieceSellOrdersByNft(nft.network, itemId);
        setSellOrders(Array.isArray(updated) ? updated : []);
      }
      setFillOrderQty((prev) => ({ ...prev, [order._id]: undefined }));
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to fill order');
    } finally {
      setFillOrderSubmitting(null);
    }
  };

  const handleBuyAtMarket = async () => {
    if (!nft || !address || !hasLiquidityPool) return;
    const qty = Math.max(1, parseInt(marketBuyQuantity, 10) || 1);
    const network = (nft.network || 'polygon').toLowerCase().trim();
    setMarketBuyLoading(true);
    try {
      await window.ethereum?.request({ method: 'eth_requestAccounts' });
      await changeNetwork(network);
      const liquidityContract = await getNftLiquidityContractWithSigner(network, nft.liquidityContract);
      if (!liquidityContract) {
        toast.error('Could not connect to liquidity contract. Check network.');
        return;
      }
      const pieceIdWei = nft.liquidityPieceId;
      const [totalCostWei] = await liquidityContract.getBuyQuote(pieceIdWei, String(qty));
      const totalCost = ethers.BigNumber.from(totalCostWei);
      const tx = await liquidityContract.buyPieces(pieceIdWei, qty, { value: totalCost });
      const receipt = await tx.wait();
      const pricePerPiece = totalCost.div(qty);
      await nftAPI.recordPoolPurchase({
        network,
        itemId: nft.itemId || nft._id?.toString() || id,
        buyer: address,
        quantity: qty,
        pricePerPiece: ethers.utils.formatEther(pricePerPiece),
        totalAmount: ethers.utils.formatEther(totalCost),
        transactionHash: receipt?.transactionHash || receipt?.hash || null,
      });
      toast.success(qty > 1 ? `${qty} pieces bought at market price.` : 'Bought at market price.');
      navigate(`/nft/${id}`);
    } catch (err) {
      console.error('Buy at market error:', err);
      const code = err?.code ?? err?.error?.code;
      const msg = String(err?.message || err?.error?.message || '');
      if (code === 4001 || msg.toLowerCase().includes('rejected')) {
        toast.error('Transaction rejected.');
      } else if (msg.includes('Insufficient payment') || msg.includes('pieces')) {
        toast.error('Insufficient liquidity or wrong amount. Try a smaller quantity.');
      } else {
        toast.error(msg || 'Buy at market failed.');
      }
    } finally {
      setMarketBuyLoading(false);
    }
  };

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
      // Lazy-mint: fully on-chain redemption via LazyMintNFT contract (voucher from backend, no confirm-redemption).
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
        if (!redemptionData) throw new Error('No voucher data from server.');

        const contract = await getMultiPieceLazyMintContractWithSigner(network);
        if (!contract) {
          throw new Error(
            'Lazy mint contract not configured for this network. Add VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS (or _' +
              network.toUpperCase() +
              ') and connect your wallet.'
          );
        }

        const sig = redemptionData.signature?.startsWith('0x')
          ? redemptionData.signature
          : '0x' + (redemptionData.signature || '');

        const maxSupply = Number(redemptionData.maxSupply ?? redemptionData.pieces ?? nft.pieces ?? 1) || 1;
        const pricePerPieceEth = String(redemptionData.pricePerPieceEth ?? redemptionData.price ?? nft.price ?? '0');
        const pricePerPieceWei = ethers.utils.parseEther(pricePerPieceEth);
        const valueWei = pricePerPieceWei.mul(ethers.BigNumber.from(qty));

        const creatorAddress = redemptionData.creator && ethers.utils.isAddress(redemptionData.creator)
          ? ethers.utils.getAddress(redemptionData.creator)
          : redemptionData.creator;

        const tx = await contract.redeemListing(
          creatorAddress,
          redemptionData.ipfsURI,
          Number(redemptionData.royaltyBps ?? redemptionData.royaltyPercentage ?? 0) || 0,
          pricePerPieceWei,
          maxSupply,
          qty,
          sig,
          { value: valueWei, gasLimit: 500000 }
        );
        const receipt = await tx.wait();

        // Post-mint sync: update remainingPieces + piece holdings in backend
        try {
          await lazyMintAPI.recordPurchase(lazyNftId, {
            buyer: address,
            quantity: qty,
            totalPrice: totalPriceEth,
            pricePerPiece: pricePerPieceEth,
            network,
            transactionHash: tx.hash,
          });
        } catch (syncErr) {
          console.warn(
            'Post-mint sync failed; on-chain mint succeeded but DB not updated yet:',
            syncErr?.message || syncErr
          );
        }

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
      const receipt = err?.receipt ?? err?.transaction?.receipt;
      const txFailed = code === 'CALL_EXCEPTION' || receipt?.status === 0;

      const isHexOnly = /^0x[0-9a-fA-F]+$/.test(msg.trim());

      if (code === -32603 || msg.includes('Internal JSON-RPC')) {
        toast.error(
          'Network RPC error. The listing may already have been redeemed, or the network is busy. Try again in a moment or try another listing.'
        );
      } else if (txFailed || msg.includes('CALL_EXCEPTION') || msg.includes('transaction failed')) {
        toast.error(
          'Transaction failed. This listing may already have been redeemed, or the voucher may have expired. Try another listing or refresh the page.'
        );
      } else if (code === -32003 || msg.toLowerCase().includes('insufficient funds')) {
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
        toast.error(
          isHexOnly
            ? 'Mint failed. The contract reverted. This listing may already have been redeemed or the voucher is invalid.'
            : msg || 'Mint failed.'
        );
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

            {/* Buy at market (exact current pool price, like trading crypto) — when NFT has liquidity pool */}
            {hasLiquidityPool && address && (
              <div className="mt-6 pt-4 border-t border-gray-700 space-y-3">
                <p className="text-gray-400 text-sm">Buy at current market price (from liquidity pool)</p>
                <div className="flex items-center gap-3">
                  <label className="text-gray-400 text-sm">Pieces</label>
                  <input
                    type="number"
                    min={1}
                    value={marketBuyQuantity}
                    onChange={(e) => setMarketBuyQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-24 bg-black/50 border border-purple-500/40 rounded-lg px-3 py-2 text-white text-center focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <button
                  onClick={handleBuyAtMarket}
                  disabled={marketBuyLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FiDollarSign />
                  {marketBuyLoading ? 'Opening wallet…' : 'Buy at market price'}
                </button>
              </div>
            )}

            {/* Buy from orders (fill collector sell orders) */}
            {address && (nft?.itemId || nft?._id) && (
              <div className="mt-6 pt-4 border-t border-gray-700 space-y-3">
                <p className="text-gray-400 text-sm font-medium">Buy from orders</p>
                {sellOrdersLoading ? (
                  <p className="text-gray-500 text-sm">Loading orders…</p>
                ) : sellOrders.filter((o) => o.status === 'active' && (o.quantity - (o.filledQuantity || 0)) > 0).length === 0 ? (
                  <p className="text-gray-500 text-sm">No sell orders for this NFT.</p>
                ) : (
                  <ul className="space-y-2">
                    {sellOrders
                      .filter((o) => o.status === 'active' && (o.quantity - (o.filledQuantity || 0)) > 0)
                      .map((order) => {
                        const available = order.quantity - (order.filledQuantity || 0);
                        const price = parseFloat(order.pricePerPiece || 0);
                        const qty = fillOrderQty[order._id] ?? 1;
                        const total = (price * (typeof qty === 'number' ? qty : parseInt(qty, 10) || 1)).toFixed(4);
                        return (
                          <li
                            key={order._id}
                            className="flex flex-wrap items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                          >
                            <span className="text-gray-300 text-sm">
                              {price.toFixed(4)} {currency}/piece · {available} available
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={available}
                              value={qty}
                              onChange={(e) =>
                                setFillOrderQty((prev) => ({
                                  ...prev,
                                  [order._id]: Math.max(1, Math.min(available, parseInt(e.target.value, 10) || 1)),
                                }))
                              }
                              className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center text-sm"
                            />
                            <span className="text-gray-400 text-sm">= {total} {currency}</span>
                            <button
                              onClick={() => handleFillOrder(order, qty)}
                              disabled={fillOrderSubmitting === order._id}
                              className="ml-auto px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm disabled:opacity-50"
                            >
                              {fillOrderSubmitting === order._id ? 'Buying…' : 'Buy'}
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                )}
                <p className="text-gray-500 text-xs">
                  Filling an order updates holdings in the database. Payment to the seller may be arranged off-chain or via your platform.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
