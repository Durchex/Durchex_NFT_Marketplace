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
 * Dedicated Buy & Mint page – user pays the exact NFT price and mints (no offer modal).
 * For lazy-minted NFTs: buy and mint in one flow via LazyMint contract redeem.
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

  const isLazyMint = nft?.isLazyMint === true;

  const handleBuyAndMint = async () => {
    if (!nft || !address) {
      toast.error('Connect your wallet first.');
      return;
    }
    // API may return price in wei; normalize to decimal so wallet shows correct amount (not huge figure)
    const priceEth = priceInDecimalForBuy(nft.price);
    const priceWei = ethers.utils.parseEther(priceEth);
    const network = (nft.network || 'polygon').toLowerCase().trim();
    setMinting(true);
    try {
      if (isLazyMint) {
        const lazyNftId = (nft._id && nft._id.toString()) || id;

        if (!window.ethereum) {
          throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        await changeNetwork(network);
        await new Promise((r) => setTimeout(r, 500));

        const redemptionRes = await lazyMintAPI.redeem(lazyNftId, priceEth);
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
        const encodedData = iface.encodeFunctionData('redeemNFT', [
          redemptionData.creator,
          redemptionData.ipfsURI,
          redemptionData.royaltyPercentage,
          priceWei,
          sig,
        ]);

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const valueHex = ethers.BigNumber.isBigNumber(priceWei) ? priceWei.toHexString() : ethers.utils.hexValue(priceWei);

        const sendRawTx = async () => {
          return window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: address,
              to: lazyMintAddress,
              value: valueHex,
              data: encodedData,
              gasLimit: '0x493E0',
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
        let tokenId = null;
        const redeemedEvent = receipt.events?.find((e) => e.event === 'NFTRedeemed');
        if (redeemedEvent?.args?.tokenId != null) tokenId = redeemedEvent.args.tokenId.toString();
        if (tokenId == null && receipt.logs?.length) {
          const iface = new ethers.utils.Interface(LazyMintNFT_ABI);
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog(log);
              if (parsed?.name === 'NFTRedeemed' && parsed.args?.tokenId != null) {
                tokenId = parsed.args.tokenId.toString();
                break;
              }
            } catch (_) {}
          }
        }
        await lazyMintAPI.confirmRedemption(lazyNftId, {
          tokenId: tokenId || '0',
          transactionHash: receipt.transactionHash,
          salePrice: priceEth,
        });
        toast.success('NFT bought and minted successfully!');
        navigate(`/nft/${id}`);
        return;
      }
      const contractAddress =
        nft.contractAddress ||
        nft.nftContract ||
        getContractAddresses(network)?.vendor;
      if (!contractAddress) {
        toast.error('NFT contract not found for this network.');
        return;
      }
      const itemId = nft.itemId ?? nft.tokenId ?? nft._id;
      // buyNFT expects price in ETH (it uses parseEther internally); do not pass wei or the wallet will show an impossible figure
      await buyNFT(contractAddress, itemId, priceEth, network);
      toast.success('Minted successfully!');
      navigate(`/nft/${id}`);
    } catch (err) {
      console.error('Mint error:', err);
      const code = err?.code ?? err?.error?.code;
      const msg = String(err?.message || err?.error?.message || '');
      const token = getCurrencySymbol(network || 'ethereum');
      if (code === -32003 || msg.toLowerCase().includes('insufficient funds')) {
        toast.error(
          `Insufficient funds on ${network || 'this network'}. Your wallet has 0 ${token} on this network. Add ${token} for the purchase and gas, then try again.`
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
  const priceDisplay = parseFloat(priceInDecimalForBuy(nft.price)).toFixed(4);
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
